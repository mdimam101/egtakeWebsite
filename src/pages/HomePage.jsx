import React, { useEffect, useRef, useState } from "react";
import SummaryApi from "../common";
import { toast } from "react-toastify";
import UserProductCart from "../components/UserProductCart";
import "../styles/HomePage.css";
import CategoryList from "../components/CategoryList";
import UserSlideProductCart from "../components/UserSlideProductCart";
import { useDispatch, useSelector } from "react-redux";
import { setAllProductList } from "../store/allProductSlice";
import { generateOptimizedVariants } from "../helpers/variantUtils";
import { setBanarList } from "../store/banarSlice";
import TrendingGlassSlideCard from "../components/TrendingGlassSlideCard";
import { MdOutlineArrowBackIos } from "react-icons/md";

const HomePage = () => {
  const [showAllTranding, setShowAllTranding] = useState(false);
  const [showAllLowPrice, setShowAllLowPrice] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  // ✅ skeleton loading state
  const [productLoading, setProductLoading] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);
  const bannerRef = useRef(null);

  const allProducts = useSelector((s) => s.allProductState.productList);
  const banners = useSelector((s) => s.banarState.banarList);
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
      setBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
    } else if (deltaX < -threshold) {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }
  };

  const fetchAllProducts = async () => {
    try {
      setProductLoading(true);

      const response1 = await fetch(SummaryApi.current_user.url, {
        method: SummaryApi.current_user.method,
      });
      const result1 = await response1.json();
      console.log("fetchUserDetails999999", result1);

      const response = await fetch(SummaryApi.get_product.url);
      const data = await response.json();

      if (data.success) {
        console.log("productdata", data.data);
        const optimized = generateOptimizedVariants(data.data);
        console.log("◆productList◆optimized", allProducts);
        dispatch(setAllProductList(optimized));
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch products");
    } finally {
      setProductLoading(false);
    }
  };

  useEffect(() => {
    if (allProducts.length === 0) {
      fetchAllProducts();
    }
  }, []);

  // 🔥 ট্রেন্ডিং প্রডাক্ট
  const trandingProducts = allProducts.filter(
    (product) => product?.trandingProduct === true,
  );

  // 💰 ০~৯৯ টাকার লিস্ট
  const productsBelow99 = allProducts.filter(
    (product) => Number(product?.selling) <= 99,
  );

  const fetchBanners = async () => {
    try {
      setBannerLoading(true);

      const res = await fetch(SummaryApi.get_banner.url);
      const data = await res.json();

      if (data.success) {
        dispatch(setBanarList(data.data || []));
      }
    } catch {
      // console.log("Banner fetch error:", err);
    } finally {
      setBannerLoading(false);
    }
  };

  useEffect(() => {
    if (banners.length === 0) {
      fetchBanners();
    }
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [banners]);

  // set selected slide product
  const selectedSlideProduct = showAllTranding ? trandingProducts : showAllLowPrice ? productsBelow99 : []

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
          marginTop: "0px",
        }}
      >
        <CategoryList />
      </div>
      <>
      {/* when click on slide view more */}
      {(showAllLowPrice || showAllTranding) &&
      <div style={{marginTop:"40px"}}>
          <button
              type="button"
              className="slide-back-button"
              onClick={() => {
                setShowAllTranding(false);
                setShowAllLowPrice(false);
                 window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            >
            <MdOutlineArrowBackIos  className="backIcon"/>
            
            </button>
          <div className="home-product-grid">
            {selectedSlideProduct.length > 0 &&
              selectedSlideProduct.map((product, idx) => (
                <UserProductCart productData={product} key={idx} />
              ))}
          </div>
      </div>
      }
    
      { !(showAllLowPrice || showAllTranding) &&
      <div className="homepage">
        {/* 🖼️ Banner / Banner Skeleton */}
        {bannerLoading ? (
          <div className="banner-skeleton-wrap">
            <div className="banner-skeleton shimmer"></div>
          </div>
        ) : (
          banners.length > 0 && (
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
          )
        )}

        {/* 🔥 Trending Skeleton */}
        {productLoading ? (
          <>
            <div className="home-title-skeleton shimmer"></div>
            <div className="home-horizontal-skeleton">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div className="slide-card-skeleton" key={idx}>
                  <div className="slide-card-img shimmer"></div>
                  <div className="slide-card-line shimmer"></div>
                  <div className="slide-card-line short shimmer"></div>
                </div>
              ))}
            </div>

            <div className="home-title-skeleton green shimmer"></div>
            <div className="home-horizontal-skeleton">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div className="slide-card-skeleton" key={idx}>
                  <div className="slide-card-img shimmer"></div>
                  <div className="slide-card-line shimmer"></div>
                  <div className="slide-card-line short shimmer"></div>
                </div>
              ))}
            </div>

            <div className="home-title-skeleton foryou shimmer"></div>
            <div className="home-product-grid">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div className="product-card-skeleton" key={idx}>
                  <div className="product-skeleton-img shimmer"></div>
                  <div className="product-skeleton-line shimmer"></div>
                  <div className="product-skeleton-line medium shimmer"></div>
                  <div className="product-skeleton-line short shimmer"></div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* 🔥 Tranding Slide Section */}
            {trandingProducts &&
              trandingProducts.length > 0 && (
                <div className="tranding-section tranding-bg">
                  <h2 className="home-section-title section-trending">
                    🔥 Tranding
                  </h2>

                  <div className="tranding-slider">
                    {trandingProducts.slice(0, 6).map((product, idx) => (
                      <TrendingGlassSlideCard productData={product} key={idx} />
                    ))}

                    {trandingProducts.length > 5 && (
                       <div
                        className="view-more-card"
                        onClick={() => {
                          setShowAllTranding(true),
                          setShowAllLowPrice(false)
                        }}
                      >
                        <p className="view-more-text">View All ➜</p>
                      </div>
                      
                    )}
                  </div>
                </div>
              )}

            {/* 💰 0~99 টাকা Shop Section */}
            {productsBelow99 &&
             productsBelow99.length > 0 && (
                <div className="low-price-section">
                  <h2 className="home-section-title section-budget">
                    💰 ০~৯৯ টাকা
                  </h2>
                  <div className="tranding-slider">
                    {productsBelow99.slice(0, 6).map((product, idx) => (
                      <UserSlideProductCart productData={product} key={idx} />
                    ))}

                    {productsBelow99.length > 6 && (
                      <div
                        className="view-more-card"
                        onClick={() => {
                          setShowAllTranding(false),
                          setShowAllLowPrice(true)
                          window.scrollTo({
                          top: 0,
                          behavior: "smooth",
                          });
                        }}
                      >
                        <p className="view-more-text">View All ➜</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {allProducts.length > 0 && (
              <h2 className="home-section-title section-budget">For Yours</h2>
            )}

            {/* ✅ Products Grid */}
            <div className="home-product-grid">
              {allProducts.length > 0 &&
                allProducts.map((product, idx) => (
                  <UserProductCart productData={product} key={idx} />
                ))}
            </div>
          </>
        )}
      </div> 
      }
      </>
    </>
  );
};

export default HomePage;
