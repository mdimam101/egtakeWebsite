// import React, { useState, useRef } from "react";
// import "../styles/UploadProductStyle.css";
// import { IoClose } from "react-icons/io5";
// import { FaCloudDownloadAlt } from "react-icons/fa";
// import { MdDelete } from "react-icons/md";
// import productCategory from "../helpers/productCategory";
// import uploadImage from "../helpers/uploadImage";
// import SummaryApi from "../common";
// import { toast } from "react-toastify";
// // import productSize from "../helpers/productSize";
// // import trandingProductBoolean from "../helpers/trandingProduct";

// const UploadProductComponent = ({ onClose, fatchData }) => {
//   const [data, setData] = useState({
//     productName: "",
//     brandName: "",
//     category: "",
//     subCategory: "",
//     description: "",
//     price: "",
//     selling: "",
//     buyingPrice: "",
//     trandingProduct: false,
//     variants: [], // This will hold array of variants {color, images, sizes}
//   });

//   // const fileInputRef = useRef(null);
//   const variantImageInputRefs = useRef([]); // to handle image input per variant

//   // Handle input change for base data
//   const handleOnChange = (e) => {
//     const { name, value } = e.target;
//     setData((prev) => ({ ...prev, [name]: value }));
//   };

//   // Add a new variant (color)
//   const addVariant = () => {
//     setData((prev) => ({
//       ...prev,
//       variants: [
//         ...prev.variants,
//         { color: "", images: [], sizes: [{ size: "", stock: "" }] },
//       ],
//     }));
//   };

//   // Remove a variant by index
//   const removeVariant = (index) => {
//     setData((prev) => ({
//       ...prev,
//       variants: prev.variants.filter((_, i) => i !== index),
//     }));
//   };

//   // Handle variant color change
//   const handleVariantColorChange = (index, value) => {
//     const newVariants = [...data.variants];
//     newVariants[index].color = value;
//     setData((prev) => ({ ...prev, variants: newVariants }));
//   };

//   // Add new size input for a variant
//   const addSizeToVariant = (variantIndex) => {
//     const newVariants = [...data.variants];
//     newVariants[variantIndex].sizes.push({ size: "", stock: "" });
//     setData((prev) => ({ ...prev, variants: newVariants }));
//   };

//   // Remove size input from a variant
//   const removeSizeFromVariant = (variantIndex, sizeIndex) => {
//     const newVariants = [...data.variants];
//     newVariants[variantIndex].sizes = newVariants[variantIndex].sizes.filter(
//       (_, i) => i !== sizeIndex
//     );
//     setData((prev) => ({ ...prev, variants: newVariants }));
//   };

//   // Handle size or stock change in variant
//   const handleSizeChange = (variantIndex, sizeIndex, field, value) => {
//     const newVariants = [...data.variants];
//     newVariants[variantIndex].sizes[sizeIndex][field] = value;
//     setData((prev) => ({ ...prev, variants: newVariants }));
//   };

//   // Upload main product images (design preview)
//   // const handleUploadProduct = async (e) => {
//   //   const file = e.target.files[0];
//   //   if (!file) return;

//   //   const uploaded = await uploadImage(file);

//   //   setData((prev) => ({
//   //     ...prev,
//   //     productImg: [...prev.productImg, uploaded.url],
//   //   }));
//   // };

//   // Delete main product image
//   // const handleDeleteProductImg = (index) => {
//   //   const updatedImages = data.productImg.filter((_, i) => i !== index);
//   //   setData((prev) => ({ ...prev, productImg: updatedImages }));
//   // };

//   // Upload image for a specific variant
//   const handleUploadVariantImage = async (variantIndex, e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const uploaded = await uploadImage(file);

//     const newVariants = [...data.variants];
//     newVariants[variantIndex].images.push(uploaded.url);
//     setData((prev) => ({ ...prev, variants: newVariants }));
//   };

//   // Delete variant image
//   const handleDeleteVariantImage = (variantIndex, imgIndex) => {
//     const newVariants = [...data.variants];
//     newVariants[variantIndex].images = newVariants[variantIndex].images.filter(
//       (_, i) => i !== imgIndex
//     );
//     setData((prev) => ({ ...prev, variants: newVariants }));
//   };

//   // On form submit
//   const handleSubmit = async (e) => {
//    e.preventDefault();

//   if (!data.subCategory || data.subCategory.trim() === "") {
//     data.subCategory = data.category;
//   }

//   // ✅ Auto calculate total stock
//   const totalStock = data.variants.reduce((sum, variant) => {
//     const variantStock = variant.sizes.reduce((subSum, size) => {
//       const stockNum = Number(size.stock);
//       return subSum + (isNaN(stockNum) ? 0 : stockNum);
//     }, 0);
//     return sum + variantStock;
//   }, 0);

