import React from "react";

const ProductDetailsSkeleton = () => {
  return (
    <div className="product-details-container pd-skel">
      {/* back button (same place) */}
      <button type="button" className="p-back-button skel-btn" disabled>
        <span className="skel skel-circle" />
      </button>

      {/* Mobile slider skeleton */}
      <div className="product-image-slider-container">
        <div className="pd-skel-slider skel skel-rect" />
        <div className="image-count-indicator skel skel-pill" />
      </div>

      <div className="item-counter skel skel-pill pd-skel-counter" />

      {/* Price + name */}
      <div className="product-price-info">
        <span className="selling-price skel skel-line pd-skel-price" />
        <span className="discount skel skel-pill pd-skel-discount" />
        <span className="original-price skel skel-line pd-skel-original" />
      </div>

      <div className="product-name skel skel-line pd-skel-name" />
      <div className="color-info skel skel-line pd-skel-color" />

      {/* Color thumbnails skeleton */}
      <div className="color-selector-thumbnail">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="thumbnail-color-box skel skel-rect" />
        ))}
      </div>

      {/* Size section skeleton */}
      <div className="size-section">
        <div className="size-header">
          <div className="skel skel-line pd-skel-size-title" />
        </div>
        <div className="size-options">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="size-box skel skel-pill pd-skel-size" />
          ))}
        </div>
      </div>

      {/* Product details text skeleton */}
      <div className="review-preview">
        <div className="review-preview-header">
          <div className="review-title skel skel-line pd-skel-section-title" />
        </div>

        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="review-item" style={{ borderTop: "1px solid #f1f1f1" }}>
            <div style={{ flex: 1 }}>
              <div className="skel skel-line pd-skel-line1" />
              <div className="skel skel-line pd-skel-line2" />
              <div className="skel skel-line pd-skel-line3" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom add bar skeleton (same fixed feel) */}
      <div className="addbar">
        <div className="skel skel-line pd-skel-addname" />
        <button className="add-to-cart-fixed" disabled>
          <span className="skel skel-pill pd-skel-addbtn" />
        </button>
      </div>
    </div>
  );
};

export default ProductDetailsSkeleton;