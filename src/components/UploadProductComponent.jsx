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
        { color: "", images: [], sizes: [{ size: "", stock: "" }] },
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
    const file = e.target.files[0];
    if (!file) return;
    const uploaded = await uploadImage(file);
    if (uploaded?.error)
      return toast.error(uploaded.message || "Upload failed");
    const newVariants = [...data.variants];
    newVariants[variantIndex].images.push(uploaded.url);
    setData((prev) => ({ ...prev, variants: newVariants }));
  };

  const handleDeleteVariantImage = (variantIndex, imgIndex) => {
    const newVariants = [...data.variants];
    newVariants[variantIndex].images = newVariants[variantIndex].images.filter(
      (_, i) => i !== imgIndex
    );
    setData((prev) => ({ ...prev, variants: newVariants }));
  };

  // ===== Video upload handlers =====
  const handleUploadVideoFile = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const uploaded = await uploadImage(file);
      if (uploaded?.error)
        return toast.error(uploaded.message || "Video upload failed");
      if (uploaded?.url) {
        setVideoField("url", uploaded.url);
        toast.success("Video uploaded");
      } else {
        toast.error("Video upload failed");
      }
    } catch {
      toast.error("Video upload error");
    }
  };

  const handleUploadVideoThumb = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploaded = await uploadImage(file);
    if (uploaded?.error)
      return toast.error(uploaded.message || "Thumbnail upload failed");
    if (uploaded?.url) {
      setVideoField("thumbnail", uploaded.url);
      toast.success("Thumbnail uploaded");
    } else {
      toast.error("Thumbnail upload failed");
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

    if (!data.subCategory || data.subCategory.trim() === "") {
      data.subCategory = data.category;
    }

    // auto total stock
    const totalStock = data.variants.reduce((sum, variant) => {
      const variantStock = variant.sizes.reduce((subSum, size) => {
        const stockNum = Number(size.stock);
        return subSum + (isNaN(stockNum) ? 0 : stockNum);
      }, 0);
      return sum + variantStock;
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

    // optional: trim serial
    if (typeof data.productCodeNumber === "string") {
      data.productCodeNumber = data.productCodeNumber.trim();
    }

    const response = await fetch(SummaryApi.upload_product.url, {
      method: SummaryApi.upload_product.method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      toast.success(result.message);
      onClose();
      fatchData();
    } else if (result.error) {
      toast.error(result.message);
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
            rows={3}
            placeholder="Enter description"
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
            onClick={() => videoThumbInputRef.current?.click()}
          >
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
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
                gap: "8px",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
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
              <select
                value={row.unit || "inche"}
                onChange={(e) =>
                  handleSizeDetailChange(i, "unit", e.target.value)
                }
              >
                <option value="inche">inche</option>
              </select>

              <button
                type="button"
                onClick={() => removeSizeDetail(i)}
                style={{ background: "red", color: "white" }}
              >
                Remove
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

              <label>Variant Images:</label>
              <div
                className="upload-section"
                onClick={() => variantImageInputRefs.current[vIndex].click()}
              >
                <FaCloudDownloadAlt className="upload-icon" />
                <p>Upload Images for this color variant</p>
                <input
                  type="file"
                  multiple={false}
                  ref={(el) => (variantImageInputRefs.current[vIndex] = el)}
                  onChange={(e) => handleUploadVariantImage(vIndex, e)}
                  style={{ display: "none" }}
                  required
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
                <div
                  key={sIndex}
                  style={{ display: "flex", gap: "10px", marginBottom: "5px" }}
                >
                  <input
                    type="text"
                    placeholder="Size"
                    value={sizeItem.size}
                    onChange={(e) =>
                      handleSizeChange(vIndex, sIndex, "size", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={sizeItem.stock}
                    min={0}
                    required
                    onChange={(e) =>
                      handleSizeChange(vIndex, sIndex, "stock", e.target.value)
                    }
                  />
                  {variant.sizes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSizeFromVariant(vIndex, sIndex)}
                      style={{ background: "red", color: "white" }}
                    >
                      Remove
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
                style={{ background: "red", color: "white" }}
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

          <button type="submit" className="btn btn-primary">
            Upload Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadProductComponent;
