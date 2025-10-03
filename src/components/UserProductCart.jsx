import React, { useEffect, useRef, useState } from "react";
import "../styles/UserProductCartStyle.css";
import { Link } from "react-router";

const UserProductCart = ({ productData }) => {
  const demoNews = ["Free Delivery", "Premium", "New Arrival", "Hot Offer"];
  const totalItem = demoNews.length;

  const [visibleIndex, setVisibleIndex] = useState(() => {
    return Math.floor(Math.random() * totalItem);
  });

  const intervalRef = useRef(null);

  useEffect(() => {
    // random delay create
    const randomDelay = Math.floor(Math.random() * 2000); // 0-2s random delay

    const startTimer = () => {
      intervalRef.current = setInterval(() => {
        setVisibleIndex((prev) => (prev + 1) % totalItem);
      }, 3000);
    };

    // first delay before starting interval
    const initialTimeout = setTimeout(startTimer, randomDelay);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalRef.current);
    };
  }, [totalItem]);

  return (
    <Link
      to={`/product/${productData?._id}`}
      onClick={(e) => {
        e.preventDefault();
        window.location.href = `/product/${productData?._id}`;
      }}
      className="product-card"
    >
      <img
        src={productData?.productImg?.[0]}
        alt={productData?.productName}
        className="product-img"
      />
      <div className="product-info">
        <h3>{productData?.productName}</h3>
        <p>
          <span className="tk-icon">৳</span>
          <span className="tk">{productData?.selling}</span>
        </p>
      </div>

      <div className="news-box">
        <div
          className="news-container"
          style={{
            height: `${totalItem * 20}px`,
            transform: `translateY(-${visibleIndex * 20}px)`,
            transition: "transform 0.5s ease",
          }}
        >
          {demoNews.map((news, idx) => (
            <div className="news-slide" key={idx}>
              <p>{news}</p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default UserProductCart;
