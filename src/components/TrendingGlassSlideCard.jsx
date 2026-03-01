import React from "react";
import { Link } from "react-router";
import "../styles/TrendingGlassSlideCard.css";

const TrendingGlassSlideCard = ({ productData }) => {
  return (
    <Link
      to={`/product/${productData?._id}`}
      onClick={(e) => {
        e.preventDefault();
        window.location.href = `/product/${productData?._id}`;
      }}
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
      </div>
    </Link>
  );
};

export default TrendingGlassSlideCard;