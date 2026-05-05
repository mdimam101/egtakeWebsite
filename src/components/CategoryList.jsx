import React, { useEffect, useRef, useState } from "react";
import SummaryApi from "../common";
import { Link, useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { setCategoryList } from "../store/categorySlice";
import "../styles/CategoryListStyle.css";

const CategoryList = () => {
  const subCategory = "ALL";

  const dispatch = useDispatch();
  const location = useLocation();

  const containerRef = useRef(null);
  const itemRefs = useRef({});

  const categoryList = useSelector(
    (state) => state.categoryState.categoryList
  );

  const [activeCategory, setActiveCategory] = useState(subCategory);
  const [loading, setLoading] = useState(categoryList.length === 0);

  const categories =
    categoryList.length > 0
      ? categoryList
      : [{ category: subCategory }];

  const fetchCategoryProduct = async () => {
    try {
      setLoading(true);

      const res = await fetch(SummaryApi.category_product.url);
      const json = await res.json();

      const finalCategories = [
        { category: subCategory },
        ...(json?.data || []),
      ];

      dispatch(setCategoryList(finalCategories));
    } catch (err) {
      console.log("CategoryList", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redux এ category থাকলে আবার API call করবে না
    if (categoryList.length > 0) {
      setLoading(false);
      return;
    }

    fetchCategoryProduct();
  }, []);

  // route change হলে active category set করবে
  useEffect(() => {
    const path = location.pathname;

    if (path === "/home" || path === "/") {
      setActiveCategory("ALL");
    } else if (path.startsWith("/category-wish/")) {
      const name = decodeURIComponent(path.split("/").pop() || "");
      setActiveCategory(name);
    }
  }, [location]);

  // active category chip auto scroll
  useEffect(() => {
    if (loading) return;

    const el = itemRefs.current[activeCategory];
    const container = containerRef.current;

    if (!el || !container) return;

    // const elCenter = el.offsetLeft + el.offsetWidth / 2;
    // const target = elCenter - container.clientWidth / 2;

    // container.scrollTo({
    //   left: Math.max(0, target),
    //   behavior: "smooth",
    // });
  }, [activeCategory, categories.length, loading]);

  return (
    <div className="top-slide-category" ref={containerRef}>
      {loading
        ? Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="category-skeleton-chip" />
          ))
        : categories.map(({ category }) => {
            const isActive = activeCategory === category;

            if (category === "ALL") {
              return (
                <Link
                  key="ALL"
                  to="/home"
                  className={`category-item ${isActive ? "active" : ""}`}
                  ref={(el) => {
                    itemRefs.current["ALL"] = el;
                  }}
                  onClick={() => {
                    setActiveCategory("ALL");
                    window.scrollTo({ top: 0, behavior: "auto" });
                  }}
                >
                  All
                </Link>
              );
            }

            return (
              <Link
                key={category}
                to={`/category-wish/${encodeURIComponent(category)}`}
                className={`category-item ${isActive ? "active" : ""}`}
                ref={(el) => {
                  itemRefs.current[category] = el;
                }}
                onClick={() => {
                  setActiveCategory(category);

                  // category click করলে old product scroll restore বন্ধ করবে
                  sessionStorage.removeItem("last-product-list-path");

                  // নতুন category page এ গেলে top থেকে show করবে
                  setTimeout(() => {
                    window.scrollTo({
                      top: 0,
                      behavior: "auto",
                    });
                  }, 0);
                }}
              >
                {category}
              </Link>
            );
          })}
    </div>
  );
};

export default CategoryList;