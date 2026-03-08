import React, { useEffect, useRef, useState } from "react";
import SummaryApi from "../common";
import { Link, useLocation } from "react-router";
import "../styles/CategoryListStyle.css";

const CategoryList = () => {
  const subCategory = "ALL";
  const [categories, setCategories] = useState([{ category: subCategory }]);
  const [activeCategory, setActiveCategory] = useState(subCategory);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const containerRef = useRef(null);
  const itemRefs = useRef({});

  const fetchCategoryProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(SummaryApi.category_product.url);
      const json = await res.json();
      setCategories([{ category: subCategory }, ...(json?.data || [])]);
    } catch (err) {
      console.log("CategoryList", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryProduct();
  }, []);

  // route change → active set
  useEffect(() => {
    const path = location.pathname;
    if (path === "/home" || path === "/") {
      setActiveCategory("ALL");
    } else if (path.startsWith("/category-wish/")) {
      const name = decodeURIComponent(path.split("/").pop() || "");
      setActiveCategory(name);
    }
  }, [location]);

  // auto scroll to active chip
  useEffect(() => {
    if (loading) return;

    const el = itemRefs.current[activeCategory];
    const container = containerRef.current;
    if (!el || !container) return;

    const elCenter = el.offsetLeft + el.offsetWidth / 2;
    const target = elCenter - container.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeCategory, categories.length, loading]);

  return (
    <div className="top-slide-category" ref={containerRef}>
      {loading
        ? Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="category-skeleton-chip" />
          ))
        : categories.map(({ category }) => {
            const isActive = activeCategory === category;

            return category === "ALL" ? (
              <Link
                key="ALL"
                to="/home"
                className={`category-item ${isActive ? "active" : ""}`}
                ref={(el) => (itemRefs.current["ALL"] = el)}
                onClick={() => setActiveCategory("ALL")}
              >
                All
              </Link>
            ) : (
              <Link
                key={category}
                to={`/category-wish/${encodeURIComponent(category)}`}
                className={`category-item ${isActive ? "active" : ""}`}
                ref={(el) => (itemRefs.current[category] = el)}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Link>
            );
          })}
    </div>
  );
};

export default CategoryList;