//   data.totalStock = totalStock;

//   const response = await fetch(SummaryApi.upload_product.url, {
//     method: SummaryApi.upload_product.method,
//     credentials: "include",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   });

//   const result = await response.json();

//   if (result.success) {
//     toast.success(result.message);
//     onClose();
//     fatchData();
//   } else if (result.error) {
//     toast.error(result.message);
//   }
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content">
//         <div className="modal-header">
//           <h2>Upload Product</h2>
//           <div className="close-icon" onClick={onClose}>
//             <IoClose />
//           </div>
//         </div>

//         <form className="form-row" onSubmit={handleSubmit}>
//           {/* Base product fields */}
//           <label htmlFor="productName">Product Name:</label>
//           <input
//             type="text"
//             id="productName"
//             name="productName"
//             placeholder="Enter product name"
//             value={data.productName}
//             required
//             onChange={handleOnChange}
//           />

//           <label htmlFor="brandName">Brand Name:</label>
//           <input
//             type="text"
//             id="brandName"
//             name="brandName"
//             placeholder="Enter brand name"
//             value={data.brandName}
//             onChange={handleOnChange}
//           />

//           <label htmlFor="category">Category:</label>
//           <select
//             name="category"
//             value={data.category}
//             onChange={handleOnChange}
//             required
//           >
//             <option value="">Select category</option>
//             {productCategory.map((el) => (
//               <option key={el.value} value={el.value}>
//                 {el.label}
//               </option>
//             ))}
//           </select>

//           <label htmlFor="subCategory">Sub Category:</label>
//           <input
//             type="text"
//             id="subCategory"
//             name="subCategory"
//             placeholder="Enter sub category"
//             value={data.subCategory}
//             onChange={handleOnChange}
//           />

//           <label htmlFor="description">Description:</label>
//           <textarea
//             id="description"
//             name="description"
//             rows={3}
//             placeholder="Enter description"
//             value={data.description}
//             onChange={handleOnChange}
//           ></textarea>

//           <label htmlFor="price">Price:</label>
//           <input
//             type="number"
//             id="price"
//             name="price"
//             placeholder="Enter price"
//             value={data.price}
//             required
//             onChange={handleOnChange}
//           />

//           <label htmlFor="selling">Selling Price:</label>
//           <input
//             type="number"
//             id="selling"
//             name="selling"
//             placeholder="Enter selling price"
//             value={data.selling}
//             required
//             onChange={handleOnChange}
//           />

//           <label htmlFor="buyingPrice">Buying Price:</label>
//           <input
//             type="number"
//             id="buyingPrice"
//             name="buyingPrice"
//             placeholder="Enter buying price"
//             value={data.buyingPrice}
//             required
//             onChange={handleOnChange}
//           />

//           {/* <label htmlFor="trandingProduct">Trending Product:</label>
//           <select
//             name="trandingProduct"
//             value={data.trandingProduct}
//             required
//             onChange={handleOnChange}
//           >
//             <option value="">Is trending product?</option>
//             {trandingProductBoolean.map((el) => (
//               <option key={el.value} value={el.value}>
//                 {el.label}
//               </option>
//             ))}
//           </select> */}

//           <div className="switch-wrapper">
//   <label className="switch-label">Trending Product?</label>
//   <label className="switch">
//     <input
//       type="checkbox"
//       checked={Boolean(data.trandingProduct)}
//       onChange={(e) =>
//         setData((prev) => ({
//           ...prev,
//           trandingProduct: e.target.checked,
//         }))
//       }
//     />
//     <span className="slider round"></span>
//   </label>
// </div>

// {/* <label>Total Stock:</label>
// <input
//   type="number"
//   name="totalStock"
//   value={data.totalStock}
//   onChange={handleOnChange}
//   placeholder="Enter total stock"
//   required
// /> */}

//           {/* Product design preview images */}
//           {/* <label>Design Preview Images:</label>
//           <div
//             className="upload-section"
//             onClick={() => fileInputRef.current.click()}
//           >
//             <FaCloudDownloadAlt className="upload-icon" />
//             <p>Upload Design Preview Images</p>
//             <input
//               type="file"
//               ref={fileInputRef}
//               onChange={handleUploadProduct}
//               multiple={false}
//               style={{ display: "none" }}
//             />
//           </div>

//           <div className="image-preview">
//             {data.productImg.length > 0 ? (
//               <div className="image-preview-grid">
//                 {data.productImg.map((img, idx) => (
//                   <div key={idx} className="image-preview-container">
//                     <img src={img} alt="product" className="preview-image" />
//                     <div
//                       className="delete-icon"
//                       onClick={() => handleDeleteProductImg(idx)}
//                     >
//                       <MdDelete />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p>Please upload design preview image(s)</p>
//             )}
//           </div> */}

