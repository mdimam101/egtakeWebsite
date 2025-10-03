import React, { useEffect, useState } from "react";
import SummaryApi from "../common";
import { Link } from "react-router"; // ✅ updated import
import "../styles/CategoryListStyle.css";

const CategoryList = () => {
  const [categoryProductData, setCategoryProductData] = useState([]);

  const fetchCategoryProduct = async () => {
    try {
      const response = await fetch(SummaryApi.category_product.url);
      const dataResponse = await response.json();
      setCategoryProductData(dataResponse.data || []);
    } catch (err) {
      console.log("CategoryList", err.message);
    }
  };

  useEffect(() => {
    fetchCategoryProduct();
  }, []);

  return (
    <div className="top-slide-category">
      {categoryProductData.map((product) => (
        <Link
          to={`/category-wish/${product?.category}`}
          key={product?.category}
          className="category-item"
        >
          {product?.category}
        </Link>
      ))}
    </div>
  );
};

export default CategoryList;
