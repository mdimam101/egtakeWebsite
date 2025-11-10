import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import SummaryApi from "../common";
import UserProductCart from "../components/UserProductCart";
import CategoryList from "../components/CategoryList";

const CategoryWiseProductListPage = () => {
  const [wishProductList, setWishProductList] = useState([]);
  const params = useParams();

  console.log("params.categoryName", params.categoryName);
  

  const fetchWishCategoryProduct = async () => {
    try {
      const response = await fetch(SummaryApi.category_wish_product.url, {
        method: SummaryApi.category_wish_product.method,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          category: params.categoryName,
        }),
      });
      const result = await response.json();

      if (result.success) {
        console.log("setWishProductList", result.data);
        
        setWishProductList(result.data);
      }
    } catch (error) {
      console.log("Error fetching category product:", error);
    }
  };

  useEffect(() => {
    fetchWishCategoryProduct();
  }, [params.categoryName]); // ✅ dependency দিলে on category change reload হবে

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
          width:"100%",
          marginTop:"7px"
        }}
      >
        <CategoryList />
      </div>
      <div className="product-grid" style={{marginTop:"40px"}}>
        {wishProductList.length > 0 ? (
          wishProductList.map((ele, idx) => (
            <UserProductCart productData={ele} key={idx} />
          ))
        ) : (
          <p style={{ padding: "1rem", textAlign: "center" }}>
            No products found in this category
          </p>
        )}
      </div>
    </>
  );
};

export default CategoryWiseProductListPage;
