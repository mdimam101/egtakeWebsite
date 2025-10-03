import { useEffect, useState } from "react";
import SummaryApi from "../common";
import "../styles/CategoryPageStyles.css";
import { Link } from "react-router";

const CategoryPage = () => {
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [allProducts, setAllProducts] = useState([]);

  const fetchCategoryProduct = async () => {
    try {
      const response = await fetch(SummaryApi.category_product.url);
      const dataResponse = await response.json();
      console.log("category_product", dataResponse);

      setCategoryList(dataResponse.data || []);
    } catch (err) {
      console.log("CategoryPage Error:", err.message);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await fetch(SummaryApi.get_product.url);
      const data = await response.json();

      if (data.success) {
        setAllProducts(data.data || []);
      } else {
        // toast.error(data.message);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchCategoryProduct();
    fetchAllProducts();
  }, []);




  // এবার প্রতিটি unique subCategory অনুযায়ী একটা করে product select করব
  let filteredCategories = [];
    // Right side data filtering (for now: all are same)
  if (selectedCategory === "All") {
    // প্রথমে subCategory গুলা বের করব
    let subCategories = allProducts
      .map((item) => item.subCategory)
      .filter((item) => item !== "");

    // তারপর unique বানাব
    let uniqueSubCategories = [...new Set(subCategories)];

    filteredCategories = uniqueSubCategories.map((subCat) => {
      return allProducts.find((product) => product.subCategory === subCat);
    });
  } else {
    // প্রথমে ওই category অনুযায়ী filter করি
    let filteredProducts = allProducts.filter(
      (item) => item.category === selectedCategory
    );

    // তারপর valid subCategory গুলা বের করি
    let subCategories = filteredProducts
      .map((item) => item.subCategory)
      .filter((item) => item && item !== ""); // empty subCategory বাদ দেই

    // তারপর unique বানাই
    let uniqueSubCategories = [...new Set(subCategories)];
    filteredCategories = uniqueSubCategories.map((subCat) => {
      return allProducts.find((product) => product.subCategory === subCat);
    });
  }

  console.log("filteredCategories", filteredCategories);
  console.log("categoryList", categoryList);

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
          {categoryList.map((cat) => (
            <li key={cat.category}>
              <button
                onClick={() => setSelectedCategory(cat.category)}
                className={selectedCategory === cat.category ? "active" : ""}
              >
                {cat.category}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Right: Showing each category as a "sub" card */}
      <div className="subcategory-grid">
        {filteredCategories.map((subcat, index) => (
          <Link
            to={`/sub-category-wish/${subcat.subCategory}`}
            className="subcategory-card"
            key={index}
          >
            {subcat.productImg[0] ? (
              <img
                src={subcat.productImg[0]}
                alt={subcat.subCategory}
                className="subcategory-icon"
              />
            ) : (
              <div className="subcategory-placeholder-icon">
                {subcat.subCategory[0]}
              </div>
            )}
            <p>{subcat.subCategory}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};
export default CategoryPage;
