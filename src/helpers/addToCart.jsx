// src/helpers/addToCart.js
import SummaryApi from '../common';
import { toast } from "react-toastify";
import trackBasic from "./trackBasic";

// const buildAuthHeaders = () => {
//   const headers = { 'content-type': 'application/json' };
//   // localStorage-এ token থাকলে Authorization যোগ করো
//   const token = localStorage.getItem('token'); // বা sessionStorage
//   if (token) headers['Authorization'] = `Bearer ${token}`;
//   return headers;
// };

const addToCart = async ({ productId,productName, size, color, image, price, selling, subCategory }) => {
    const t = localStorage.getItem('authToken');
  try {
    const response = await fetch(SummaryApi.addToCartProduct.url, {
      method: SummaryApi.addToCartProduct.method, // 'POST'
      // headers: { "Content-Type": "application/json" },
      headers: t ? { Authorization: `Bearer ${t}` } : {},
      credentials: 'include', // cookie (httpOnly) থাকলে যাবে
      body: JSON.stringify({ productId,productName, size, color, image, price, selling })
    });

    const result = await response.json();

    if (result.success) {
      toast.success(result.message || "Added to cart");
      trackBasic("add_to_cart", { subCategory, count: 1 });
      return true;
    } else {
      toast.error(result.message || "Failed to add to cart");
      return false;
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
     console.log("Error adding to cart:", error);
    toast.error("Something went wrong!");
    return false;
  }
};

export default addToCart;
