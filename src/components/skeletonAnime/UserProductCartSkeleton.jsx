import React from "react";
import "../../styles/UserProductCartStyle.css";

const UserProductCartSkeleton = () => {
  return (
    <div className="user-product-card skeleton-card">
      <div className="user-product-img skeleton-shimmer"></div>

      <div className="product-info">
        <div className="skeleton-line skeleton-title skeleton-shimmer"></div>
        <div className="skeleton-line skeleton-title short skeleton-shimmer"></div>

        <div className="skeleton-price-row">
          <div className="skeleton-tk-icon skeleton-shimmer"></div>
          <div className="skeleton-price skeleton-shimmer"></div>
        </div>
      </div>

      <div className="news-box skeleton-news-box">
        <div className="skeleton-news-line skeleton-shimmer"></div>
      </div>
    </div>
  );
};

export default UserProductCartSkeleton;