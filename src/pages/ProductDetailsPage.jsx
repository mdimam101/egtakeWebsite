import React, { useContext, useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";
import SummaryApi from "../common";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { CiDeliveryTruck, CiBoxes } from "react-icons/ci";
import { TbTruckReturn } from "react-icons/tb";
import "../styles/ProductDetailsStyle.css";
import addToCart from "../helpers/addToCart";
import Context from "../context";
import UserProductCart from "../components/UserProductCart";
import { generateOptimizedVariants } from "../helpers/variantUtils";
import ProductQualityViz from "../components/ProductQualityViz";
import { EGtakeCommitment } from "../components/EGtakeCommitment";
import { MdOutlineArrowBackIos } from "react-icons/md";
import { FaCartArrowDown } from "react-icons/fa";
import ProductDetailsSkeleton from "../components/skeletonAnime/ProductDetailsSkeleton";

/* =========================
   ✅ Web FullscreenImageModal (React)
   - click thumb => open modal
   - left/right navigation
   - wheel zoom (1~4)
   - drag pan when zoomed
   - double click zoom toggle
   ========================= */

const ensureHttps = (u = "") =>
  String(u || "").replace(/^http:\/\//i, "https://").replace(/ /g, "%20");

const FullscreenImageModal = ({
  visible,
  onClose,
  images = [],
  initialIndex = 0,
  title = "Photos",
}) => {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [drag, setDrag] = useState({ x: 0, y: 0 });

  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, dx: 0, dy: 0 });

  useEffect(() => {
    if (!visible) return;
    setIndex(initialIndex);
    setScale(1);
    setDrag({ x: 0, y: 0 });
  }, [visible, initialIndex]);

  // ESC close
  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") setIndex((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight") setIndex((p) => Math.min(images.length - 1, p + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, images.length, onClose]);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const onWheel = (e) => {
    e.preventDefault();
    const next = clamp(scale + (e.deltaY < 0 ? 0.15 : -0.15), 1, 4);
    setScale(next);
    if (next === 1) setDrag({ x: 0, y: 0 });
  };

  const onMouseDown = (e) => {
    if (scale <= 1.01) return;
    draggingRef.current = true;
    startRef.current = { x: e.clientX, y: e.clientY, dx: drag.x, dy: drag.y };
  };

  const onMouseMove = (e) => {
    if (!draggingRef.current) return;
    const nx = startRef.current.dx + (e.clientX - startRef.current.x);
    const ny = startRef.current.dy + (e.clientY - startRef.current.y);
    setDrag({ x: nx, y: ny });
  };

  const onMouseUp = () => {
    draggingRef.current = false;
  };

  const onDoubleClick = () => {
    if (scale > 1.01) {
      setScale(1);
      setDrag({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  };

  const goPrev = () => {
    setIndex((p) => Math.max(0, p - 1));
    setScale(1);
    setDrag({ x: 0, y: 0 });
  };

  const goNext = () => {
    setIndex((p) => Math.min(images.length - 1, p + 1));
    setScale(1);
    setDrag({ x: 0, y: 0 });
  };

  if (!visible) return null;

  const safeImages = Array.isArray(images) ? images.map(ensureHttps) : [];
  const current = safeImages[index] || "";

  return (
    <div
      className="pd-viewer"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      role="dialog"
      aria-modal="true"
    >
      <div className="pd-viewer__top">
        <div className="pd-viewer__title">{title}</div>
        <div className="pd-viewer__count">
          {index + 1} / {safeImages.length}
        </div>
        <button className="pd-viewer__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <button className="pd-viewer__nav left" onClick={goPrev} disabled={index === 0}>
        ‹
      </button>
      <button
        className="pd-viewer__nav right"
        onClick={goNext}
        disabled={index === safeImages.length - 1}
      >
        ›
      </button>

      <div
        className="pd-viewer__stage"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        onClick={(e) => {
          // click on black area closes
          if (e.target.classList.contains("pd-viewer__stage")) onClose?.();
        }}
        role="presentation"
      >
        <img
          src={current}
          alt=""
          draggable={false}
          className="pd-viewer__img"
          style={{
            transform: `translate(${drag.x}px, ${drag.y}px) scale(${scale})`,
            cursor: scale > 1.01 ? (draggingRef.current ? "grabbing" : "grab") : "zoom-in",
          }}
        />
      </div>
    </div>
  );
};

// ✅ Stars (web)
const Stars = ({ value = 0 }) => {
  const v = Math.round(Number(value) || 0);
  return (
    <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= v ? "#FFD700" : "#BDBDBD" }}>
          ★
        </span>
      ))}
    </div>
  );
};

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
    sizeDetails: [], // ← ONLY this determines size availability
    totalStock: 0,
    qualityType: "",
  });

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [allImages, setAllImages] = useState([]);
  // const [showDetails, setShowDetails] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [showRelatedProduct, setShowRelatedProduct] = useState([]);

  // ✅ Reviews state
  const [reviews, setReviews] = useState([]);

  const [loading, setloading] = useState()

  // ✅ show top 3
  const previewReviews = useMemo(
    () => (Array.isArray(reviews) ? reviews.slice(0, 3) : []),
    [reviews]
  );

  // ✅ viewer state (RN same)
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerImages, setViewerImages] = useState([]); // string[]
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = (imagesArr, startIndex = 0) => {
    if (!Array.isArray(imagesArr) || imagesArr.length === 0) return;
    setViewerImages(imagesArr);
    setViewerIndex(Math.max(0, Math.min(startIndex, imagesArr.length - 1)));
    setShowImageViewer(true);
  };

  const imageSliderRef = useRef();
  const { fetchUserAddToCart } = useContext(Context);

  // description block
