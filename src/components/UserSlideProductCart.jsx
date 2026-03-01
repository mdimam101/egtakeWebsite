import React from "react";
import "../styles/UserSlideProductCar.css";
import { Link } from "react-router";

const UserSlideProductCart = ({ productData }) => {
  return (
    <Link
      to={`/product/${productData?._id}`}
      onClick={(e) => {
        e.preventDefault();
        window.location.href = `/product/${productData?._id}`;
      }}
      className="slide-product-card"
      title={productData?.productName}
    >
      <div className="slide-product-img-wrap">
        <img
          src={productData?.img}
          alt={productData?.productName || "product"}
          className="slide-product-img"
          loading="lazy"
        />
      </div>

      <div className="slide-product-info">
  <h3 className="slide-title">{productData?.productName}</h3>

  <div className="slide-price-under">
    <span className="tk-icon">৳</span>
    <span className="tk">{productData?.selling}</span>
  </div>
</div>
    </Link>
  );
};

export default UserSlideProductCart;