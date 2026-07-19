import React, { useRef, useState } from "react";
import "../styles/UploadProductStyle.css";
import { IoClose } from "react-icons/io5";
import { FaCloudDownloadAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import productCategory from "../helpers/productCategory";
import uploadImage from "../helpers/uploadImage";
import SummaryApi from "../common";
import { toast } from "react-toastify";

const AdminProductEdit = ({ onClose, paramData = {}, fatchData }) => {
  // ---- DEFAULTS (same as Upload) ----
  const uploadDefaults = {
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
    isPublished: true,
    productCodeNumber: "",
    qualityType: "",
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
    productVideo: { url: "", thumbnail: "", autoplay: false, muted: true },
  };

  // deep merge: paramData (if any) over uploadDefaults
  const initial = {
    ...uploadDefaults,
    ...paramData,

    // sizeDetails always array
    sizeDetails: Array.isArray(paramData.sizeDetails)
      ? paramData.sizeDetails
      : uploadDefaults.sizeDetails,

    // variants with Spc* fields + sizes/images safe defaults
    variants: Array.isArray(paramData.variants)
      ? paramData.variants.map((v) => ({
          // 🔽 NEW special fields
          SpcProductName: v?.SpcProductName || "",
          SpcPrice: v?.SpcPrice === 0 || v?.SpcPrice ? String(v.SpcPrice) : "",
          SpcSelling:
            v?.SpcSelling === 0 || v?.SpcSelling ? String(v.SpcSelling) : "",
          SpcBuyingPrice:
            v?.SpcBuyingPrice === 0 || v?.SpcBuyingPrice
              ? String(v.SpcBuyingPrice)
              : "",
          // old fields
          color: v?.color || "",
          images: Array.isArray(v?.images) ? v.images : [],
          sizes:
            Array.isArray(v?.sizes) && v.sizes.length
              ? v.sizes.map((s) => ({
                  size: s?.size ?? "",
                  stock: s?.stock === 0 || s?.stock ? String(s.stock) : "",
                }))
              : [{ size: "", stock: "" }],
        }))
      : uploadDefaults.variants,

    // productVideo safe defaults
    productVideo: {
      url: paramData?.productVideo?.url || "",
      thumbnail: paramData?.productVideo?.thumbnail || "",
      autoplay:
        typeof paramData?.productVideo?.autoplay === "boolean"
          ? paramData.productVideo.autoplay
          : false,
      muted:
        typeof paramData?.productVideo?.muted === "boolean"
          ? paramData.productVideo.muted
          : true,
    },
    // skin care info
    skinCareInfo: {
      ...uploadDefaults.skinCareInfo,
      ...(paramData?.skinCareInfo || {}),
      ingredients: Array.isArray(paramData?.skinCareInfo?.ingredients)
        ? paramData.skinCareInfo.ingredients
        : [],
      suitableSkinTypes: Array.isArray(paramData?.skinCareInfo?.suitableSkinTypes)
        ? paramData.skinCareInfo.suitableSkinTypes
        : [],
      targetConcerns: Array.isArray(paramData?.skinCareInfo?.targetConcerns)
        ? paramData.skinCareInfo.targetConcerns
        : [],
      avoidFor: Array.isArray(paramData?.skinCareInfo?.avoidFor)
        ? paramData.skinCareInfo.avoidFor
        : [],
    },
    // product published unpublished
    isPublished:
      typeof paramData.isPublished === "boolean" ? paramData.isPublished : true,

    // numbers keep as editable string
    price:
      paramData.price === 0 || paramData.price ? String(paramData.price) : "",
    selling:
      paramData.selling === 0 || paramData.selling
        ? String(paramData.selling)
        : "",
    buyingPrice:
      paramData.buyingPrice === 0 || paramData.buyingPrice
        ? String(paramData.buyingPrice)
        : "",
  };

  const [data, setData] = useState(initial);

  // refs
  const variantImageInputRefs = useRef([]);
  const videoFileInputRef = useRef(null);
  const videoThumbInputRef = useRef(null);
  const variantUploadLocksRef = useRef(new Set());
  const mediaUploadLocksRef = useRef({
    video: false,
    thumbnail: false,
  });

  // upload states
  const [uploadingVariants, setUploadingVariants] = useState({});
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasActiveUpload =
    uploadingVideo ||
    uploadingThumb ||
    Object.values(uploadingVariants).some(Boolean);

  const getProductId = () => data?._id || paramData?._id;

  // helpers
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

  const setVideoField = (key, value) =>
    setData((prev) => ({
      ...prev,
      productVideo: { ...prev.productVideo, [key]: value },
    }));

  const setSkinCareField = (key, value) =>
    setData((prev) => ({
      ...prev,
      skinCareInfo: { ...(prev.skinCareInfo || {}), [key]: value },
    }));

  const handleOnChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // sizeDetails
  const addSizeDetail = () =>
    setData((p) => ({
      ...p,
      sizeDetails: [
        ...(p.sizeDetails || []),
        { size: "", length: "", chest: "", unit: "inche" },
      ],
    }));

  const removeSizeDetail = (index) =>
    setData((p) => ({
      ...p,
      sizeDetails: (p.sizeDetails || []).filter((_, i) => i !== index),
    }));

  const handleSizeDetailChange = (i, field, value) => {
    setData((prev) => ({
      ...prev,
      sizeDetails: (prev.sizeDetails || []).map((row, index) =>
        index === i
          ? {
              ...row,
              [field]:
                field === "length" || field === "chest"
                  ? value === ""
                    ? ""
                    : Number(value)
                  : value,
            }
          : row
      ),
    }));
  };

  // ===== Variants =====
  const addVariant = () =>
    setData((p) => ({
      ...p,
      variants: [
        ...(p.variants || []),
        {
          // 🔽 NEW special fields per variant
          SpcProductName: "",
          SpcPrice: "",
          SpcSelling: "",
          SpcBuyingPrice: "",
          // existing fields
          color: "",
          images: [],
          sizes: [{ size: "", stock: "" }],
        },
      ],
    }));

  const removeVariant = (idx) =>
    setData((p) => ({
      ...p,
      variants: (p.variants || []).filter((_, i) => i !== idx),
    }));

  const handleVariantColorChange = (idx, value) => {
    setData((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((variant, index) =>
        index === idx
          ? { ...variant, color: value }
          : variant
      ),
    }));
  };

  // 🔥 Spc fields change handler
  const handleVariantSpcChange = (variantIndex, field, value) => {
    setData((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((variant, index) =>
        index === variantIndex
          ? { ...variant, [field]: value }
          : variant
      ),
    }));
  };

  const addSizeToVariant = (vIdx) => {
    setData((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((variant, index) =>
        index === vIdx
          ? {
              ...variant,
              sizes: [
                ...(variant.sizes || []),
                { size: "", stock: "" },
              ],
            }
          : variant
      ),
    }));
  };

  const removeSizeFromVariant = (vIdx, sIdx) => {
    setData((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((variant, index) =>
        index === vIdx
          ? {
              ...variant,
              sizes: (variant.sizes || []).filter(
                (_, sizeIndex) => sizeIndex !== sIdx
              ),
            }
          : variant
      ),
    }));
  };

  const handleSizeChange = (vIdx, sIdx, field, value) => {
    setData((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((variant, variantIndex) =>
        variantIndex === vIdx
          ? {
              ...variant,
              sizes: (variant.sizes || []).map((size, sizeIndex) =>
                sizeIndex === sIdx
                  ? { ...size, [field]: value }
                  : size
              ),
            }
          : variant
      ),
    }));
  };

  // variant images
  const handleUploadVariantImage = async (vIdx, e) => {
    const input = e.target;
    const file = input.files?.[0];

    if (!file) return;

    const productId = getProductId();

    if (!productId) {
      input.value = "";
      toast.error("Product ID missing. Please save product first.");
      return;
    }

    if (variantUploadLocksRef.current.has(vIdx)) {
      toast.info("This image upload is already running");
      input.value = "";
      return;
    }

    variantUploadLocksRef.current.add(vIdx);
    setUploadingVariants((prev) => ({
      ...prev,
      [vIdx]: true,
    }));

    try {
      const uploaded = await uploadImage(file, {
        mediaType: "product-image",
        productId,
      });

      if (uploaded?.error || !uploaded?.url) {
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
        variants: (prev.variants || []).map((variant, index) =>
          index === vIdx
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
      variantUploadLocksRef.current.delete(vIdx);
      setUploadingVariants((prev) => ({
        ...prev,
        [vIdx]: false,
      }));
      input.value = "";
    }
  };

  const handleDeleteVariantImage = (vIdx, i) => {
    setData((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((variant, index) =>
        index === vIdx
          ? {
              ...variant,
              images: (variant.images || []).filter((_, idx) => idx !== i),
            }
          : variant
      ),
    }));

    toast.info("Image removed");
  };

  // video
  const handleUploadVideoFile = async (e) => {
    const input = e.target;
    const file = input.files?.[0];

    if (!file) return;

    const productId = getProductId();

    if (!productId) {
      input.value = "";
      toast.error("Product ID missing. Please save product first.");
      return;
    }

    if (mediaUploadLocksRef.current.video) {
      toast.info("Video upload is already running");
      input.value = "";
      return;
    }

    mediaUploadLocksRef.current.video = true;
    setUploadingVideo(true);

    try {
      const uploaded = await uploadImage(file, {
        mediaType: "product-video",
        productId,
      });

      if (uploaded?.error || !uploaded?.url) {
        toast.error(
          getUploadErrorMessage(
            uploaded,
            "Video upload failed"
          )
        );
        return;
      }

      setVideoField("url", uploaded.url);
      toast.success("Video uploaded");
    } catch (error) {
      console.error("Video upload error:", error);
      toast.error(error?.message || "Video upload failed");
    } finally {
      mediaUploadLocksRef.current.video = false;
      setUploadingVideo(false);
      input.value = "";
    }
  };

  const handleUploadVideoThumb = async (e) => {
    const input = e.target;
    const file = input.files?.[0];

    if (!file) return;

    const productId = getProductId();

    if (!productId) {
      input.value = "";
      toast.error("Product ID missing. Please save product first.");
      return;
    }

    if (mediaUploadLocksRef.current.thumbnail) {
      toast.info("Thumbnail upload is already running");
      input.value = "";
      return;
    }

    mediaUploadLocksRef.current.thumbnail = true;
    setUploadingThumb(true);

    try {
      const uploaded = await uploadImage(file, {
        mediaType: "video-thumbnail",
        productId,
      });

      if (uploaded?.error || !uploaded?.url) {
        toast.error(
          getUploadErrorMessage(
            uploaded,
            "Thumbnail upload failed"
          )
        );
        return;
      }

      setVideoField("thumbnail", uploaded.url);
      toast.success("Thumbnail uploaded");
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      toast.error(error?.message || "Thumbnail upload failed");
    } finally {
      mediaUploadLocksRef.current.thumbnail = false;
      setUploadingThumb(false);
      input.value = "";
    }
  };

  const handleDeleteVideo = () => {
    setData((p) => ({
      ...p,
      productVideo: { ...p.productVideo, url: "" },
    }));
    toast.info("Video removed");
  };

  const handleDeleteVideoThumb = () => {
    setData((p) => ({
      ...p,
      productVideo: { ...p.productVideo, thumbnail: "" },
    }));
    toast.info("Thumbnail removed");
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasActiveUpload) {
      toast.error("Please wait until all media uploads are complete");
      return;
    }

    if (isSubmitting) {
      return;
    }

    const totalStock = (data.variants || []).reduce((sum, variant) => {
      const variantStock = (variant.sizes || []).reduce((subSum, size) => {
        const stockNumber = Number(size.stock);
        return subSum + (Number.isNaN(stockNumber) ? 0 : stockNumber);
      }, 0);

      return sum + variantStock;
    }, 0);

    const splitToArray = (value = "") =>
      String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    const skin = data.skinCareInfo || {};

    const payload = {
      ...data,
      subCategory: data.subCategory?.trim() || data.category,
      totalStock,
      productCodeNumber:
        typeof data.productCodeNumber === "string"
          ? data.productCodeNumber.trim()
          : data.productCodeNumber,
      productVideo: {
        ...(data.productVideo || {}),
        url:
          typeof data.productVideo?.url === "string"
            ? data.productVideo.url.trim()
            : "",
      },
      sizeDetails: (data.sizeDetails || []).map((row) => ({
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
        productType: (skin.productType || "").trim(),
        ingredients: Array.isArray(skin.ingredients)
          ? skin.ingredients
          : splitToArray(skin.ingredients),
        suitableSkinTypes: Array.isArray(skin.suitableSkinTypes)
          ? skin.suitableSkinTypes
          : splitToArray(skin.suitableSkinTypes),
        targetConcerns: Array.isArray(skin.targetConcerns)
          ? skin.targetConcerns
          : splitToArray(skin.targetConcerns),
        avoidFor: Array.isArray(skin.avoidFor)
          ? skin.avoidFor
          : splitToArray(skin.avoidFor),
        usageTime: (skin.usageTime || "").trim(),
        texture: (skin.texture || "").trim(),
        isNonComedogenic: Boolean(skin.isNonComedogenic),
      },
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(SummaryApi.update_product.url, {
        method: SummaryApi.update_product.method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.success) {
        toast.error(
          result?.message ||
            `Update failed (HTTP ${response.status})`
        );
        return;
      }

      toast.success(result.message || "Product updated");
      onClose?.();
      fatchData?.();
    } catch (error) {
      console.error("Product update failed:", error);
      toast.error(error?.message || "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" data-closeable="true" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Product</h2>
          <div className="close-icon" onClick={onClose}>
            <IoClose />
          </div>
        </div>

        <form className="form-row" onSubmit={handleSubmit}>
          {/* Base fields */}
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
          />

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

          {/* Switches (same UI) */}
          <div className="switch-wrapper">
            <label className="switch-label">Trending Product?</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={Boolean(data.trandingProduct)}
                name="trandingProduct"
                onChange={handleOnChange}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="switch-wrapper">
            <label className="switch-label">Hand Craft?</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={Boolean(data.handCraft)}
                name="handCraft"
                onChange={handleOnChange}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="switch-wrapper">
            <label className="switch-label">Sales On?</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={Boolean(data.salesOn)}
                name="salesOn"
                onChange={handleOnChange}
              />
              <span className="slider round"></span>
            </label>
          </div>

          {/* published switch */}
          <div className="switch-wrapper">
            <label className="switch-label">Published?</label>
            <label className="switch">
              <input
                type="checkbox"
                checked={Boolean(data.isPublished)}
                name="isPublished"
                onChange={handleOnChange}
              />
              <span className="slider round"></span>
            </label>
          </div>

          {/* Video Section */}
          <h3 style={{ marginTop: 20 }}>Product Video (Top of Details)</h3>

          <label htmlFor="videoUrl">Video URL (mp4/m3u8/YouTube/Vimeo):</label>
          <input
            type="text"
            id="videoUrl"
            placeholder="https://... (mp4, HLS, or YouTube/Vimeo link)"
            value={data.productVideo.url}
            onChange={(e) => setVideoField("url", e.target.value)}
          />

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
                : "Upload Video (AWS S3)"}
            </p>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              ref={videoFileInputRef}
              onChange={handleUploadVideoFile}
              disabled={uploadingVideo}
              style={{ display: "none" }}
            />
          </div>

          {data.productVideo.url && (
            <div className="image-preview-grid" style={{ marginTop: 6 }}>
              <div
                className="image-preview-container"
                style={{ position: "relative" }}
              >
                {/^\s*https?:\/\/.*\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(
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

          <label style={{ marginTop: 12 }}>Video Thumbnail (poster):</label>
          <div
            className="upload-section"
            onClick={() => {
              if (!uploadingThumb) {
                videoThumbInputRef.current?.click();
              }
            }}
            aria-busy={uploadingThumb}
            style={{
              opacity: uploadingThumb ? 0.65 : 1,
              cursor: uploadingThumb ? "wait" : "pointer",
            }}
          >
            <FaCloudDownloadAlt className="upload-icon" />
            <p>
              {uploadingThumb
                ? "Uploading thumbnail..."
                : "Upload Thumbnail (image)"}
            </p>
            <input
              type="file"
              accept="image/*,.heic,.heif"
              ref={videoThumbInputRef}
              onChange={handleUploadVideoThumb}
              disabled={uploadingThumb}
              style={{ display: "none" }}
            />
          </div>

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

          {/* Size Details */}
          <h3 style={{ marginTop: 20 }}>Size Details (Top Section)</h3>
          <p style={{ color: "#666", marginTop: -4, marginBottom: 8 }}>
            Add size guide rows (e.g., M / length 28 / chest 38 / unit inche)
          </p>

          {(data.sizeDetails || []).map((row, i) => (
            <div key={i} className="size-row">
              <input
                type="text"
                placeholder="Size (e.g., S/M/L)"
                value={row.size}
                onChange={(e) =>
                  handleSizeDetailChange(i, "size", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Length"
                min={0}
                value={row.length}
                onChange={(e) =>
                  handleSizeDetailChange(i, "length", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Chest"
                min={0}
                value={row.chest}
                onChange={(e) =>
                  handleSizeDetailChange(i, "chest", e.target.value)
                }
              />
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
          <p style={{ fontWeight: "bold", marginTop: 10 }}>
            Total Stock:{" "}
            {(data.variants || []).reduce(
              (sum, v) =>
                sum +
                (v.sizes || []).reduce((s, sz) => s + Number(sz.stock || 0), 0),
              0
            )}
          </p>

          {(data.variants || []).map((variant, vIndex) => (
            <div
              key={vIndex}
              style={{
                border: "1px solid #eef1f6",
                padding: 12,
                marginBottom: 12,
                borderRadius: 14,
                background: "#fff",
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

              <div className="variant-spc-grid">
                <div className="field">
                  <label>Variant Name (SpcProductName)</label>
                  <input
                    type="text"
                    placeholder="e.g., Red / M Set"
                    value={variant.SpcProductName || ""}
                    onChange={(e) =>
                      handleVariantSpcChange(
                        vIndex,
                        "SpcProductName",
                        e.target.value
                      )
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
                      handleVariantSpcChange(
                        vIndex,
                        "SpcBuyingPrice",
                        e.target.value
                      )
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
                    onChange={(e) =>
                      handleVariantSpcChange(vIndex, "SpcPrice", e.target.value)
                    }
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
                      handleVariantSpcChange(
                        vIndex,
                        "SpcSelling",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              <label>Variant Images:</label>
              <div
                className="upload-section variant-upload"
                onClick={() => {
                  if (!uploadingVariants[vIndex]) {
                    variantImageInputRefs.current[vIndex]?.click();
                  }
                }}
                aria-busy={Boolean(uploadingVariants[vIndex])}
                style={{
                  opacity: uploadingVariants[vIndex] ? 0.65 : 1,
                  cursor: uploadingVariants[vIndex] ? "wait" : "pointer",
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
                  ref={(el) => (variantImageInputRefs.current[vIndex] = el)}
                  onChange={(e) => handleUploadVariantImage(vIndex, e)}
                  disabled={Boolean(uploadingVariants[vIndex])}
                  style={{ display: "none" }}
                />
              </div>

              <div className="image-preview-grid" style={{ marginTop: 8 }}>
                {(variant.images || []).map((img, i) => (
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
              {(variant.sizes || []).map((sz, sIndex) => (
                <div key={sIndex} className="variant-size-row">
                  <input
                    type="text"
                    placeholder="Size"
                    value={sz.size}
                    onChange={(e) =>
                      handleSizeChange(vIndex, sIndex, "size", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    min={0}
                    value={sz.stock}
                    onChange={(e) =>
                      handleSizeChange(vIndex, sIndex, "stock", e.target.value)
                    }
                  />
                  {(variant.sizes || []).length > 1 && (
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

              <button type="button" onClick={() => addSizeToVariant(vIndex)}>
                Add Size
              </button>

              <button
                type="button"
                className="danger-btn"
                onClick={() => removeVariant(vIndex)}
                style={{ marginTop: 8 }}
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

          <label htmlFor="editSkinProductType">Product Type:</label>
          <input
            id="editSkinProductType"
            type="text"
            placeholder="e.g., Cleanser, Serum"
            value={data.skinCareInfo?.productType || ""}
            onChange={(e) => setSkinCareField("productType", e.target.value)}
          />

          <label htmlFor="editSkinIngredients">
            Ingredients (comma separated):
          </label>
          <input
            id="editSkinIngredients"
            type="text"
            placeholder="e.g., Niacinamide, Hyaluronic Acid"
            value={
              Array.isArray(data.skinCareInfo?.ingredients)
                ? data.skinCareInfo.ingredients.join(", ")
                : data.skinCareInfo?.ingredients || ""
            }
            onChange={(e) => setSkinCareField("ingredients", e.target.value)}
          />

          <label htmlFor="editSuitableSkinTypes">
            Suitable Skin Types (comma separated):
          </label>
          <input
            id="editSuitableSkinTypes"
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

          <label htmlFor="editTargetConcerns">
            Target Concerns (comma separated):
          </label>
          <input
            id="editTargetConcerns"
            type="text"
            placeholder="e.g., Acne, Dark spots"
            value={
              Array.isArray(data.skinCareInfo?.targetConcerns)
                ? data.skinCareInfo.targetConcerns.join(", ")
                : data.skinCareInfo?.targetConcerns || ""
            }
            onChange={(e) => setSkinCareField("targetConcerns", e.target.value)}
          />

          <label htmlFor="editAvoidFor">Avoid For (comma separated):</label>
          <input
            id="editAvoidFor"
            type="text"
            placeholder="e.g., Very sensitive skin"
            value={
              Array.isArray(data.skinCareInfo?.avoidFor)
                ? data.skinCareInfo.avoidFor.join(", ")
                : data.skinCareInfo?.avoidFor || ""
            }
            onChange={(e) => setSkinCareField("avoidFor", e.target.value)}
          />

          <label htmlFor="editUsageTime">Usage Time:</label>
          <input
            id="editUsageTime"
            type="text"
            placeholder="e.g., AM/PM"
            value={data.skinCareInfo?.usageTime || ""}
            onChange={(e) => setSkinCareField("usageTime", e.target.value)}
          />

          <label htmlFor="editTexture">Texture:</label>
          <input
            id="editTexture"
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
            disabled={hasActiveUpload || isSubmitting}
            style={{
              opacity: hasActiveUpload || isSubmitting ? 0.65 : 1,
              cursor:
                hasActiveUpload || isSubmitting
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {isSubmitting
              ? "Updating Product..."
              : hasActiveUpload
              ? "Please wait for uploads..."
              : "Update Product"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminProductEdit;