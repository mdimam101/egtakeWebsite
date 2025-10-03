import React, { useState, useRef } from "react";
import "../styles/UploadProductStyle.css";
import { IoClose } from "react-icons/io5";
import { FaCloudDownloadAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import productCategory from "../helpers/productCategory";
import uploadImage from "../helpers/uploadImage";
import SummaryApi from "../common";
import { toast } from "react-toastify";
import productSize from "../helpers/productSize";
import trandingProductBoolean from "../helpers/trandingProduct";

const AdminProductEdit = ({onClose, paramData, fatchData}) => {
     // paramData থেকে যদি variants না থাকে, তাহলে default দিয়ে দিতে হবে
  const [data, setData] = useState({
    ...paramData,
    productImg: paramData?.productImg || [],
    variants: paramData?.variants || [
      // Default একটা variant দিয়ে শুরু (একটা রঙ, ছবি, size আর stock)
      {
        color: paramData?.color || "",
        images: paramData?.productImg || [],
        sizes: paramData?.size
          ? [{ size: paramData.size, stock: paramData.stock || 0 }]
          : [],
      },
    ],
    trandingProduct: paramData?.trandingProduct,
    description: paramData?.description,
    price: paramData?.price,
    selling: paramData?.selling,
    productName: paramData?.productName,
    brandName: paramData?.brandName,
    category: paramData?.category,
    subCategory: paramData?.subCategory,
  });

  const fileInputRef = useRef(null);
  const variantImageInputRef = useRef(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // সাধারণ input change handler
  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  // Variant এর color change
  const handleVariantColorChange = (index, value) => {
    const updatedVariants = [...data.variants];
    updatedVariants[index].color = value;
    setData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  // Variant এর size এবং stock change
  const handleVariantSizeChange = (variantIndex, sizeIndex, field, value) => {
    const updatedVariants = [...data.variants];
    updatedVariants[variantIndex].sizes[sizeIndex][field] = value;
    setData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  // Variant add new size
  const addSizeToVariant = (variantIndex) => {
    const updatedVariants = [...data.variants];
    updatedVariants[variantIndex].sizes.push({ size: "", stock: 0 });
    setData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  // Variant remove size
  const removeSizeFromVariant = (variantIndex, sizeIndex) => {
    const updatedVariants = [...data.variants];
    updatedVariants[variantIndex].sizes.splice(sizeIndex, 1);
    setData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  // Add new variant
  const addVariant = () => {
    setData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { color: "", images: [], sizes: [{ size: "", stock: 0 }] },
      ],
    }));
    setSelectedVariantIndex(data.variants.length); // নতুন variant select করো
  };

  // Delete variant
  const removeVariant = (index) => {
    const updatedVariants = [...data.variants];
    updatedVariants.splice(index, 1);
    setData((prev) => ({ ...prev, variants: updatedVariants }));
    setSelectedVariantIndex(0);
  };

  // Main product images upload
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleUploadProduct = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploaded = await uploadImage(file);

    setData((prev) => ({
      ...prev,
      productImg: [...prev.productImg, uploaded.url],
    }));
  };

  // Delete main product image
  const handleDeleteProductImg = (index) => {
    const updatedImages = data.productImg.filter((_, i) => i !== index);
    setData((prev) => ({ ...prev, productImg: updatedImages }));
  };

  // Variant images upload
  const handleUploadVariantImagesClick = () => {
    variantImageInputRef.current.click();
  };

  const handleUploadVariantImages = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploaded = await uploadImage(file);

    const updatedVariants = [...data.variants];
    updatedVariants[selectedVariantIndex].images.push(uploaded.url);
    setData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  // Delete variant image
  const handleDeleteVariantImage = (variantIndex, imgIndex) => {
    const updatedVariants = [...data.variants];
    updatedVariants[variantIndex].images.splice(imgIndex, 1);
    setData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch(SummaryApi.update_product.url, {
      method: SummaryApi.update_product.method,
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();

    if (result.success) {
      toast.success(result.message);
      onClose();
      fatchData();
    }
    if (result.error) {
      toast.error(result.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Product</h2>
          <div className="close-icon" onClick={onClose}>
            <IoClose />
          </div>
        </div>

        <form className="form-row" onSubmit={handleSubmit}>
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

          <label>Product Images (Main):</label>
          <div className="upload-section" onClick={handleUploadClick}>
            <FaCloudDownloadAlt className="upload-icon" />
            <p>Upload Product Image</p>
            <input
              type="file"
              name="productImg"
              ref={fileInputRef}
              onChange={handleUploadProduct}
              style={{ display: "none" }}
            />
          </div>

          <div className="image-preview">
            {data.productImg.length > 0 ? (
              <div className="image-preview-grid">
                {data.productImg.map((img, idx) => (
                  <div key={idx} className="image-preview-container">
                    <img src={img} alt="product" className="preview-image" />
                    <div
                      className="delete-icon"
                      onClick={() => handleDeleteProductImg(idx)}
                    >
                      <MdDelete />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Please upload a product image</p>
            )}
          </div>

          {/* Variants section */}
          <hr />
          <h3>Variants</h3>
          {data.variants.map((variant, index) => (
            <div
              key={index}
              style={{
                border:
                  index === selectedVariantIndex
                    ? "2px solid #007bff"
                    : "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
                cursor: "pointer",
              }}
              onClick={() => setSelectedVariantIndex(index)}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>Variant #{index + 1}</strong>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeVariant(index);
                  }}
                  style={{
                    background: "red",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>

              <label>Color:</label>
              <input
                type="text"
                value={variant.color}
                onChange={(e) => handleVariantColorChange(index, e.target.value)}
                placeholder="Enter color"
                required
              />

              <label>Images (Variant):</label>
              <div
                className="upload-section"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUploadVariantImagesClick();
                }}
              >
                <FaCloudDownloadAlt className="upload-icon" />
                <p>Upload Variant Image</p>
                <input
                  type="file"
                  ref={variantImageInputRef}
                  onChange={handleUploadVariantImages}
                  style={{ display: "none" }}
                />
              </div>

              <div className="image-preview-grid">
                {variant.images.length > 0 ? (
                  variant.images.map((img, idx) => (
                    <div key={idx} className="image-preview-container">
                      <img src={img} alt="variant" className="preview-image" />
                      <div
                        className="delete-icon"
                        onClick={() => handleDeleteVariantImage(index, idx)}
                      >
                        <MdDelete />
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No variant images uploaded.</p>
                )}
              </div>

              <label>Sizes and Stock:</label>
              {variant.sizes.map((sizeItem, sizeIndex) => (
                <div
                  key={sizeIndex}
                  style={{ display: "flex", gap: "10px", marginBottom: "5px" }}
                >
                  <select
                    value={sizeItem.size}
                    onChange={(e) =>
                      handleVariantSizeChange(index, sizeIndex, "size", e.target.value)
                    }
                    required
                  >
                    <option value="">Select size</option>
                    {productSize.map((el) => (
                      <option key={el.value} value={el.value}>
                        {el.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={sizeItem.stock}
                    onChange={(e) =>
                      handleVariantSizeChange(index, sizeIndex, "stock", e.target.value)
                    }
                    placeholder="Stock"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeSizeFromVariant(index, sizeIndex)}
                    style={{
                      background: "red",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addSizeToVariant(index)}
                style={{
                  marginTop: "5px",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Add Size
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addVariant}
            style={{
              marginTop: "10px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Add Variant
          </button>

          <label htmlFor="trandingProduct">Tranding product:</label>
          <select
            name="trandingProduct"
            value={data.trandingProduct}
            onChange={handleOnChange}
          >
            <option value="">Select tranding Product</option>
            {trandingProductBoolean.map((el) => (
              <option key={el.value} value={el.value}>
                {el.label}
              </option>
            ))}
          </select>

          <label htmlFor="price">Price:</label>
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

          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Enter description"
            value={data.description}
            required
            onChange={handleOnChange}
          ></textarea>

          <button type="submit" className="submit-btn">
            Update Product
          </button>
        </form>
      </div>
    </div>
  );
};


export default AdminProductEdit
