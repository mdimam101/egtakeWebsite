import { useEffect, useMemo, useState } from "react";
import SummaryApi from "../common";
import "../styles/CategoryPageStyles.css";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  setCategoryList,
  setCategoryPageProductList,
} from "../store/categorySlice";

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
  const dispatch = useDispatch();

  const clientKey = import.meta.env.VITE_PUBLIC_CLIENT_KEY;

if (!clientKey) {
  console.error("VITE_PUBLIC_CLIENT_KEY is missing");
}


  const reduxCategoryList = useSelector(
    (state) => state.categoryState.categoryList
  );

  const reduxProductList = useSelector(
    (state) => state.categoryState.categoryPageProductList
  );

  const [selectedCategory, setSelectedCategory] = useState("All");

  const [loading, setLoading] = useState(
    reduxCategoryList.length === 0 || reduxProductList.length === 0
  );

  const categoryList = reduxCategoryList || [];
  const allProducts = reduxProductList || [];

  const fetchCategoryProduct = async () => {
    try {
      const response = await fetch(SummaryApi.category_product.url, {
        credentials: "include",
        headers: {
          "x-client-key": clientKey,
        },
      });
      const dataResponse = await response.json();

      const finalCategoryList = Array.isArray(dataResponse?.data)
        ? dataResponse.data
        : [];

      dispatch(setCategoryList(finalCategoryList));
    } catch (err) {
      console.log("CategoryPage Error:", err?.message);
      dispatch(setCategoryList([]));
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response =await fetch(SummaryApi.get_product.url, {
        credentials: "include",
        headers: {
          "x-client-key": clientKey,
        },
      });
      const data = await response.json();

      const finalProductList =
        data?.success && Array.isArray(data?.data) ? data.data : [];

      dispatch(setCategoryPageProductList(finalProductList));
    } catch (err) {
      console.log("Products fetch error:", err);
      dispatch(setCategoryPageProductList([]));
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const needCategoryApi = reduxCategoryList.length === 0;
        const needProductApi = reduxProductList.length === 0;

        // Redux e data thakle API call korbe na
        if (!needCategoryApi && !needProductApi) {
          setLoading(false);
          return;
        }

        setLoading(true);

        const apiCalls = [];

        if (needCategoryApi) {
          apiCalls.push(fetchCategoryProduct());
        }

        if (needProductApi) {
          apiCalls.push(fetchAllProducts());
        }

        await Promise.all(apiCalls);
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
              p.category.trim() === selectedCategory
          );

    const subCats = productsSource
      .map((p) =>
        typeof p?.subCategory === "string" ? p.subCategory.trim() : ""
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
                  style={{ marginTop: "5px" }}
                >
                  <span>All</span>
                </button>
              </li>

              {Array.isArray(categoryList) &&
                categoryList
                  .filter(
                    (c) =>
                      typeof c?.category === "string" &&
                      c.category.trim() !== "" &&
                      c.category.trim().toLowerCase() !== "all"
                  )
                  .map((cat) => {
                    const key = cat.category;

                    return (
                      <li key={key}>
                        <button
                          onClick={() => setSelectedCategory(key)}
                          className={selectedCategory === key ? "active" : ""}
                          style={{ marginTop: "5px" }}
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