//           {/* Variants Section */}
//           <h3>Variants (Color / Size / Stock)</h3>
//           <p style={{ fontWeight: "bold", marginTop: "10px" }}>
//   Total Stock: {
//     data.variants.reduce((sum, variant) =>
//       sum + variant.sizes.reduce((s, size) => s + Number(size.stock || 0), 0)
//     , 0)
//   }
// </p>
//           {data.variants.map((variant, vIndex) => (
//             <div
//               key={vIndex}
//               style={{
//                 border: "1px solid #ccc",
//                 padding: "10px",
//                 marginBottom: "10px",
//                 borderRadius: "8px",
//               }}
//             >
//               <label>Color:</label>
//               <input
//                 type="text"
//                 value={variant.color}
//                 onChange={(e) =>
//                   handleVariantColorChange(vIndex, e.target.value)
//                 }
//                 placeholder="Enter color"
//                 // required
//               />

//               {/* Variant images upload */}
//               <label>Variant Images:</label>
//               <div
//                 className="upload-section"
//                 onClick={() =>
//                   variantImageInputRefs.current[vIndex].click()
//                 }
//               >
//                 <FaCloudDownloadAlt className="upload-icon" />
//                 <p>Upload Images for this color variant</p>
//                 <input
//                   type="file"
//                   multiple={false}
//                   ref={(el) => (variantImageInputRefs.current[vIndex] = el)}
//                   onChange={(e) => handleUploadVariantImage(vIndex, e)}
//                   style={{ display: "none" }}
//                   required
//                 />
//               </div>
//               <div className="image-preview-grid" style={{ marginTop: "5px" }}>
//                 {variant.images.map((img, i) => (
//                   <div key={i} className="image-preview-container">
//                     <img src={img} alt="variant" className="preview-image" />
//                     <div
//                       className="delete-icon"
//                       onClick={() => handleDeleteVariantImage(vIndex, i)}
//                     >
//                       <MdDelete />
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               <label>Sizes and Stock:</label>
//               {variant.sizes.map((sizeItem, sIndex) => (
//                 <div
//                   key={sIndex}
//                   style={{ display: "flex", gap: "10px", marginBottom: "5px" }}
//                 >
//                   <input
//                     type="text"
//                     placeholder="Size"
//                     value={sizeItem.size}
//                     // required
//                     onChange={(e) =>
//                       handleSizeChange(vIndex, sIndex, "size", e.target.value)
//                     }
//                   />
//                   <input
//                     type="number"
//                     placeholder="Stock"
//                     value={sizeItem.stock}
//                     min={0}
//                     required
//                     onChange={(e) =>
//                       handleSizeChange(vIndex, sIndex, "stock", e.target.value)
//                     }
//                   />
//                   {variant.sizes.length > 1 && (
//                     <button
//                       type="button"
//                       onClick={() => removeSizeFromVariant(vIndex, sIndex)}
//                       style={{ background: "red", color: "white" }}
//                     >
//                       Remove
//                     </button>
//                   )}
//                 </div>
//               ))}

//               <button
//                 type="button"
//                 onClick={() => addSizeToVariant(vIndex)}
//                 style={{ marginBottom: "10px" }}
//               >
//                 Add Size
//               </button>

//               <button
//                 type="button"
//                 onClick={() => removeVariant(vIndex)}
//                 style={{ background: "red", color: "white" }}
//               >
//                 Remove Variant
//               </button>
//             </div>
//           ))}

//           <button type="button" onClick={addVariant} style={{ marginBottom: 20 }}>
//             + Add Variant
//           </button>

//           <button type="submit" className="btn btn-primary">
//             Upload Product
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

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
      productVideo: {
        ...prev.productVideo,
        [key]: value,
      },
    }));
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
    if (uploaded?.error) {
      toast.error(uploaded.message || "Upload failed");
      return;
    }
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
      if (uploaded?.error) return toast.error(uploaded.message || "Video upload failed");
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
    if (uploaded?.error) return toast.error(uploaded.message || "Thumbnail upload failed");
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

          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Enter description"
            value={data.description}
            onChange={handleOnChange}
          ></textarea>

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

          {/* Toggles */}
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
              <div className="image-preview-container" style={{ position: "relative" }}>
                {/^https?:\/\/.*\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(
                  data.productVideo.url
                ) ? (
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
                  style={{ width: 120, height: 70, objectFit: "cover", borderRadius: 8 }}
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
                  This looks like a page link (e.g., YouTube/Vimeo). Preview may not
                  render here, but the app can embed it on details page.
                </p>
              )}
            </div>
          ) : null}

          {/* Variants Section */}
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

          <button type="button" onClick={addVariant} style={{ marginBottom: 20 }}>
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
