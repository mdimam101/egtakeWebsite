import { useEffect, useMemo, useState } from "react";
import SummaryApi from "../common";
import "../styles/CategoryPageStyles.css";
import { Link } from "react-router"; // ✅ make sure this package is installed

// Helper: get a safe thumbnail from new product structure
const getProductThumb = (product) => {
  if (!product) return "";
  // 1) old field (if ever present)
  if (Array.isArray(product.productImg) && product.productImg.length > 0) {
    return product.productImg[0];
  }
  // 2) new structure: first non-empty image from variants
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
  const [categoryList, setCategoryList] = useState([]); // expect [{category: "Home"}, ...]
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [allProducts, setAllProducts] = useState([]);

  const fetchCategoryProduct = async () => {
    try {
      const response = await fetch(SummaryApi.category_product.url);
      const dataResponse = await response.json();
      // expecting shape: { data: [{ category: "Men" }, ...] }
      setCategoryList(Array.isArray(dataResponse?.data) ? dataResponse.data : []);
    } catch (err) {
      console.log("CategoryPage Error:", err?.message);
      setCategoryList([]);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await fetch(SummaryApi.get_product.url);
      const data = await response.json();
      setAllProducts(data?.success && Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.log("Products fetch error:", err);
      setAllProducts([]);
    }
  };

  useEffect(() => {
    fetchCategoryProduct();
    fetchAllProducts();
  }, []);

  // Build filtered representative list (one product per unique subCategory)
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

    // collect valid, non-empty subCategories
    const subCats = productsSource
      .map((p) => (typeof p?.subCategory === "string" ? p.subCategory.trim() : ""))
      .filter((s) => s !== "");

    const uniqueSubCats = Array.from(new Set(subCats));

    // For each subCategory, pick the first product as representative
    const reps = uniqueSubCats
      .map((sc) => productsSource.find((p) => p?.subCategory?.trim() === sc))
      .filter(Boolean); // remove undefined

    return reps;
  }, [allProducts, selectedCategory]);

  return (
    <div className="category-page-container">
      {/* Left: Main Categories */}
      <aside className="category-sidebar">
        <h3>Main Categories</h3>
        <ul>
          <li>
            <button
              onClick={() => setSelectedCategory("All")}
              className={selectedCategory === "All" ? "active" : ""}
            >
              All
            </button>
          </li>

          {Array.isArray(categoryList) &&
            categoryList
              .filter((c) => typeof c?.category === "string" && c.category.trim() !== "")
              .map((cat) => {
                const key = cat.category;
                return (
                  <li key={key}>
                    <button
                      onClick={() => setSelectedCategory(key)}
                      className={selectedCategory === key ? "active" : ""}
                    >
                      {key}
                    </button>
                  </li>
                );
              })}
        </ul>
      </aside>

      {/* Right: SubCategory cards */}
      <div className="subcategory-grid">
        {filteredCategories.length === 0 && (
          <div className="subcategory-empty">No items to show.</div>
        )}

        {filteredCategories.map((item, idx) => {
          const subCatName = safeText(item?.subCategory, "Unknown");
          const thumb = getProductThumb(item);
          return (
            <Link
              to={`/sub-category-wish/${encodeURIComponent(subCatName)}`}
              className="subcategory-card"
              key={`${subCatName}-${idx}`}
            >
              {thumb ? (
                <img src={thumb} alt={subCatName} className="subcategory-icon" />
              ) : (
                <div className="subcategory-placeholder-icon">
                  {subCatName.charAt(0)}
                </div>
              )}
              <p>{subCatName}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryPage;
