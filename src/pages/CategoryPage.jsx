import { useEffect, useMemo, useState } from "react";
import SummaryApi from "../common";
import "../styles/CategoryPageStyles.css";
import { Link } from "react-router";

// Helper: get a safe thumbnail from new product structure
const getProductThumb = (product) => {
  if (!product) return "";

  if (Array.isArray(product.productImg) && product.productImg.length > 0) {
    return product.productImg[0];
  }

  if (Array.isArray(product.variants)) {
    for (const v of product.variants) {
      if (Array.isArray(v?.images) && v.images.length > 0 && v.images[0]) {
        return v.images[0];
      }
    }
  }

  return "";
};

const safeText = (v, fallback = "—") =>
  typeof v === "string" && v.trim().length > 0 ? v : fallback;

const CategoryPage = () => {
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategoryProduct = async () => {
    try {
      const response = await fetch(SummaryApi.category_product.url);
      const dataResponse = await response.json();
      setCategoryList(
        Array.isArray(dataResponse?.data) ? dataResponse.data : [],
      );
    } catch (err) {
      console.log("CategoryPage Error:", err?.message);
      setCategoryList([]);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await fetch(SummaryApi.get_product.url);
      const data = await response.json();
      setAllProducts(
        data?.success && Array.isArray(data?.data) ? data.data : [],
      );
    } catch (err) {
      console.log("Products fetch error:", err);
      setAllProducts([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchCategoryProduct(), fetchAllProducts()]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  const filteredCategories = useMemo(() => {
    if (!Array.isArray(allProducts) || allProducts.length === 0) return [];

    const productsSource =
      selectedCategory === "All"
        ? allProducts
        : allProducts.filter(
            (p) =>
              typeof p?.category === "string" &&
              p.category.trim() === selectedCategory,
          );

    const subCats = productsSource
      .map((p) =>
        typeof p?.subCategory === "string" ? p.subCategory.trim() : "",
      )
      .filter((s) => s !== "");

    const uniqueSubCats = Array.from(new Set(subCats));

    const reps = uniqueSubCats
      .map((sc) => productsSource.find((p) => p?.subCategory?.trim() === sc))
      .filter(Boolean);

    return reps;
  }, [allProducts, selectedCategory]);

  return (
    <div className="category-page-container">
      {/* Left Sidebar */}
      <aside className="category-sidebar">
        <div className="category-sidebar-header">
          <h3>Categories</h3>
          <span>{selectedCategory}</span>
        </div>

        <ul>
          {loading ? (
            Array.from({ length: 7 }).map((_, idx) => (
              <li key={idx}>
                <div className="category-btn-skeleton shimmer"></div>
              </li>
            ))
          ) : (
            <>
              <li>
                <button
                  onClick={() => setSelectedCategory("All")}
                  className={selectedCategory === "All" ? "active" : ""}
                  style={{marginTop:"5px"}}
                >
                  <span>All</span>
                </button>
              </li>

              {Array.isArray(categoryList) &&
                categoryList
                  .filter(
                    (c) =>
                      typeof c?.category === "string" &&
                      c.category.trim() !== "",
                  )
                  .map((cat) => {
                    const key = cat.category;
                    return (
                      <li key={key}>
                        <button
                          onClick={() => setSelectedCategory(key)}
                          className={selectedCategory === key ? "active" : ""}
                          style={{marginTop:"5px"}}
                        >
                          <span>{key}</span>
                        </button>
                      </li>
                    );
                  })}
            </>
          )}
        </ul>
      </aside>

      {/* Right Side */}
      <section className="subcategory-section">
        {/* <div className="subcategory-topbar">
          <div>
            <h2>
              {selectedCategory === "All"
                ? "All Sub Categories"
                : selectedCategory}
            </h2>
            <p>{filteredCategories.length} items found</p>
          </div>
        </div> */}

        <div className="subcategory-grid">
          {loading ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <div className="subcategory-card skeleton-card" key={idx}>
                <div className="subcategory-thumb-skeleton shimmer"></div>
                <div className="subcategory-text-skeleton shimmer"></div>
                <div className="subcategory-text-skeleton short shimmer"></div>
              </div>
            ))
          ) : filteredCategories.length === 0 ? (
            <div className="subcategory-empty">No items to show.</div>
          ) : (
            filteredCategories.map((item, idx) => {
              const subCatName = safeText(item?.subCategory, "Unknown");
              const thumb = getProductThumb(item);
              return (
                <Link
                  to={`/sub-category-wish/${encodeURIComponent(subCatName)}`}
                  className="subcategory-card"
                  key={`${subCatName}-${idx}`}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={subCatName}
                      className="subcategory-icon"
                    />
                  ) : (
                    <div className="subcategory-placeholder-icon">
                      {subCatName.charAt(0)}
                    </div>
                  )}
                  <p>{subCatName}</p>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;
