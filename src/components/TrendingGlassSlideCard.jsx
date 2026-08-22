import React from "react";
import { Link } from "react-router";
import "../styles/TrendingGlassSlideCard.css";
import { getPrimaryProductImage, getProductUrlPath } from "../helpers/productSeo";

const TrendingGlassSlideCard = ({ productData, showPrice = false }) => {
  const regularPrice = productData?.price;
  const sellingPrice = productData?.selling ?? productData?.sellingPrice;
  const hasRegularPrice =
    regularPrice !== undefined && regularPrice !== null && regularPrice !== "";
  const hasSellingPrice =
    sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== "";

  return (
    <Link
          to={getProductUrlPath(productData)}
      state={{ selectedImage: getPrimaryProductImage(productData) }}
      // to={`/product/${productData?._id}`}
      // state={{ selectedImage: productData?.img }}

      // ----------------------
      // onClick={(e) => {
      //   e.preventDefault();
      //   window.location.href = `/product/${productData?._id}`;
      // }}
      className="trend-glass-card"
      title={productData?.productName}
    >
      <div className="trend-glass-img-wrap">
        <img
          src={productData?.img}
          alt={productData?.productName || "product"}
          className="trend-glass-img"
          loading="lazy"
        />
      </div>

      <div className="trend-glass-info">
        <h3 className="trend-glass-title">{productData?.productName}</h3>
        {showPrice && (hasRegularPrice || hasSellingPrice) && (
          <div className="trend-glass-prices" aria-label="Product price">
            {hasSellingPrice && (
              <strong className="trend-glass-selling-price">
                ৳{sellingPrice}
              </strong>
            )}
            {hasRegularPrice && (
              <span className="trend-glass-regular-price">
                ৳{regularPrice}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default TrendingGlassSlideCard;