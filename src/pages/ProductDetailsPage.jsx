import React, { useContext, useEffect, useRef, useState, useMemo } from "react";
import SummaryApi from "../common";
import { useParams } from "react-router";
import { CiDeliveryTruck, CiBoxes } from "react-icons/ci";
import { TbTruckReturn } from "react-icons/tb";
import "../styles/ProductDetailsStyle.css";
import addToCart from "../helpers/addToCart";
import Context from "../context";
import UserProductCart from "../components/UserProductCart";
import { generateOptimizedVariants } from "../helpers/variantUtils";

const ProductDetailsPage = () => {
  const param = useParams();
  const [data, setData] = useState({
    _id: "",
    productName: "",
    productCodeNumber: "",
    brandName: "",
    category: "",
    subCategory: "",
    description: "",
    price: 0,
    selling: 0,
    // api fields
    variants: [],
    sizeDetails: [],       // ← ONLY this determines size availability
    totalStock: 0,
  });

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [allImages, setAllImages] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [showRelatedProduct, setShowRelatedProduct] = useState([]);

  const imageSliderRef = useRef();
  const { fetchUserAddToCart } = useContext(Context);

  useEffect(() => {
    (async () => {
      const response = await fetch(SummaryApi.product_details.url, {
        method: SummaryApi.product_details.method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: param?.id }),
      });
      const result = await response.json();
      if (!result?.success) return;

      const d = result.data || {};
      setData(d);

      const images = (d.variants || []).flatMap((v) => v.images || []);
      setAllImages(images);
      setSelectedImg(images[0] || null);
      setSelectedVariantIndex(0);
      setSelectedSize(null);

      const res = await fetch(SummaryApi.category_wish_product.url, {
        method: SummaryApi.category_wish_product.method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category: d.category }),
      });
      const reco = await res.json();
       const optimized = generateOptimizedVariants(reco.data );
      setShowRelatedProduct(optimized || []);
    })();
  }, [param?.id]);

  const selectedVariant = data.variants[selectedVariantIndex] || {};
  console.log("🦌◆🦌◆selectedVariant", selectedVariant);

   // check in variant (productName/price/selling) if have it will be update
  let updateProductName = selectedVariant?.SpcProductName
    ? selectedVariant.SpcProductName
    : data.productName;
  let updateSelling = selectedVariant?.SpcSelling
    ? selectedVariant.SpcSelling
    : data.selling;
  let UpdatePrice = selectedVariant?.SpcPrice
    ? selectedVariant.SpcPrice
    : data.price;

  
  const variantSizes = selectedVariant.sizes || [];

  // ---------- SIZE AVAILABILITY (ONLY FROM sizeDetails) ----------
  const hasSizes = Array.isArray(data.sizeDetails) && data.sizeDetails.length > 0;

  // show these sizes in UI (ONLY from sizeDetails)
  const AVAILABLE_SIZES = useMemo(
    () => (hasSizes ? data.sizeDetails.map((s) => s.size) : []),
    [hasSizes, data.sizeDetails]
  );

  // stock for a selected size (look up in current variant's sizes)
  const getStockBySize = (size) => {
    const s = variantSizes.find((x) => x.size === size);
    return s ? s.stock : 0;
  };

  // simple (no-size) stock: prefer totalStock, else sum variant stocks, else 1
  const getSimpleStock = useMemo(() => {
    if (typeof data.totalStock === "number") return data.totalStock;
    const sumVariant = (data.variants || []).reduce((acc, v) => {
      const sum = (v.sizes || []).reduce((a, s) => a + (Number(s.stock) || 0), 0);
      return acc + sum;
    }, 0);
    return sumVariant || 1;
  }, [data.totalStock, data.variants]);

  const discount =
    UpdatePrice && updateSelling
      ? Math.floor(((UpdatePrice - updateSelling) / UpdatePrice) * 100)
      : 0;

  const addToCartHandle = async () => {
    // if sizes exist, user must select a size
    if (hasSizes && !selectedSize) {
      alert("Please select a size.");
      return;
    }
    // if no sizes, proceed directly
    await addToCart({
      productId: data._id,
      productName: updateProductName,
      size: hasSizes ? selectedSize : undefined,
      color: selectedVariant.color,
      image: selectedImg,
      price: UpdatePrice,
      selling: updateSelling,
    });
    fetchUserAddToCart();
  };

  // -------- Button label & disabled (matches your rule) --------
  const buttonState = (() => {
    if (hasSizes) {
      // has sizeDetails ⇒ must select size first
      if (!selectedSize) return { label: "Select Size", disabled: false };
      const stk = getStockBySize(selectedSize);
      if (stk <= 0) return { label: "Out of Stock", disabled: true };
      return { label: "Add to cart", disabled: false };
    }
    // no sizeDetails ⇒ direct Add to cart
    if (!getSimpleStock || getSimpleStock <= 0)
      return { label: "Out of Stock", disabled: true };
    return { label: "Add to cart", disabled: false };
  })();

  return (
    <div className="product-details-container">
      {/* Image gallery */}
      <div className="product-image-wrapper">
        <div className="thumbnail-list-vertical">
          {allImages.map((img, index) => (
            <img
              key={index}
              src={img}
              className={`thumbnail-image-vertical ${selectedImg === img ? "active-thumbnail" : ""}`}
              onClick={() => {
                setSelectedImg(img);
                const variantIndex = (data.variants || []).findIndex((v) =>
                  (v.images || []).includes(img)
                );
                if (variantIndex !== -1 && variantIndex !== selectedVariantIndex) {
                  setSelectedVariantIndex(variantIndex);
                  setSelectedSize(null);
                }
              }}
              alt=""
            />
          ))}
        </div>

        <div className="big-image">
          {selectedImg ? <img src={selectedImg} alt="" /> : null}
        </div>
      </div>

      {/* Mobile slider */}
      <div className="product-image-slider-container">
        <div
          className="product-image-slider"
          ref={imageSliderRef}
          onScroll={(e) => {
            const el = e.target;
            const currentIndex = Math.round(el.scrollLeft / el.clientWidth);
            const currentImage = allImages[currentIndex];
            if (currentImage) setSelectedImg(currentImage);

            const variantIndex = (data.variants || []).findIndex((v) =>
              (v.images || []).includes(currentImage)
            );
            if (variantIndex !== -1 && variantIndex !== selectedVariantIndex) {
              setSelectedVariantIndex(variantIndex);
              setSelectedSize(null);
            }
          }}
        >
          {allImages.map((img, index) => (
            <div key={index} className="product-image-slide">
              <img src={img} alt={`variant-${index}`} />
            </div>
          ))}
        </div>

        <div className="image-count-indicator">
          {Math.max(1, allImages.indexOf(selectedImg) + 1)}/{allImages.length || 1}
        </div>
      </div>

      <div className="item-counter">
        Variant {Math.min(selectedVariantIndex + 1, (data.variants || []).length)}/
        {(data.variants || []).length}
      </div>

      {/* Price */}
      <div className="product-price-info">
        <span className="selling-price">
          <span>৳</span>
          {updateSelling}
        </span>
        {discount > 0 && <span className="discount">Save {discount}%</span>}
        {UpdatePrice ? <span className="original-price">৳{UpdatePrice}</span> : null}
      </div>
      <div className="product-name">{updateProductName}</div>

      {selectedVariant.color && (
        <div className="color-info">Color: {selectedVariant.color}</div>
      )}

      {/* Color thumbnails */}
      <div className="color-selector-thumbnail">
        {(data.variants || []).map((variant, idx) => {
          const thumbImage = variant.images?.[0] || null;
          return (
            <div
              key={idx}
              className={`thumbnail-color-box ${idx === selectedVariantIndex ? "active" : ""}`}
              onClick={() => {
                setSelectedVariantIndex(idx);
                setSelectedSize(null);

                const newImages = data.variants[idx]?.images || [];
                if (newImages.length > 0) {
                  const firstImg = newImages[0];
                  setSelectedImg(firstImg);

                  const imgIndex = allImages.findIndex((im) => im === firstImg);
                  if (imageSliderRef.current && imgIndex !== -1) {
                    const el = imageSliderRef.current;
                    const slideWidth = el.clientWidth;
                    el.scrollTo({ left: imgIndex * slideWidth, behavior: "instant" });
                  }
                }
              }}
            >
              {thumbImage && <img src={thumbImage} alt={variant.color || "variant"} />}
            </div>
          );
        })}
      </div>

      {/* ===== Sizes UI — ONLY when sizeDetails exist ===== */}
      {hasSizes && AVAILABLE_SIZES.length > 0 && (
        <div className="size-section">
          <div className="size-header">
            <p>Size</p>
          </div>
          <div className="size-options">
            {AVAILABLE_SIZES.map((size) => {
              const stock = getStockBySize(size);
              const disabled = stock === 0;
              return (
                <div
                  key={size}
                  className={`size-box ${selectedSize === size ? "selected-size" : ""}`}
                  onClick={() => !disabled && setSelectedSize(size)}
                  style={{
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.4 : 1,
                  }}
                >
                  {size}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Size details box (only if hasSizes) */}
      {hasSizes && selectedSize && (
        <div className="size-detail-box">
          <div className="size-detail-title">Size: {selectedSize} Details</div>
          {(() => {
            const row = (data.sizeDetails || []).find((s) => s.size === selectedSize);
            if (!row) return <div className="size-detail-text">No details for this size.</div>;
            const unit = row.unit ? ` ${row.unit}` : "";
            return (
              <>
                <div className="size-detail-text">Length: {row.length ?? "-"}{unit}</div>
                <div className="size-detail-text">Chest: {row.chest ?? "-"}{unit}</div>
                {"sleeve" in row && (
                  <div className="size-detail-text">Sleeve: {row.sleeve ?? "-"}{unit}</div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Stock info (size-mode only) */}
      {hasSizes && (
        <div className="stock-info">
          {selectedSize
            ? getStockBySize(selectedSize) > 0
              ? `In Stock: ${getStockBySize(selectedSize)}`
              : "Out of Stock"
            : "Please select a size"}
        </div>
      )}

      {/* Services */}
      <div className="service-title">EGtake Commitment</div>
      <div className="service-item">
        <CiDeliveryTruck className="icon" />
        <strong>Free Delivery </strong>
      </div>
      <p className="service-description">Able from <span style={{fontWeight:"bold", color:"red"}}>EGtake</span> apps</p>
      <div className="service-item">
        <CiBoxes className="icon" />
        <strong>Delivery Commitment</strong>
      </div>
      <p className="service-description">Up to 50% cashback credit if delayed</p>
      <div className="service-item">
        <TbTruckReturn className="icon" />
        <strong>Free Return Within 15 days</strong>
      </div>
      {/* product code number */}
      <div>Code number : {data?.productCodeNumber}</div>
      

      {/* Description */}
      <div
        className="product-details-toggle"
        onClick={() => setShowDetails((s) => !s)}
      >
        {showDetails ? "Hide" : "Show"} Product Details
      </div>
      {showDetails && (
        <div className="product-details-text">
          <p style={{ whiteSpace: "pre-line" }}>{data.description}</p>
        </div>
      )}

      {/* Add to cart button (final logic) */}
      <div >
        <button className="add-to-cart-fixed" disabled={buttonState.disabled} onClick={addToCartHandle}>
          {buttonState.label}
        </button>
      </div>

      {/* Recommended */}
      <div>Recommended</div>
      <div className="product-grid">
        {showRelatedProduct.length > 0 &&
          showRelatedProduct.map((product, idx) => (
            <UserProductCart productData={product} key={idx} />
          ))}
      </div>
    </div>
  );
};

export default ProductDetailsPage;
