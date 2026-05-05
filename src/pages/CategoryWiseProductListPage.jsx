import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router";
import SummaryApi from "../common";
import UserProductCart from "../components/UserProductCart";
import CategoryList from "../components/CategoryList";
import { generateOptimizedVariants } from "../helpers/variantUtils";
import UserProductCartSkeleton from "../components/skeletonAnime/UserProductCartSkeleton";

const CategoryWiseProductListPage = () => {
  const [wishProductList, setWishProductList] = useState([]);

  const params = useParams();
  const location = useLocation();

  const restoredRef = useRef(false);

  const categoryName = params.categoryName;

  const productCacheKey = `category-products-${categoryName}`;
  const scrollKey = `scroll-position-${location.pathname}`;

  // ✅ old category product cache remove
  // শুধু current category cache রাখবে, বাকিগুলো remove করবে
  const clearOldCategoryProductCache = useCallback(() => {
    Object.keys(sessionStorage).forEach((key) => {
      const isCategoryProductCache = key.startsWith("category-products-");

      if (isCategoryProductCache && key !== productCacheKey) {
        sessionStorage.removeItem(key);
      }
    });
  }, [productCacheKey]);

  const fetchWishCategoryProduct = useCallback(async () => {
    try {
      const response = await fetch(SummaryApi.category_wish_product.url, {
        method: SummaryApi.category_wish_product.method,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          category: categoryName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const optimized = generateOptimizedVariants(result.data || []);

        setWishProductList(optimized);

        // ✅ only current category cache save
        sessionStorage.setItem(productCacheKey, JSON.stringify(optimized));
      } else {
        setWishProductList([]);
        sessionStorage.removeItem(productCacheKey);
      }
    } catch (error) {
      console.log("Error fetching category product:", error);
    }
  }, [categoryName, productCacheKey]);

  useEffect(() => {
    restoredRef.current = false;

    // ✅ old category caches remove
    clearOldCategoryProductCache();

    const cachedProducts = sessionStorage.getItem(productCacheKey);

    if (cachedProducts) {
      try {
        setWishProductList(JSON.parse(cachedProducts));
      } catch (error) {
        console.log("Category cache parse error:", error);
        setWishProductList([]);
        sessionStorage.removeItem(productCacheKey);
      }
    } else {
      setWishProductList([]);
    }

    // ✅ API call only one time
    fetchWishCategoryProduct();
  }, [productCacheKey, fetchWishCategoryProduct, clearOldCategoryProductCache]);

  // ✅ Back from ProductDetails hole old scroll restore
  useEffect(() => {
    if (wishProductList.length === 0 || restoredRef.current) return;

    const lastProductListPath = sessionStorage.getItem("last-product-list-path");
    const savedScroll = sessionStorage.getItem(scrollKey);

    if (lastProductListPath !== location.pathname || savedScroll === null) {
      restoredRef.current = true;
      return;
    }

    const restoreScroll = () => {
      window.scrollTo({
        top: Number(savedScroll),
        behavior: "auto",
      });
    };

    restoreScroll();

    const timer1 = setTimeout(restoreScroll, 100);
    const timer2 = setTimeout(restoreScroll, 300);
    const timer3 = setTimeout(restoreScroll, 600);

    restoredRef.current = true;

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [wishProductList, location.pathname, scrollKey]);

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

      <div
        className="product-grid"
        style={{ marginTop: "50px", marginBottom: "75px" }}
      >
        {wishProductList.length > 0
          ? wishProductList.map((ele, idx) => (
              <UserProductCart productData={ele} key={idx} />
            ))
          : Array.from({ length: 4 }).map((_, idx) => (
              <div style={{ width: "160px", flex: "0 0 auto" }} key={idx}>
                <UserProductCartSkeleton />
              </div>
            ))}
      </div>
    </>
  );
};

export default CategoryWiseProductListPage;