// ✅ Product Details preview state (RN style)
const [isTruncated, setIsTruncated] = useState(false);
const descBoxRef = useRef(null);

// ✅ modal (same function name like RN)
const [modalVisible, setModalVisible] = useState(false);
const [selectedCommitment, setSelectedCommitment] = useState({ title: "", detail: "" });

const openCommitmentModal = (title, detail) => {
  setSelectedCommitment({ title, detail });
  setModalVisible(true);
};

// ✅ detect truncation (after description changes)
useEffect(() => {
  const el = descBoxRef.current;
  if (!el) return;
  // if content taller than visible height => truncated
  setIsTruncated(el.scrollHeight > el.clientHeight + 2);
}, [data?.description]);

  useEffect(() => {
    setloading(true);
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
      setloading(false)

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
      const optimized = generateOptimizedVariants(reco.data);
      setShowRelatedProduct(optimized || []);
    })();
  }, [param?.id]);

  // ✅ Fetch product reviews (after product loaded)
  useEffect(() => {
    if (!data?._id) return;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await axios.get(SummaryApi.get_product_reviews(data._id), {
          signal: controller.signal,
        });

        if (res?.data?.success) {
          setReviews(res.data.data || []);
        } else {
          setReviews([]);
        }
      } catch (e) {
        console.log(e);
        
        setReviews([]);
      }
    })();

    return () => controller.abort();
  }, [data?._id]);

  const selectedVariant = data.variants[selectedVariantIndex] || {};

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
      const sum = (v.sizes || []).reduce(
        (a, s) => a + (Number(s.stock) || 0),
        0
      );
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
  const navigate = useNavigate();

    const { cartCountProduct } = useContext(Context);
    console.log("h🌻Cart🌻",cartCountProduct);

    if (!data || loading )  {
  return <ProductDetailsSkeleton />;
}
    
  return (
    <div className="product-details-container">

      {/* back button */}
      <button
      type="button"
      className="p-back-button"
      onClick={() => navigate(-1)}
    >

    <MdOutlineArrowBackIos  className="backIcon"/>
    </button>
      {/* Image gallery */}
      <div className="product-image-wrapper">
        <div className="thumbnail-list-vertical">
          {allImages.map((img, index) => (
            <img
              key={index}
              src={img}
              className={`thumbnail-image-vertical ${
                selectedImg === img ? "active-thumbnail" : ""
              }`}
              onClick={() => {
                setSelectedImg(img);
                const variantIndex = (data.variants || []).findIndex((v) =>
                  (v.images || []).includes(img)
                );
                if (
                  variantIndex !== -1 &&
                  variantIndex !== selectedVariantIndex
                ) {
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
          {Math.max(1, allImages.indexOf(selectedImg) + 1)}/
          {allImages.length || 1}
        </div>
      </div>

      <div className="item-counter">
        Variant{" "}
        {Math.min(selectedVariantIndex + 1, (data.variants || []).length)}/
        {(data.variants || []).length}
      </div>

      {/* Price */}
      <div className="product-price-info">
        <span className="selling-price">
          <span>৳</span>
          {updateSelling}
        </span>
        {discount > 0 && <span className="discount">Save {discount}%</span>}
        {UpdatePrice ? (
          <span className="original-price">৳{UpdatePrice}</span>
        ) : null}
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
              className={`thumbnail-color-box ${
                idx === selectedVariantIndex ? "active" : ""
              }`}
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
                    el.scrollTo({
                      left: imgIndex * slideWidth,
                      behavior: "instant",
                    });
                  }
                }
              }}
            >
              {thumbImage && (
                <img src={thumbImage} alt={variant.color || "variant"} />
              )}
            </div>
          );
        })}
      </div>

      {/* ===== Sizes UI — ONLY when sizeDetails exist ===== */}
      {hasSizes && AVAILABLE_SIZES.length > 0 && (
        <div className="size-section">
          <div className="size-header">
            <p style={{marginLeft:"5px"}}>Size</p>
          </div>
          <div className="size-options">
            {AVAILABLE_SIZES.map((size) => {
              const stock = getStockBySize(size);
              const disabled = stock === 0;
              return (
                <div
                  key={size}
                  className={`size-box ${
                    selectedSize === size ? "selected-size" : ""
                  }`}
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
            const row = (data.sizeDetails || []).find(
              (s) => s.size === selectedSize
            );
            if (!row)
              return (
                <div className="size-detail-text">No details for this size.</div>
              );
            const unit = row.unit ? ` ${row.unit}` : "";
            return (
              <>
                <div className="size-detail-text">
                  Length: {row.length ?? "-"}
                  {unit}
                </div>
                <div className="size-detail-text">
                  Chest: {row.chest ?? "-"}
                  {unit}
                </div>
                {"sleeve" in row && (
                  <div className="size-detail-text">
                    Sleeve: {row.sleeve ?? "-"}
                    {unit}
                  </div>
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

      {/* // Suppose API returns PQualityType in data.qualityType  (normal|good|premium|luxury) */}
        {data?.qualityType && (
          <ProductQualityViz
            PQualityType={data?.qualityType}
            style={{ marginTop: 12 }}
          />
        )}

        {/* commitment - servoces*/}
        <EGtakeCommitment />

      {/* product code number */}
      <div style={{color:"gray", paddingTop:"10px"}}>Product code: {data?.productCodeNumber}
        <span style={{paddingLeft:"10px"}}>|</span>
        <span className="cod-badge"> Cash on Delivery</span>
        </div>

      {/* ✅ Product Description (RN-like preview) */}
<div className="review-preview">
  <div className="review-preview-header">
    <h3 className="review-title" style={{ margin: 0 }}>Product Details</h3>
  </div>

  {!!data?.description && (
    <div style={{ position: "relative" }}>
      {/* 10-line preview style (web) */}
      <div
        ref={descBoxRef}
        style={{
          whiteSpace: "pre-line",
          lineHeight: "20px",
          color: "#222",
          maxHeight: 20 * 10, // 10 lines
          overflow: "hidden",
          fontSize: 14,
          position: "relative",
        }}
      >
        {data.description}
      </div>

      {/* Soft fade at bottom only if truncated */}
      {isTruncated && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 40,
            pointerEvents: "none",
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))",
          }}
        />
      )}
    </div>
  )}

  {/* More specification => opens modal */}
  <button
    type="button"
    onClick={() => openCommitmentModal("Product Details", data?.description || "")}
    style={{
      marginTop: 10,
      background: "transparent",
      border: "none",
      padding: 0,
      cursor: "pointer",
      color: "green",
      fontWeight: 600,
    }}
  >
    More specification ›
  </button>
</div>

      {/* Add to cart & cart button */}
      <div  className="addbar">
         <div className="p-cart-icon-container">
          <Link to={"/cart"} className="p-footer-icon" >
            <FaCartArrowDown />           
            <span className="p-cart-count-badge">{cartCountProduct}</span>
          </Link>
        </div>
        <div className="p-add-name-btn">
           <button
          className="add-to-cart-fixed"
          disabled={buttonState.disabled}
          onClick={addToCartHandle}
        >
          {buttonState.label}
        </button>
        </div>
        
      </div>

       {/* ✅ Reviews area */}
      <div className="review-preview">
        <div className="review-preview-header">
          <h3 className="review-title">Customer Reviews</h3>
        </div>

        {/* No review state */}
        {(!reviews || reviews.length === 0) && (
          <p style={{ color: "#666" }}>No reviews yet.</p>
        )}

        {/* show Top 3 reviews */}
        {previewReviews.map((rv) => (
          <div key={rv._id} className="review-item">
            <div style={{ flex: 1 }}>
              <div className="review-user">{rv.userName || "User"}</div>
              <Stars value={rv.rating} />

              {rv.comment ? <div className="review-text">{rv.comment}</div> : null}

              {/* thumbs (click => open modal) */}
              {Array.isArray(rv.images) && rv.images.length > 0 && (
                <div className="review-thumbs">
                  {rv.images.slice(0, 5).map((u, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="thumb-box"
                      onClick={() => openViewer(rv.images, idx, "Review photos")}
                      style={{ padding: 0, border: "none", background: "transparent" }}
                    >
                      <img
                        src={ensureHttps(u)}
                        alt="review"
                        className="thumb-img"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* View all reviews */}
        {/* {Array.isArray(reviews) && reviews.length > 0 ? (
          <button
            type="button"
            className="view-more-reviews"
            onClick={() => {
              window.location.href = `/reviews/${data?._id}`;
            }}
          >
            💬 View more reviews ({reviews.length})
          </button>
        ) : null} */}
      </div>

      
      {/* ✅ Image viewer modal (web) */}
      <FullscreenImageModal
        visible={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        images={viewerImages}
        initialIndex={viewerIndex}
        title={data?.productName || "Photos"}
      />

      {/* Recommended */}
      <div className="reco-title">Recommended</div>
      <div className="product-details-page-reco-grid">
        {showRelatedProduct.length > 0 &&
          showRelatedProduct.map((product, idx) => (
            <UserProductCart productData={product} key={idx} />
          ))}
      </div>
      {/* ✅ Modal (web) */}
{modalVisible && (
  <div
    onClick={() => setModalVisible(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.3)",
      display: "flex",
      justifyContent: "flex-end",
      zIndex: 999999,
    }}
    role="presentation"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        background: "#fff",
        padding: 24,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
      role="presentation"
    >
      <div style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
        {selectedCommitment.title}
      </div>

      <pre
        style={{
          fontSize: 16,
          margin: "0 0 20px 0",
          whiteSpace: "pre-wrap",
          lineHeight: "22px",
        }}
      >
        {selectedCommitment.detail}
      </pre>

      <button
        type="button"
        onClick={() => setModalVisible(false)}
        style={{
          width: "100%",
          background: "#ff5722",
          padding: 12,
          border: "none",
          borderRadius: 8,
          fontWeight: "bold",
          color: "#fff",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default ProductDetailsPage;
