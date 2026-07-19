// export default UploadProductComponent;
import React, { useState, useRef } from "react";
import "../styles/UploadProductStyle.css";
import { IoClose } from "react-icons/io5";
import { FaCloudDownloadAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import productCategory from "../helpers/productCategory";
import uploadImage from "../helpers/uploadImage";
import SummaryApi from "../common";
import { toast } from "react-toastify";

const UploadProductComponent = ({ onClose, fatchData }) => {
  const [data, setData] = useState({
    productName: "",
    brandName: "",
    category: "",
    subCategory: "",
    description: "",
    price: "",
    selling: "",
    buyingPrice: "",
    trandingProduct: false,
    handCraft: false,
    salesOn: false,

    // product code
    productCodeNumber: "", // ! NEW
    // product quality
    qualityType: "",
    // size guide array (UI sits above Variants)
    sizeDetails: [],

    variants: [],

    skinCareInfo: {
      productType: "",
      ingredients: [],
      suitableSkinTypes: [],
      targetConcerns: [],
      avoidFor: [],
      usageTime: "",
      texture: "",
      isNonComedogenic: false,
    },

    // Product details top video
    productVideo: {
      url: "",
      thumbnail: "",
      autoplay: false,
      muted: true,
    },
  });

  const variantImageInputRefs = useRef([]);
  const videoFileInputRef = useRef(null);
  const videoThumbInputRef = useRef(null);

  const variantUploadLocksRef = useRef(new Set());
  const mediaUploadLocksRef = useRef({
    video: false,
    thumbnail: false,
  });

  const [uploadingVariants, setUploadingVariants] = useState({});
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasActiveUpload =
    uploadingVideo ||
    uploadingThumbnail ||
    Object.values(uploadingVariants).some(Boolean);

  const getUploadErrorMessage = (uploaded, fallback) => {
    const message = uploaded?.message || fallback;
    const details = [
      uploaded?.stage,
      uploaded?.status ? `HTTP ${uploaded.status}` : "",
      uploaded?.requestId ? `ID ${uploaded.requestId}` : "",
    ].filter(Boolean);

    return details.length
      ? `${message} [${details.join(" | ")}]`
      : message;
  };

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  // nested video setter
  const setVideoField = (key, value) => {
    setData((prev) => ({
      ...prev,
      productVideo: { ...prev.productVideo, [key]: value },
    }));
  };
    // skin care info
   const setSkinCareField = (key, value) => {
    setData((prev) => ({
      ...prev,
      skinCareInfo: { ...(prev.skinCareInfo || {}), [key]: value },
    }));
  };

  // ===== sizeDetails handlers =====
  const addSizeDetail = () => {
    setData((prev) => ({
      ...prev,
      sizeDetails: [
        ...prev.sizeDetails,
        { size: "", length: "", chest: "", unit: "inche" },
      ],
    }));
  };

  const removeSizeDetail = (index) => {
    setData((prev) => ({
      ...prev,
      sizeDetails: prev.sizeDetails.filter((_, i) => i !== index),
    }));
  };

  const handleSizeDetailChange = (index, field, value) => {
    const list = [...data.sizeDetails];
    if (field === "length" || field === "chest") {
      list[index][field] = value === "" ? "" : Number(value);
    } else {
      list[index][field] = value;
    }
    setData((prev) => ({ ...prev, sizeDetails: list }));
  };

  // ===== Variants =====
  const addVariant = () => {
    setData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          // 🔽 NEW special fields per variant
          SpcProductName: "",
          SpcPrice: "",
          SpcSelling: "",
          SpcBuyingPrice: "",
          // 🔽 existing fields
          color: "",
          images: [],
          sizes: [{ size: "", stock: "" }],
        },
      ],
    }));
  };

  const removeVariant = (index) => {
    setData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleVariantColorChange = (index, value) => {
    const newVariants = [...data.variants];
    newVariants[index].color = value;
    setData((prev) => ({ ...prev, variants: newVariants }));
  };

  // 🔥 NEW: Spc fields change handler
  const handleVariantSpcChange = (variantIndex, field, value) => {
    const newVariants = [...data.variants];
    newVariants[variantIndex][field] = value;
    setData((prev) => ({ ...prev, variants: newVariants }));
  };

  const addSizeToVariant = (variantIndex) => {
    const newVariants = [...data.variants];
    newVariants[variantIndex].sizes.push({ size: "", stock: "" });
    setData((prev) => ({ ...prev, variants: newVariants }));
  };

  const removeSizeFromVariant = (variantIndex, sizeIndex) => {
    const newVariants = [...data.variants];
    newVariants[variantIndex].sizes = newVariants[variantIndex].sizes.filter(
      (_, i) => i !== sizeIndex
    );
    setData((prev) => ({ ...prev, variants: newVariants }));
  };

  const handleSizeChange = (variantIndex, sizeIndex, field, value) => {
    const newVariants = [...data.variants];
    newVariants[variantIndex].sizes[sizeIndex][field] = value;
    setData((prev) => ({ ...prev, variants: newVariants }));
  };

  const handleUploadVariantImage = async (variantIndex, e) => {
    const input = e.target;
    const file = input.files?.[0];

    if (!file) return;

    if (variantUploadLocksRef.current.has(variantIndex)) {
      toast.info("This image upload is already running");
      return;
    }

    variantUploadLocksRef.current.add(variantIndex);
    setUploadingVariants((prev) => ({
      ...prev,
      [variantIndex]: true,
    }));

    try {
      const uploaded = await uploadImage(file, {
        mediaType: "product-image",
        productId: data?._id,
      });

      if (uploaded?.error) {
        toast.error(
          getUploadErrorMessage(
            uploaded,
            "Image upload failed"
          )
        );
        return;
      }

      setData((prev) => ({
        ...prev,
        variants: prev.variants.map((variant, index) =>
          index === variantIndex
            ? {
                ...variant,
                images: [
                  ...(variant.images || []),
                  uploaded.url,
                ],
              }
            : variant
        ),
      }));

      toast.success("Variant image uploaded");
    } catch (error) {
      console.error("Variant image upload error:", error);
      toast.error(error?.message || "Image upload failed");
    } finally {
      variantUploadLocksRef.current.delete(variantIndex);
      setUploadingVariants((prev) => ({
        ...prev,
        [variantIndex]: false,
      }));

      if (input) {
        input.value = "";
      }
    }
  };

  const handleDeleteVariantImage = (variantIndex, imgIndex) => {
    setData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, index) =>
        index === variantIndex
          ? {
              ...variant,
              images: (variant.images || []).filter(
                (_, imageIndex) => imageIndex !== imgIndex
              ),
            }
          : variant
      ),
    }));
  };

  // ===== Video upload handlers =====
  const handleUploadVideoFile = async (e) => {
    const input = e.target;
    const file = input.files?.[0];

    if (!file) return;

    if (mediaUploadLocksRef.current.video) {
      toast.info("Video upload is already running");
      return;
    }

    mediaUploadLocksRef.current.video = true;
    setUploadingVideo(true);

    try {
      const uploaded = await uploadImage(file, {
        mediaType: "product-video",
        productId: data?._id,
      });

      if (uploaded?.error) {
        toast.error(
          getUploadErrorMessage(
            uploaded,
            "Video upload failed"
          )
        );
        return;
      }

      if (!uploaded?.url) {
        toast.error("Video upload failed");
        return;
      }

      setVideoField("url", uploaded.url);
      toast.success("Video uploaded");
    } catch (error) {
      console.error("Video upload error:", error);
      toast.error(error?.message || "Video upload error");
    } finally {
      mediaUploadLocksRef.current.video = false;
      setUploadingVideo(false);

      if (input) {
        input.value = "";
      }
    }
  };

  const handleUploadVideoThumb = async (e) => {
    const input = e.target;
    const file = input.files?.[0];

    if (!file) return;

    if (mediaUploadLocksRef.current.thumbnail) {
      toast.info("Thumbnail upload is already running");
      return;
    }

    mediaUploadLocksRef.current.thumbnail = true;
    setUploadingThumbnail(true);

    try {
      const uploaded = await uploadImage(file, {
        mediaType: "video-thumbnail",
        productId: data?._id,
      });

      if (uploaded?.error) {
        toast.error(
          getUploadErrorMessage(
            uploaded,
            "Thumbnail upload failed"
          )
        );
        return;
      }

      if (!uploaded?.url) {
        toast.error("Thumbnail upload failed");
        return;
      }

      setVideoField("thumbnail", uploaded.url);
      toast.success("Thumbnail uploaded");
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      toast.error(error?.message || "Thumbnail upload failed");
    } finally {
      mediaUploadLocksRef.current.thumbnail = false;
      setUploadingThumbnail(false);

      if (input) {
        input.value = "";
      }
    }
  };

  // 🔥 NEW: delete handlers for video & thumbnail
  const handleDeleteVideo = () => {
    setData((prev) => ({
      ...prev,
      productVideo: { ...prev.productVideo, url: "" },
    }));
    toast.info("Video removed");
  };

  const handleDeleteVideoThumb = () => {
    setData((prev) => ({
      ...prev,
      productVideo: { ...prev.productVideo, thumbnail: "" },
    }));
    toast.info("Thumbnail removed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasActiveUpload) {
      toast.error(
        "Please wait until all media uploads are complete"
      );
      return;
    }

    if (!data.variants.length) {
      toast.error("Please add at least one variant");
      return;
    }

    const variantWithoutImageIndex =
      data.variants.findIndex(
        (variant) =>
          !Array.isArray(variant.images) ||
          variant.images.length === 0
      );

    if (variantWithoutImageIndex >= 0) {
      toast.error(
        `Please upload an image for variant ${
          variantWithoutImageIndex + 1
        }`
      );
      return;
    }

    const totalStock = data.variants.reduce(
      (sum, variant) => {
        const variantStock = (
          variant.sizes || []
        ).reduce((subSum, size) => {
          const stockNum = Number(size.stock);
          return (
            subSum +
            (Number.isNaN(stockNum)
              ? 0
              : stockNum)
          );
        }, 0);

        return sum + variantStock;
      },
      0
    );

    const splitToArray = (value = "") =>
      String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    const skin = data.skinCareInfo || {};

    const payload = {
      ...data,
      subCategory:
        data.subCategory?.trim() ||
        data.category,
      totalStock,
      productCodeNumber:
        typeof data.productCodeNumber ===
        "string"
          ? data.productCodeNumber.trim()
          : data.productCodeNumber,
      productVideo: {
        ...(data.productVideo || {}),
        url:
          typeof data.productVideo?.url ===
          "string"
            ? data.productVideo.url.trim()
            : "",
      },
      sizeDetails: (
        data.sizeDetails || []
      ).map((row) => ({
        size: (row.size || "").trim(),
        length:
          row.length === ""
            ? undefined
            : Number(row.length || 0),
        chest:
          row.chest === ""
            ? undefined
            : Number(row.chest || 0),
        unit: row.unit || "inche",
      })),
      skinCareInfo: {
        productType: (
          skin.productType || ""
        ).trim(),
        ingredients: Array.isArray(
          skin.ingredients
        )
          ? skin.ingredients
          : splitToArray(skin.ingredients),
        suitableSkinTypes: Array.isArray(
          skin.suitableSkinTypes
        )
          ? skin.suitableSkinTypes
          : splitToArray(
              skin.suitableSkinTypes
            ),
        targetConcerns: Array.isArray(
          skin.targetConcerns
        )
          ? skin.targetConcerns
          : splitToArray(
              skin.targetConcerns
            ),
        avoidFor: Array.isArray(
          skin.avoidFor
        )
          ? skin.avoidFor
          : splitToArray(skin.avoidFor),
        usageTime: (
          skin.usageTime || ""
        ).trim(),
        texture: (
          skin.texture || ""
        ).trim(),
        isNonComedogenic: Boolean(
          skin.isNonComedogenic
        ),
      },
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(
        SummaryApi.upload_product.url,
        {
          method:
            SummaryApi.upload_product.method,
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !result.success) {
        toast.error(
          result?.message ||
            `Product upload failed (HTTP ${response.status})`
        );
        return;
      }

      toast.success(
        result.message ||
          "Product uploaded successfully"
      );
      onClose();
      fatchData();
    } catch (error) {
      console.error(
        "Product submit failed:",
        error
      );
      toast.error(
        error?.message ||
          "Product upload failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Upload Product</h2>
          <div className="close-icon" onClick={onClose}>
            <IoClose />
          </div>
        </div>

        <form className="form-row" onSubmit={handleSubmit}>
          {/* Base product fields */}
          <label htmlFor="productName">Product Name:</label>
          <input
            type="text"
            id="productName"
            name="productName"
            placeholder="Enter product name"
            value={data.productName}
            required
            onChange={handleOnChange}
          />

          {/* ! NEW: Product Serial Number */}
          <label htmlFor="productCodeNumber">Product Serial Number:</label>
          <input
            type="text"
            id="productCodeNumber"
            name="productCodeNumber"
            placeholder="e.g., EG-TSH-2025-0001"
            value={data.productCodeNumber}
            onChange={handleOnChange}
            required
          />

          <label htmlFor="brandName">Brand Name:</label>
          <input
            type="text"
            id="brandName"
            name="brandName"
            placeholder="Enter brand name"
            value={data.brandName}
            onChange={handleOnChange}
          />

          <label htmlFor="category">Category:</label>
          <select
            name="category"
            value={data.category}
            onChange={handleOnChange}
            required
          >
            <option value="">Select category</option>
            {productCategory.map((el) => (
              <option key={el.value} value={el.value}>
                {el.label}
              </option>
            ))}
          </select>

          <label htmlFor="subCategory">Sub Category:</label>
          <input
            type="text"
            id="subCategory"
            name="subCategory"
            placeholder="Enter sub category"
            value={data.subCategory}
            onChange={handleOnChange}
          />
          {/* product quality type */}
          <label htmlFor="qualityType">Quality Type:</label>
          <select
            id="qualityType"
            name="qualityType"
            value={data.qualityType}
            onChange={handleOnChange}
          >
            <option value="">Select category</option>
            <option value="Normal">Normal</option>
            <option value="Good">Good</option>
            <option value="Premium">Premium</option>
            <option value="Luxury">Luxury</option>
          </select>

          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            rows={6}
            placeholder={`Origin: Bangladesh\nProduct Size:\nS, M, L`}
            value={data.description}
            onChange={handleOnChange}
          ></textarea>

          <label htmlFor="price">Normal Price:</label>
          <input
            type="number"
            id="price"
            name="price"
            placeholder="Enter price"
            value={data.price}
            required
            onChange={handleOnChange}
          />

          <label htmlFor="selling">Selling Price:</label>
          <input
            type="number"
            id="selling"
            name="selling"
            placeholder="Enter selling price"
            value={data.selling}
            required
            onChange={handleOnChange}
          />

          <label htmlFor="buyingPrice">Buying Price:</label>
          <input
            type="number"
            id="buyingPrice"
            name="buyingPrice"
            placeholder="Enter buying price"
            value={data.buyingPrice}
            required
            onChange={handleOnChange}
          />

          {/* switches */}
          <div className="switch-wrapper">
            <label className="switch-label">Trending Product?</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={Boolean(data.trandingProduct)}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    trandingProduct: e.target.checked,
                  }))
                }
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="switch-wrapper" style={{ marginTop: 10 }}>
            <label className="switch-label">Hand Craft?</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={Boolean(data.handCraft)}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    handCraft: e.target.checked,
                  }))
                }
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="switch-wrapper" style={{ marginTop: 10 }}>
            <label className="switch-label">Sales On?</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={Boolean(data.salesOn)}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    salesOn: e.target.checked,
                  }))
                }
              />
              <span className="slider round"></span>
            </label>
          </div>

          {/* Video Section */}
          <h3 style={{ marginTop: 20 }}>Product Video (Top of Details)</h3>

          {/* URL input */}
          <label htmlFor="videoUrl">Video URL (mp4/m3u8/YouTube/Vimeo):</label>
          <input
            type="text"
            id="videoUrl"
            placeholder="https://... (mp4, HLS, or YouTube/Vimeo link)"
            value={data.productVideo.url}
            onChange={(e) => setVideoField("url", e.target.value)}
          />

          {/* Upload video */}
          <div
            className="upload-section"
            onClick={() => {
              if (!uploadingVideo) {
                videoFileInputRef.current?.click();
              }
            }}
            aria-busy={uploadingVideo}
            style={{
              marginTop: 8,
              opacity: uploadingVideo ? 0.65 : 1,
              cursor: uploadingVideo ? "wait" : "pointer",
            }}
          >
            <FaCloudDownloadAlt className="upload-icon" />
            <p>
              {uploadingVideo
                ? "Uploading video..."
                : "Upload Video"}
            </p>
            <input
              type="file"
              accept="video/*"
              ref={videoFileInputRef}
              onChange={handleUploadVideoFile}
              disabled={uploadingVideo}
              style={{ display: "none" }}
            />
          </div>

          {/* Small preview card + delete */}
          {data.productVideo.url && (
            <div className="image-preview-grid" style={{ marginTop: 6 }}>
              <div
                className="image-preview-container"
                style={{ position: "relative" }}
              >
                {/^https?:\/\/.*\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(
                  data.productVideo.url
                ) ? (
                  <video
                    src={data.productVideo.url}
                    style={{
                      width: 120,
                      height: 70,
                      borderRadius: 8,
                      background: "#000",
                    }}
                    muted
                  />
                ) : data.productVideo.thumbnail ? (
                  <img
                    src={data.productVideo.thumbnail}
                    alt="video"
                    style={{
                      width: 120,
                      height: 70,
                      borderRadius: 8,
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 120,
                      height: 70,
                      borderRadius: 8,
                      background: "#111",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                    }}
                    title={data.productVideo.url}
                  >
                    Video
                  </div>
                )}

                <div className="delete-icon" onClick={handleDeleteVideo}>
                  <MdDelete />
                </div>
              </div>
            </div>
          )}

          {/* Thumbnail upload */}
          <label style={{ marginTop: 12 }}>Video Thumbnail (poster):</label>
          <div
            className="upload-section"
            onClick={() => {
              if (!uploadingThumbnail) {
                videoThumbInputRef.current?.click();
              }
            }}
            aria-busy={uploadingThumbnail}
            style={{
              opacity: uploadingThumbnail ? 0.65 : 1,
              cursor: uploadingThumbnail ? "wait" : "pointer",
            }}
          >
            <FaCloudDownloadAlt className="upload-icon" />
            <p>
              {uploadingThumbnail
                ? "Uploading thumbnail..."
                : "Upload Thumbnail (image)"}
            </p>
            <input
              type="file"
              accept="image/*,.heic,.heif"
              ref={videoThumbInputRef}
              onChange={handleUploadVideoThumb}
              disabled={uploadingThumbnail}
              style={{ display: "none" }}
            />
          </div>

          {/* Thumbnail small preview + delete */}
          {data.productVideo.thumbnail && (
            <div className="image-preview-grid" style={{ marginTop: 6 }}>
              <div className="image-preview-container">
                <img
                  src={data.productVideo.thumbnail}
                  alt="thumb"
                  className="preview-image"
                  style={{
                    width: 120,
                    height: 70,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
                <div className="delete-icon" onClick={handleDeleteVideoThumb}>
                  <MdDelete />
                </div>
              </div>
            </div>
          )}

          {/* Quick inline preview (big) */}
          {data.productVideo.url ? (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontWeight: "bold" }}>Preview:</p>
              {/^\s*https?:\/\/.*\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(
                data.productVideo.url
              ) ? (
                <video
                  src={data.productVideo.url}
                  poster={data.productVideo.thumbnail || undefined}
                  controls
                  style={{ width: "100%", borderRadius: 8 }}
                />
              ) : (
                <p style={{ color: "#666" }}>
                  This looks like a page link (e.g., YouTube/Vimeo). Preview may
                  not render here, but the app can embed it on details page.
                </p>
              )}
            </div>
          ) : null}

          {/* Size Details */}
          <h3 style={{ marginTop: 20 }}>Size Details (Top Section)</h3>
          <p style={{ color: "#666", marginTop: -4, marginBottom: 8 }}>
            Add size guide rows (e.g., M / length 28 / chest 38 / unit inche)
          </p>

          {data.sizeDetails.map((row, i) => (
  <div key={i} className="size-row">
    <input
      type="text"
      placeholder="Size (e.g., S/M/L)"
      value={row.size}
      onChange={(e) => handleSizeDetailChange(i, "size", e.target.value)}
    />

    <input
      type="number"
      placeholder="Length"
      min={0}
      value={row.length}
      onChange={(e) => handleSizeDetailChange(i, "length", e.target.value)}
    />

    <input
      type="number"
      placeholder="Chest"
      min={0}
      value={row.chest}
      onChange={(e) => handleSizeDetailChange(i, "chest", e.target.value)}
    />

    {/* <select
      value={row.unit || "inche"}
      onChange={(e) => handleSizeDetailChange(i, "unit", e.target.value)}
    >
      <option value="inche">inche</option>
    </select> */}

    <button
      type="button"
      className="danger-btn"
      onClick={() => removeSizeDetail(i)}
    >
      Remove Size Details
    </button>
  </div>
))}


          <button
            type="button"
            onClick={addSizeDetail}
            style={{ marginBottom: 16 }}
          >
            + Add Size Row
          </button>

          {/* Variants */}
          <h3>Variants (Color / Size / Stock)</h3>
          <p style={{ fontWeight: "bold", marginTop: "10px" }}>
            Total Stock:{" "}
            {data.variants.reduce(
              (sum, variant) =>
                sum +
                variant.sizes.reduce(
                  (s, size) => s + Number(size.stock || 0),
                  0
                ),
              0
            )}
          </p>

          {data.variants.map((variant, vIndex) => (
            <div
              key={vIndex}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "8px",
              }}
            >
              <label>Color:</label>
              <input
                type="text"
                value={variant.color}
                onChange={(e) =>
                  handleVariantColorChange(vIndex, e.target.value)
                }
                placeholder="Enter color"
              />

              {/* 🔽 NEW: Variant specific info */}
              <div className="variant-spc-grid">
  <div className="field">
    <label>Variant Name (SpcProductName)</label>
    <input
      type="text"
      placeholder="e.g., Red / M Set"
      value={variant.SpcProductName || ""}
      onChange={(e) =>
        handleVariantSpcChange(vIndex, "SpcProductName", e.target.value)
      }
    />
  </div>

  <div className="field">
    <label>Variant Buying Price</label>
    <input
      type="number"
      placeholder="SpcBuyingPrice"
      min={0}
      value={variant.SpcBuyingPrice || ""}
      onChange={(e) =>
        handleVariantSpcChange(vIndex, "SpcBuyingPrice", e.target.value)
      }
    />
  </div>

  <div className="field">
    <label>Variant Normal Price</label>
    <input
      type="number"
      placeholder="SpcPrice"
      min={0}
      value={variant.SpcPrice || ""}
      onChange={(e) => handleVariantSpcChange(vIndex, "SpcPrice", e.target.value)}
    />
  </div>

  <div className="field">
    <label>Variant Selling Price</label>
    <input
      type="number"
      placeholder="SpcSelling"
      min={0}
      value={variant.SpcSelling || ""}
      onChange={(e) =>
        handleVariantSpcChange(vIndex, "SpcSelling", e.target.value)
      }
    />
  </div>
</div>


              <label>Variant Images:</label>
              <div
                className="upload-section"
                onClick={() => {
                  if (!uploadingVariants[vIndex]) {
                    variantImageInputRefs.current[
                      vIndex
                    ]?.click();
                  }
                }}
                aria-busy={Boolean(
                  uploadingVariants[vIndex]
                )}
                style={{
                  opacity: uploadingVariants[
                    vIndex
                  ]
                    ? 0.65
                    : 1,
                  cursor: uploadingVariants[
                    vIndex
                  ]
                    ? "wait"
                    : "pointer",
                }}
              >
                <FaCloudDownloadAlt className="upload-icon" />
                <p>
                  {uploadingVariants[vIndex]
                    ? "Uploading image..."
                    : "Upload Images for this color variant"}
                </p>
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  multiple={false}
                  ref={(el) =>
                    (variantImageInputRefs.current[
                      vIndex
                    ] = el)
                  }
                  onChange={(e) =>
                    handleUploadVariantImage(
                      vIndex,
                      e
                    )
                  }
                  disabled={Boolean(
                    uploadingVariants[vIndex]
                  )}
                  style={{ display: "none" }}
                />
              </div>
              <div className="image-preview-grid" style={{ marginTop: "5px" }}>
                {variant.images.map((img, i) => (
                  <div key={i} className="image-preview-container">
                    <img src={img} alt="variant" className="preview-image" />
                    <div
                      className="delete-icon"
                      onClick={() => handleDeleteVariantImage(vIndex, i)}
                    >
                      <MdDelete />
                    </div>
                  </div>
                ))}
              </div>

              <label>Sizes and Stock:</label>
             {variant.sizes.map((sizeItem, sIndex) => (
  <div key={sIndex} className="variant-size-row">
    <input
      type="text"
      placeholder="Size"
      value={sizeItem.size}
      onChange={(e) => handleSizeChange(vIndex, sIndex, "size", e.target.value)}
    />

    <input
      type="number"
      placeholder="Stock"
      value={sizeItem.stock}
      min={0}
      required
      onChange={(e) => handleSizeChange(vIndex, sIndex, "stock", e.target.value)}
    />

    {variant.sizes.length > 1 && (
      <button
        type="button"
        className="danger-btn danger-btn-outline"
        onClick={() => removeSizeFromVariant(vIndex, sIndex)}
      >
        Remove Size & Stock
      </button>
    )}
  </div>
))}


              <button
                type="button"
                onClick={() => addSizeToVariant(vIndex)}
                style={{ marginBottom: "10px" }}
              >
                Add Size
              </button>

              <button
                type="button"
                onClick={() => removeVariant(vIndex)}
                disabled={Boolean(
                  uploadingVariants[vIndex]
                )}
                style={{
                  background: "red",
                  color: "white",
                  opacity: uploadingVariants[
                    vIndex
                  ]
                    ? 0.6
                    : 1,
                }}
              >
                Remove Variant
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addVariant}
            style={{ marginBottom: 20 }}
          >
            + Add Variant
          </button>


          <h3>Skin Care / Beauty Info (Optional)</h3>

          <label htmlFor="skinProductType">Product Type:</label>
          <input
            id="skinProductType"
            type="text"
            placeholder="e.g., Cleanser, Serum"
            value={data.skinCareInfo?.productType || ""}
            onChange={(e) => setSkinCareField("productType", e.target.value)}
          />

          <label htmlFor="skinIngredients">Ingredients (comma separated):</label>
          <input
            id="skinIngredients"
            type="text"
            placeholder="e.g., Niacinamide, Hyaluronic Acid"
            value={
              Array.isArray(data.skinCareInfo?.ingredients)
                ? data.skinCareInfo.ingredients.join(", ")
                : data.skinCareInfo?.ingredients || ""
            }
            onChange={(e) => setSkinCareField("ingredients", e.target.value)}
          />

          <label htmlFor="suitableSkinTypes">
            Suitable Skin Types (comma separated):
          </label>
          <input
            id="suitableSkinTypes"
            type="text"
            placeholder="e.g., Oily, Dry, Combination"
            value={
              Array.isArray(data.skinCareInfo?.suitableSkinTypes)
                ? data.skinCareInfo.suitableSkinTypes.join(", ")
                : data.skinCareInfo?.suitableSkinTypes || ""
            }
            onChange={(e) =>
              setSkinCareField("suitableSkinTypes", e.target.value)
            }
          />

          <label htmlFor="targetConcerns">Target Concerns (comma separated):</label>
          <input
            id="targetConcerns"
            type="text"
            placeholder="e.g., Acne, Dark spots"
            value={
              Array.isArray(data.skinCareInfo?.targetConcerns)
                ? data.skinCareInfo.targetConcerns.join(", ")
                : data.skinCareInfo?.targetConcerns || ""
            }
            onChange={(e) => setSkinCareField("targetConcerns", e.target.value)}
          />

          <label htmlFor="avoidFor">Avoid For (comma separated):</label>
          <input
            id="avoidFor"
            type="text"
            placeholder="e.g., Very sensitive skin"
            value={
              Array.isArray(data.skinCareInfo?.avoidFor)
                ? data.skinCareInfo.avoidFor.join(", ")
                : data.skinCareInfo?.avoidFor || ""
            }
            onChange={(e) => setSkinCareField("avoidFor", e.target.value)}
          />

          <label htmlFor="usageTime">Usage Time:</label>
          <input
            id="usageTime"
            type="text"
            placeholder="e.g., AM/PM"
            value={data.skinCareInfo?.usageTime || ""}
            onChange={(e) => setSkinCareField("usageTime", e.target.value)}
          />

          <label htmlFor="texture">Texture:</label>
          <input
            id="texture"
            type="text"
            placeholder="e.g., Gel, Cream"
            value={data.skinCareInfo?.texture || ""}
            onChange={(e) => setSkinCareField("texture", e.target.value)}
          />

          <div className="switch-wrapper" style={{ marginTop: 10 }}>
            <label className="switch-label">Non-Comedogenic?</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={Boolean(data.skinCareInfo?.isNonComedogenic)}
                onChange={(e) =>
                  setSkinCareField("isNonComedogenic", e.target.checked)
                }
              />
              <span className="slider round"></span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              isSubmitting || hasActiveUpload
            }
          >
            {isSubmitting
              ? "Saving product..."
              : hasActiveUpload
              ? "Waiting for media upload..."
              : "Upload Product"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadProductComponent;