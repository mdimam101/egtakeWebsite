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
  // ---- DEFAULTS (exactly like Upload) ----
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
    productCodeNumber: "",
    qualityType: "",
    sizeDetails: [],
    variants: [],
    productVideo: { url: "", thumbnail: "", autoplay: false, muted: true },
  };

  // deep merge: paramData (if any) over uploadDefaults
  const initial = {
    ...uploadDefaults,
    ...paramData,
    // make sure nested objects/arrays exist even if missing
    sizeDetails: Array.isArray(paramData.sizeDetails)
      ? paramData.sizeDetails
      : uploadDefaults.sizeDetails,
    variants: Array.isArray(paramData.variants)
      ? paramData.variants.map((v) => ({
          color: v?.color || "",
          images: Array.isArray(v?.images) ? v.images : [],
          sizes: Array.isArray(v?.sizes) && v.sizes.length
            ? v.sizes.map((s) => ({
                size: s?.size ?? "",
                stock: s?.stock ?? "",
              }))
            : [{ size: "", stock: "" }],
        }))
      : uploadDefaults.variants, // <-- if no variants in DB, keep [] like Upload
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
    // numbers could be null/number in DB; keep editable as string
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

  // helpers
  const setVideoField = (key, value) =>
    setData((prev) => ({
      ...prev,
      productVideo: { ...prev.productVideo, [key]: value },
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
      sizeDetails: [...(p.sizeDetails || []), { size: "", length: "", chest: "", unit: "inche" }],
    }));

  const removeSizeDetail = (index) =>
    setData((p) => ({
      ...p,
      sizeDetails: (p.sizeDetails || []).filter((_, i) => i !== index),
    }));

  const handleSizeDetailChange = (i, field, value) => {
    const list = [...(data.sizeDetails || [])];
    if (field === "length" || field === "chest") {
      list[i][field] = value === "" ? "" : Number(value);
    } else {
      list[i][field] = value;
    }
    setData((p) => ({ ...p, sizeDetails: list }));
  };

  // variants
  const addVariant = () =>
    setData((p) => ({
      ...p,
      variants: [...(p.variants || []), { color: "", images: [], sizes: [{ size: "", stock: "" }] }],
    }));

  const removeVariant = (idx) =>
    setData((p) => ({
      ...p,
      variants: (p.variants || []).filter((_, i) => i !== idx),
    }));

  const handleVariantColorChange = (idx, value) => {
    const variants = [...(data.variants || [])];
    variants[idx].color = value;
    setData((p) => ({ ...p, variants }));
  };

  const addSizeToVariant = (vIdx) => {
    const variants = [...(data.variants || [])];
    variants[vIdx].sizes.push({ size: "", stock: "" });
    setData((p) => ({ ...p, variants }));
  };

  const removeSizeFromVariant = (vIdx, sIdx) => {
    const variants = [...(data.variants || [])];
    variants[vIdx].sizes = variants[vIdx].sizes.filter((_, i) => i !== sIdx);
    setData((p) => ({ ...p, variants }));
  };

  const handleSizeChange = (vIdx, sIdx, field, value) => {
    const variants = [...(data.variants || [])];
    variants[vIdx].sizes[sIdx][field] = value;
    setData((p) => ({ ...p, variants }));
  };

  // variant images
  const handleUploadVariantImage = async (vIdx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploaded = await uploadImage(file);
    if (uploaded?.error) return toast.error(uploaded.message || "Upload failed");

    const variants = [...(data.variants || [])];
    variants[vIdx].images.push(uploaded.url);
    setData((p) => ({ ...p, variants }));
    toast.success("Variant image uploaded");
  };

  const handleDeleteVariantImage = (vIdx, i) => {
    const variants = [...(data.variants || [])];
    variants[vIdx].images = variants[vIdx].images.filter((_, idx) => idx !== i);
    setData((p) => ({ ...p, variants }));
  };

  // video
  const handleUploadVideoFile = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const uploaded = await uploadImage(file);
      if (uploaded?.error) return toast.error(uploaded.message || "Video upload failed");
      if (uploaded?.url) {
        setVideoField("url", uploaded.url);
        toast.success("Video uploaded");
      } else toast.error("Video upload failed");
    } catch {
      toast.error("Video upload error");
    }
  };

  const handleUploadVideoThumb = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploaded = await uploadImage(file);
    if (uploaded?.error) return toast.error(uploaded.message || "Thumbnail upload failed");
    if (uploaded?.url) {
      setVideoField("thumbnail", uploaded.url);
      toast.success("Thumbnail uploaded");
    } else toast.error("Thumbnail upload failed");
  };

  const handleDeleteVideo = () => {
    setData((p) => ({ ...p, productVideo: { ...p.productVideo, url: "" } }));
    toast.info("Video removed");
  };

  const handleDeleteVideoThumb = () => {
    setData((p) => ({ ...p, productVideo: { ...p.productVideo, thumbnail: "" } }));
    toast.info("Thumbnail removed");
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // fallback subCategory
    if (!data.subCategory || data.subCategory.trim() === "") {
      data.subCategory = data.category;
    }

    // totalStock
    const totalStock = (data.variants || []).reduce((sum, v) => {
      const vs = (v.sizes || []).reduce((s, sz) => {
        const n = Number(sz.stock);
        return s + (isNaN(n) ? 0 : n);
      }, 0);
      return sum + vs;
    }, 0);
    data.totalStock = totalStock;

    if (data.productVideo?.url && typeof data.productVideo.url === "string") {
      data.productVideo.url = data.productVideo.url.trim();
    }

    data.sizeDetails = (data.sizeDetails || []).map((row) => ({
      size: (row.size || "").trim(),
      length: row.length === "" ? undefined : Number(row.length || 0),
      chest: row.chest === "" ? undefined : Number(row.chest || 0),
      unit: row.unit || "inche",
    }));

    if (typeof data.productCodeNumber === "string") {
      data.productCodeNumber = data.productCodeNumber.trim();
    }

    try {
      const response = await fetch(SummaryApi.update_product.url, {
        method: SummaryApi.update_product.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result?.success) {
        toast.success(result.message || "Product updated");
        onClose?.();
        fatchData?.();
      } else {
        toast.error(result?.message || "Update failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div
      className="modal-overlay"
      data-closeable="true"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Edit Product</h2>
          <div className="close-icon" onClick={onClose}>
            <IoClose />
          </div>
        </div>

        <form className="form-row" onSubmit={handleSubmit}>
          {/* Base fields (same as Upload) */}
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
            rows={3}
            placeholder="Enter description"
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

          {/* Switches (Upload-style) */}
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

          <div className="switch-wrapper" style={{ marginTop: 10 }}>
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

          <div className="switch-wrapper" style={{ marginTop: 10 }}>
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

          {/* VIDEO (exactly like Upload) */}
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
            onClick={() => videoFileInputRef.current?.click()}
            style={{ marginTop: 8 }}
          >
            <FaCloudDownloadAlt className="upload-icon" />
            <p>Upload Video (Cloudinary auto: image + video)</p>
            <input
              type="file"
              accept="video/*"
              ref={videoFileInputRef}
              onChange={handleUploadVideoFile}
              style={{ display: "none" }}
            />
          </div>

          {data.productVideo.url && (
            <div className="image-preview-grid" style={{ marginTop: 6 }}>
              <div className="image-preview-container" style={{ position: "relative" }}>
                {/^https?:\/\/.*\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(data.productVideo.url) ? (
                  <video
                    src={data.productVideo.url}
                    style={{ width: 120, height: 70, borderRadius: 8, background: "#000" }}
                    muted
                  />
                ) : data.productVideo.thumbnail ? (
                  <img
                    src={data.productVideo.thumbnail}
                    alt="video"
                    style={{ width: 120, height: 70, borderRadius: 8, objectFit: "cover" }}
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
          <div className="upload-section" onClick={() => videoThumbInputRef.current?.click()}>
            <FaCloudDownloadAlt className="upload-icon" />
            <p>Upload Thumbnail (image)</p>
            <input
              type="file"
              accept="image/*"
              ref={videoThumbInputRef}
              onChange={handleUploadVideoThumb}
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
                  style={{ width: 120, height: 70, objectFit: "cover", borderRadius: 8 }}
                />
                <div className="delete-icon" onClick={handleDeleteVideoThumb}>
                  <MdDelete />
                </div>
              </div>
            </div>
          )}

          {data.productVideo.url ? (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontWeight: "bold" }}>Preview:</p>
              {/^\s*https?:\/\/.*\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(data.productVideo.url) ? (
                <video
                  src={data.productVideo.url}
                  poster={data.productVideo.thumbnail || undefined}
                  controls
                  style={{ width: "100%", borderRadius: 8 }}
                />
              ) : (
                <p style={{ color: "#666" }}>
                  This looks like a page link (e.g., YouTube/Vimeo). Preview may not render here,
                  but the app can embed it on details page.
                </p>
              )}
            </div>
          ) : null}

          {/* SIZE DETAILS (Upload style) */}
          <h3 style={{ marginTop: 20 }}>Size Details (Top Section)</h3>
          <p style={{ color: "#666", marginTop: -4, marginBottom: 8 }}>
            Add size guide rows (e.g., M / length 28 / chest 38 / unit inche)
          </p>

          {(data.sizeDetails || []).map((row, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
                gap: 8,
                alignItems: "center",
                marginBottom: 8,
              }}
            >
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
              <select
                value={row.unit || "inche"}
                onChange={(e) => handleSizeDetailChange(i, "unit", e.target.value)}
              >
                <option value="inche">inche</option>
              </select>

              <button type="button" onClick={() => removeSizeDetail(i)} style={{ background: "red", color: "#fff" }}>
                Remove
              </button>
            </div>
          ))}

          <button type="button" onClick={addSizeDetail} style={{ marginBottom: 16 }}>
            + Add Size Row
          </button>

          {/* VARIANTS (Upload style) */}
          <h3>Variants (Color / Size / Stock)</h3>
          <p style={{ fontWeight: "bold", marginTop: 10 }}>
            Total Stock:{" "}
            {(data.variants || []).reduce(
              (sum, v) => sum + (v.sizes || []).reduce((s, sz) => s + Number(sz.stock || 0), 0),
              0
            )}
          </p>

          {(data.variants || []).map((variant, vIndex) => (
            <div key={vIndex} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10, borderRadius: 8 }}>
              <label>Color:</label>
              <input
                type="text"
                value={variant.color}
                onChange={(e) => handleVariantColorChange(vIndex, e.target.value)}
                placeholder="Enter color"
              />

              <label>Variant Images:</label>
              <div className="upload-section" onClick={() => variantImageInputRefs.current[vIndex]?.click()}>
                <FaCloudDownloadAlt className="upload-icon" />
                <p>Upload Images for this color variant</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple={false}
                  ref={(el) => (variantImageInputRefs.current[vIndex] = el)}
                  onChange={(e) => handleUploadVariantImage(vIndex, e)}
                  style={{ display: "none" }}
                />
              </div>

              <div className="image-preview-grid" style={{ marginTop: 5 }}>
                {(variant.images || []).map((img, i) => (
                  <div key={i} className="image-preview-container">
                    <img src={img} alt="variant" className="preview-image" />
                    <div className="delete-icon" onClick={() => handleDeleteVariantImage(vIndex, i)}>
                      <MdDelete />
                    </div>
                  </div>
                ))}
              </div>

              <label>Sizes and Stock:</label>
              {(variant.sizes || []).map((sz, sIndex) => (
                <div key={sIndex} style={{ display: "flex", gap: 10, marginBottom: 5 }}>
                  <input
                    type="text"
                    placeholder="Size"
                    value={sz.size}
                    onChange={(e) => handleSizeChange(vIndex, sIndex, "size", e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    min={0}
                    value={sz.stock}
                    onChange={(e) => handleSizeChange(vIndex, sIndex, "stock", e.target.value)}
                  />
                  {(variant.sizes || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSizeFromVariant(vIndex, sIndex)}
                      style={{ background: "red", color: "#fff" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <button type="button" onClick={() => addSizeToVariant(vIndex)} style={{ marginTop: 6 }}>
                Add Size
              </button>
              <button type="button" onClick={() => removeVariant(vIndex)} style={{ marginLeft: 10, background: "red", color: "#fff" }}>
                Remove Variant
              </button>
            </div>
          ))}

          <button type="button" onClick={addVariant} style={{ marginBottom: 20 }}>
            + Add Variant
          </button>

          <button type="submit" className="btn btn-primary">
            Update Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminProductEdit;
