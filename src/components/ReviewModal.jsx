import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import uploadImage from "../helpers/uploadImage";
import "../styles/ReviewModal.css";

const MAX_IMAGES = 5;

const ReviewModal = ({ open, product, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setRating(5);
    setComment("");
    setImages([]);
    setUploading(false);
    setSubmitting(false);
  }, [open, product?.itemId]);

  if (!open) return null;

  const addImages = async (event) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []).slice(0, MAX_IMAGES - images.length);
    if (!files.length) return;

    setUploading(true);
    const uploadedUrls = [];
    try {
      for (const file of files) {
        const result = await uploadImage(file, {
          mediaType: "product-image",
          productId: product.productId,
        });
        if (result?.url) uploadedUrls.push(result.url);
        else toast.error(result?.message || `Could not upload ${file.name}`);
      }
      setImages((current) => [...current, ...uploadedUrls].slice(0, MAX_IMAGES));
    } finally {
      // Keep Android photo-picker files attached until every asynchronous read is done.
      // Clearing the input earlier can revoke access to its content URI in some browsers.
      input.value = "";
      setUploading(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (uploading || submitting) return;
    setSubmitting(true);
    const succeeded = await onSubmit({ rating, comment: comment.trim(), images });
    setSubmitting(false);
    if (succeeded) onClose();
  };

  return (
    <div className="review-modal__overlay" role="presentation" onMouseDown={onClose}>
      <form
        className="review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={submitReview}
      >
        <button type="button" className="review-modal__close" onClick={onClose} aria-label="Close review form">×</button>
        <p className="review-modal__eyebrow">Verified purchase</p>
        <h2 id="review-modal-title">Review your product</h2>
        <p className="review-modal__product">{product.productName || "Product"}</p>

        <fieldset className="review-modal__rating">
          <legend>Your rating</legend>
          <div className="review-modal__stars" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={star <= rating ? "is-selected" : ""}
                onClick={() => setRating(star)}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
              >★</button>
            ))}
          </div>
          <span>{rating}/5</span>
        </fieldset>

        <label className="review-modal__label" htmlFor="review-comment">Comment</label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Share your experience with this product..."
          maxLength={1500}
          rows={5}
        />
        <div className="review-modal__count">{comment.length}/1500</div>

        <div className="review-modal__upload-row">
          <div><strong>Add photos</strong><span>Optional · up to {MAX_IMAGES}</span></div>
          <div className="review-modal__upload-buttons">
            <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={uploading || images.length >= MAX_IMAGES}>
              {uploading ? "Uploading…" : "Take photo"}
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || images.length >= MAX_IMAGES}>
              Choose photos
            </button>
          </div>
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={addImages} />
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple hidden onChange={addImages} />
        </div>

        {images.length > 0 && (
          <div className="review-modal__previews">
            {images.map((url) => (
              <div key={url}>
                <img src={url} alt="Review upload preview" />
                <button type="button" onClick={() => setImages((current) => current.filter((image) => image !== url))} aria-label="Remove photo">×</button>
              </div>
            ))}
          </div>
        )}

        <div className="review-modal__actions">
          <button type="button" className="review-modal__cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="review-modal__submit" disabled={uploading || submitting}>
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewModal;
