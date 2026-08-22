import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SummaryApi from "../common";
import { toast } from "react-toastify";
import UserProductCart from "../components/UserProductCart";
import "../styles/HomePage.css";
import CategoryList from "../components/CategoryList";
import UserSlideProductCart from "../components/UserSlideProductCart";
import { useDispatch, useSelector } from "react-redux";
import { appendAllProductList, setAllProductList } from "../store/allProductSlice";
import { setBanarList } from "../store/banarSlice";
import TrendingGlassSlideCard from "../components/TrendingGlassSlideCard";
import { MdOutlineArrowBackIos } from "react-icons/md";
import {
  chunkProducts,
  getFirstVariantCards,
  normalizeProductCards,
  orderTrendingProducts,
} from "../helpers/homeProductCards";
import { setTrendingProductList } from "../store/trendingProductSlice";


const MAX_TRENDING_SLIDE_GROUPS = 4
const MAX_CATEGORY_SLIDE_GROUPS = 3;


const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.emamexp2.testeasupload";

const HomePage = () => {
  const [showAllTranding, setShowAllTranding] = useState(false);
  const [showAllLowPrice, setShowAllLowPrice] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  // ✅ skeleton loading state
  const [productLoading, setProductLoading] = useState(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [productPagination, setProductPagination] = useState({
    hasMore: true,
    nextPage: 1,
  });
  const [bannerLoading, setBannerLoading] = useState(false);
  const [slideCardCategories, setSlideCardCategories] = useState([]);
  const bannerRef = useRef(null);
  const productLoadMoreRef = useRef(null);
  const productRequestInFlightRef = useRef(false);
  const productRequestControllersRef = useRef(new Set());

  const allProducts = useSelector((s) => s.allProductState.productList);
  const trandingProducts = useSelector(
    (s) => s.trendingProductState.productList,
  );
  const hasLoadedTrendingProducts = useSelector(
    (s) => s.trendingProductState.hasLoaded,
  );
  const banners = useSelector((s) => s.banarState.banarList);
  const dispatch = useDispatch();

  // apps
  const [showPyzaraAppCard, setShowPyzaraAppCard] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  const clientKey = import.meta.env.VITE_PUBLIC_CLIENT_KEY;

  if (!clientKey) {
    console.error("VITE_PUBLIC_CLIENT_KEY is missing");
  }

  const fetchProductPage = useCallback(async (page) => {
    if (productRequestInFlightRef.current) return;

    const controller = new AbortController();
    productRequestControllersRef.current.add(controller);
    productRequestInFlightRef.current = true;

    try {
      if (page === 1) {
        setProductLoading(true);
      } else {
        setLoadingMoreProducts(true);
      }

      const params = new URLSearchParams({ page: String(page) });
      const response = await fetch(`${SummaryApi.product_cards.url}?${params}`, {
        headers: {
          "x-client-key": clientKey,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Product request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const cards = normalizeProductCards(data.data);

        if (page === 1) {
          dispatch(setAllProductList(cards));
        } else {
          dispatch(appendAllProductList(cards));
        }

        setProductPagination({
          hasMore: Boolean(data.pagination?.hasMore),
          nextPage: data.pagination?.nextPage ?? null,
        });
      } else {
        throw new Error(data.message || "Invalid product response");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Failed to fetch homepage products:", error);
        toast.error("Failed to fetch products");
      }
    } finally {
      productRequestControllersRef.current.delete(controller);
      productRequestInFlightRef.current = false;

      if (!controller.signal.aborted) {
        setProductLoading(false);
        setLoadingMoreProducts(false);
      }
    }
  }, [clientKey, dispatch]);

  useEffect(() => {
    const requestControllers = productRequestControllersRef.current;
    fetchProductPage(1);

    return () => {
      requestControllers.forEach((controller) => controller.abort());
      requestControllers.clear();
      productRequestInFlightRef.current = false;
    };
  }, [fetchProductPage]);

  useEffect(() => {
    const target = productLoadMoreRef.current;
    if (!target || !productPagination.hasMore || !productPagination.nextPage) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !productRequestInFlightRef.current) {
          fetchProductPage(productPagination.nextPage);
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchProductPage, productPagination]);

  const fetchTrendingProducts = useCallback(async (signal) => {
    try {
      const response = await fetch(SummaryApi.trending_product_cards.url, {
        headers: {
          "x-client-key": clientKey,
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(
          `Trending product request failed with status ${response.status}`,
        );
      }

      const data = await response.json();
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error(data.message || "Invalid trending product response");
      }

      dispatch(setTrendingProductList(normalizeProductCards(data.data)));
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Failed to fetch trending products:", error);
      }
    }
  }, [clientKey, dispatch]);

  useEffect(() => {
    if (hasLoadedTrendingProducts) return undefined;

    const controller = new AbortController();
    fetchTrendingProducts(controller.signal);
    return () => controller.abort();
  }, [fetchTrendingProducts, hasLoadedTrendingProducts]);

  const fetchSlideCards = useCallback(async (signal) => {
    try {
      const response = await fetch(SummaryApi.slide_cards.url, {
        method: SummaryApi.slide_cards.method,
        headers: {
          "x-client-key": clientKey,
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(
          `Slide card request failed with status ${response.status}`,
        );
      }

      const result = await response.json();
      if (!result.success || !Array.isArray(result.data)) {
        throw new Error(result.message || "Invalid slide card response");
      }

      const categories = result.data
        .map((item) => ({
          category: String(item?.category || "").trim(),
          products: (Array.isArray(item?.products) ? item.products : [])
            .map((product, index) => ({
              ...product,
              img: product?.image || product?.img || null,
              selling: product?.sellingPrice ?? product?.selling ?? 0,
              cardKey: `slide:${product?._id || index}`,
            }))
            .filter((product) => Number(product.priorityProduct) > 0)
            .sort(
              (first, second) =>
                Number(first.priorityProduct) - Number(second.priorityProduct),
            ),
        }))
        .filter((item) => item.category && item.products.length > 0);

      setSlideCardCategories(categories);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Failed to fetch slide cards:", error);
      }
    }
  }, [clientKey]);

  useEffect(() => {
    const controller = new AbortController();
    fetchSlideCards(controller.signal);
    return () => controller.abort();
  }, [fetchSlideCards]);

  const orderedTrendingProducts = useMemo(
    () => orderTrendingProducts(trandingProducts),
    [trandingProducts],
  );
  const trandingSlideProducts = useMemo(
    () => getFirstVariantCards(orderedTrendingProducts),
    [orderedTrendingProducts],
  );
  const trendingProductGroups = useMemo(
    () =>
      chunkProducts(trandingSlideProducts, 4).slice(
        0,
        MAX_TRENDING_SLIDE_GROUPS,
      ),
    [trandingSlideProducts],
  );

   // 💰 ০~১৯৯ টাকার লিস্ট
  const productsBelow199 = useMemo(
    () =>
      allProducts.filter((product) => Number(product?.selling) <= 199),
    [allProducts],
  );
  // const lowPriceSlideProducts = useMemo(
  //   () => getFirstVariantCards(productsBelow199),
  //   [productsBelow199],
  // );


  const fetchBanners = useCallback(async () => {
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
  }, [dispatch]);

  useEffect(() => {
    if (banners.length === 0) {
      fetchBanners();
    }
  }, [banners.length, fetchBanners]);

  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [banners]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;

      if (scrollingDown && currentScrollY > 10) {
        setShowPyzaraAppCard(true);
      } else {
        setShowPyzaraAppCard(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  // set selected slide product
  const selectedSlideProduct = showAllTranding
    ? orderedTrendingProducts
    : showAllLowPrice
      ? productsBelow199
      : [];

  return (
    <>
      <div
        className="top-slide-category"
        style={{
          position: "fixed",
          zIndex: 1000,
          top: "50px", //scroll slove er jonno 
          backgroundColor: "#fff",
          padding: "0px 0",
          borderBottom: "1px solid #eee",
          width: "100%",
          marginTop: "0px",
        }}
      >
        <CategoryList />
      </div>
      {showPyzaraAppCard && (
        <div className="pyzara-app-fixed-card">
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pyzara-app-fixed-link"
            aria-label="Download Pyzara app from Google Play"
          >
            <div className="pyzara-app-left">
              <div className="pyzara-logo-box">
                <img
                  src="/PyzaraWebIcone.png"
                  alt="Pyzara"
                  className="pyzara-app-logo"
                />
              </div>

              <div className="pyzara-app-info">
                <p className="pyzara-app-title">
                  Save more with <span>Pyzara App</span>
                </p>
                <p className="pyzara-app-subtitle">
                  More features & premium experience
                </p>
              </div>
            </div>

            <div className="pyzara-play-badge">
              <span className="pyzara-play-text">Open</span>
            </div>
          </a>
        </div>
      )}
      <>
        {/* when click on slide view more */}
        {(showAllLowPrice || showAllTranding) && (
          <div style={{ marginTop: "90px" }}> {/**scroll slove er jonno  */}
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
              <MdOutlineArrowBackIos className="backIcon" />
            </button>
            <div className="home-product-grid">
              {selectedSlideProduct.length > 0 &&
                selectedSlideProduct.map((product, idx) => (
                  <UserProductCart productData={product} key={idx} />
                ))}
            </div>
          </div>
        )}

        {!(showAllLowPrice || showAllTranding) && (
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
                 {orderedTrendingProducts.length > 0 && (
                  <div className="tranding-section tranding-bg">
                    <h2 className="home-section-title section-trending">
                      🔥 Tranding
                    </h2>

                    <div
                      className="tranding-slider trending-group-slider"
                      aria-label="Trending products"
                    >
                      {trendingProductGroups.map((group, groupIndex) => (
                        <div
                          className="trending-product-group"
                          key={`trending-group-${groupIndex}`}
                        >
                          {group.map((product) => (
                            <TrendingGlassSlideCard
                              productData={product}
                              key={product.cardKey}
                            />
                          ))}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="trending-see-more"
                      onClick={() => {
                        setShowAllTranding(true);
                        setShowAllLowPrice(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      See more
                    </button>
                  </div>
                )}

                 {slideCardCategories.map(({ category, products }) => {
                  const productGroups = chunkProducts(products, 4).slice(
                    0,
                    MAX_CATEGORY_SLIDE_GROUPS,
                  );

                  return (
                    <section
                      className="tranding-section tranding-bg category-slide-section"
                      key={category}
                    >
                      <h2 className="home-section-title section-category-slide">
                        {category}
                      </h2>
                      <div
                        className="tranding-slider trending-group-slider"
                        aria-label={`${category} products`}
                      >
                        {productGroups.map((group, groupIndex) => (
                          <div
                            className="trending-product-group category-product-group"
                            key={`${category}-${groupIndex}`}
                          >
                            {group.map((product) => (
                              <TrendingGlassSlideCard
                                productData={product}
                                showPrice
                                key={`${category}-${product.cardKey}`}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
                
                {/* 💰 0~199 টাকা Shop Section */}
                {/* {productsBelow199 && productsBelow199.length > 0 && (
                  <div className="low-price-section">
                    <h2 className="home-section-title section-budget">
                      💰 ০~১৯৯ টাকা
                    </h2>
                    <div className="tranding-slider">
                       {lowPriceSlideProducts.slice(0, 6).map((product) => (
                        <UserSlideProductCart
                          productData={product}
                          key={product.cardKey}
                        />
                      ))}

                      {productsBelow199.length >
                        Math.min(6, lowPriceSlideProducts.length) && (
                        <div
                          className="view-more-card"
                          onClick={() => {
                            (setShowAllTranding(false),
                              setShowAllLowPrice(true));
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
                )} */}

                {allProducts.length > 0 && (
                  <h2 className="home-section-title section-budget">
                    For Yours
                  </h2>
                )}

                {/* ✅ Products Grid */}
                <div className="home-product-grid">
                  {allProducts.length > 0 &&
                    allProducts.map((product) => (
                      <UserProductCart
                        productData={product}
                        key={product.cardKey}
                      />
                    ))}
                </div>
                {productPagination.hasMore && (
                  <div ref={productLoadMoreRef} aria-hidden="true">
                    {loadingMoreProducts && (
                      <div className="home-horizontal-skeleton">
                        {Array.from({ length: 2 }).map((_, idx) => (
                          <div className="slide-card-skeleton" key={idx}>
                            <div className="slide-card-img shimmer"></div>
                            <div className="slide-card-line shimmer"></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </>
    </>
  );
};

export default HomePage;
