import React, { useEffect, useRef, useState } from "react";
import SummaryApi from "../common";
import { toast } from "react-toastify";
import UserProductCart from "../components/UserProductCart";
import "../styles/HomePage.css";
import { useLocation } from "react-router";
import CategoryList from "../components/CategoryList";
import UserSlideProductCart from "../components/UserSlideProductCart";
import { useDispatch, useSelector } from "react-redux";
import { setAllProductList } from "../store/allProductSlice";
import { generateOptimizedVariants } from "../helpers/variantUtils";
import {setBanarList} from '../store/banarSlice'

const HomePage = () => {
 // const [allProducts, setAllProducts] = useState([]);
  const [showAllTranding, setShowAllTranding] = useState(false);
  const [showAllLowPrice, setShowAllLowPrice] = useState(false);
  const location = useLocation();
  // const [banners, setBanners] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef(null);
  const [touchStartX, setTouchStartX] = useState(0);
  const allProducts = useSelector((s) => s.allProductState.productList);
  const banners = useSelector((s) => s.banarState.banarList)
  const dispatch = useDispatch();
    
 console.log("◆productList◆from store", allProducts);
  // 👇 Touch start
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  // 👇 Touch end
  const handleTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const threshold = 50;

    if (deltaX > threshold) {
      // swipe right
      setBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
    } else if (deltaX < -threshold) {
      // swipe left
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response1 = await fetch(SummaryApi.current_user.url, {
        method: SummaryApi.current_user.method,
      });
      // you had this for logging/debug
      const result1 = await response1.json();
      console.log("fetchUserDetails999999", result1);

      const response = await fetch(SummaryApi.get_product.url);
      const data = await response.json();

      if (data.success) {
        console.log("productdata", data.data);
        // setAllProducts(data.data || []);
         const optimized = generateOptimizedVariants(data.data);
           console.log("◆productList◆optimized", allProducts);

        dispatch(setAllProductList(optimized))
       
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch products");
    }
  };

  useEffect(() => {
    if (allProducts.length === 0) {
      fetchAllProducts();
    }
  }, []);
  // 🔥 ট্রেন্ডিং প্রডাক্ট (ফিল্ড: trandingProduct = true)
  const trandingProducts = allProducts.filter(
    (product) => product?.trandingProduct === true
  );

  // 💰 ০~৯৯ টাকার লিস্ট
  const productsBelow99 = allProducts.filter(
    (product) => Number(product?.selling) <= 99
  );

  const isTrandingPage = location.pathname === "/tranding";

  const visibleProducts = showAllTranding
    ? trandingProducts
    : showAllLowPrice
    ? productsBelow99
    : isTrandingPage
    ? trandingProducts
    : allProducts;

  const fetchBanners = async () => {
    try {
      const res = await fetch(SummaryApi.get_banner.url);
      const data = await res.json();
      console.log("Banner API response:", data);
      if (data.success) {
        // setBanners(data.data || []);
        dispatch(setBanarList(data.data || []))
      }
    } catch (err) {
      console.log("Banner fetch error:", err);
      toast.error("Failed to fetch banners");
    }
  };

  useEffect(() => {
    if (banners.length == 0 ) {
      fetchBanners();
    } else {
      // setBanners(banarList || []);
    }
    
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [banners]);

  console.log("setbanners", banners[0]?.imageUrl);

  return (
    <>
      <div
        className="top-slide-category"
        style={{
          position: "fixed",
          zIndex: 1000,
          backgroundColor: "#fff",
          padding: "0px 0",
          borderBottom: "1px solid #eee",
          width: "100%",
          marginTop: "5px",
        }}
      >
        <CategoryList />
      </div>

      <div className="homepage" style={{ marginTop: "40px" }}>
        {/* 🖼️ Auto-Sliding Banner */}
        {banners.length > 0 && (
          <div
            className="banner-container"
            ref={bannerRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={banners[bannerIndex]?.imageUrl}
              alt={banners[bannerIndex]?.altText || "Banner"}
              className="banner-image"
            />

            {/* 🔘 Dot Navigation */}
            <div className="banner-dots">
              {banners.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === bannerIndex ? "active" : ""}`}
                  onClick={() => setBannerIndex(index)}
                ></span>
              ))}
            </div>
          </div>
        )}

        {/* 🔥 Tranding Slide Section */}
        {!showAllTranding && !isTrandingPage && trandingProducts.length > 0 && (
          <div className="tranding-section">
            <h2 className="section-title">🔥 Tranding Products</h2>
            <div className="tranding-slider">
              {trandingProducts.slice(0, 10).map((product, idx) => (
                <UserSlideProductCart productData={product} key={idx} />
              ))}

              {trandingProducts.length > 10 && (
                <div
                  className="view-more-card"
                  onClick={() => setShowAllTranding(true)}
                >
                  <p className="view-more-text">View More ➜</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 💰 0~99 টাকা Shop Section */}
        {!showAllTranding &&
          !isTrandingPage &&
          !showAllLowPrice &&
          productsBelow99.length > 0 && (
            <div className="low-price-section">
              <h2 className="section-title">💰 ০~৯৯ টাকা Shop</h2>
              <div className="tranding-slider">
                {productsBelow99.slice(0, 12).map((product, idx) => (
                  <UserSlideProductCart productData={product} key={idx} />
                ))}

                {productsBelow99.length > 12 && (
                  <div
                    className="view-more-card"
                    onClick={() => setShowAllLowPrice(true)}
                  >
                    <p className="view-more-text">View All ➜</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <p style={{paddingLeft:"10px", fontWeight:'bold'}}>For Yours</p>

        {/* ✅ Products Grid */}
        <div className="home-product-grid">
          {visibleProducts.length > 0 &&
            visibleProducts.map((product, idx) => (
              <UserProductCart productData={product} key={idx} />
            ))}
        </div>
      </div>
    </>
  );
};

export default HomePage;
