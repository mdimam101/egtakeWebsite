// import React, { useEffect, useRef, useState, useMemo } from "react";
import "../styles/UserProductCartStyle.css";
import { Link } from "react-router";

// Helper: safely get primary image (new API first, old API fallback)
// const getPrimaryImage = (p) => {
//   const v0 = p?.variants?.[0];
//   const img = v0?.images?.[0];
//   return (
//     img ||
//     p?.productImg?.[0] || // fallback for old data
//     "/no-image.png"
//   );
// };

const UserProductCart = ({ productData }) => {
  // news/labels (আগের লজিকই রাখলাম; শুধু qualityType থাকলে দেখাবো)
  // const demoNews = useMemo(() => {
  //   const labels = ["Free Delivery", "New Arrival", "Hot Offer"];
  //   if (productData?.qualityType) labels.splice(1, 0, productData.qualityType);
  //   return labels;
  // }, [productData?.qualityType]);

  // const totalItem = demoNews.length;

  // const [visibleIndex, setVisibleIndex] = useState(() =>
  //   Math.floor(Math.random() * totalItem)
  // );

  // const intervalRef = useRef(null);

  // useEffect(() => {
  //   // random delay create
  //   const randomDelay = Math.floor(Math.random() * 2000); // 0-2s random delay

  //   const startTimer = () => {
  //     intervalRef.current = setInterval(() => {
  //       setVisibleIndex((prev) => (prev + 1) % totalItem);
  //     }, 3000);
  //   };

  //   // first delay before starting interval
  //   const initialTimeout = setTimeout(startTimer, randomDelay);

  //   return () => {
  //     clearTimeout(initialTimeout);
  //     clearInterval(intervalRef.current);
  //   };
  // }, [totalItem]);

  // const primaryImg = getPrimaryImage(productData);

  return (
    <Link
      to={`/product/${productData?._id}`}
      onClick={(e) => {
        e.preventDefault();
        window.location.href = `/product/${productData?._id}`;
      }}
      className="user-product-card" 
      //style={{width:"100%",height:"auto"}}
    >
      <img
        src={productData?.img}
        alt={productData?.productName}
        className="user-product-img"
        loading="lazy"
        //  style={{width:"100%",height:"280px"}}
      />

      <div className="product-info">
        <h3>{productData?.productName}</h3>
        <p>
          <span className="tk-icon">৳</span>
          <span className="tk">{productData?.selling}</span>
        </p>
      </div>

      {/* 🔔 vertical news ticker (unchanged behavior) */}
      {/* <div className="news-box">
        <div
          className="news-container"
          style={{
            height: `${totalItem * 20}px`,
            transform: `translateY(-${visibleIndex * 20}px)`,
            transition: "transform 0.5s ease",
          }}
        > */}
          {/* {demoNews.map((news, idx) => (
            <div className="news-slide" key={idx}>
              <p>{news}</p>
            </div>
          ))} */}
        {/* </div> */}
      {/* </div> */}
    </Link>
  );
};

export default UserProductCart;
