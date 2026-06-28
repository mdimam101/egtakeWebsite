// src/helpers/addToCart.js
import SummaryApi from '../common';
import { toast } from "react-toastify";
import trackBasic from "./trackBasic";
import { pushGuestCartUnique } from "./guestCart";

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
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      credentials: 'include', // cookie-based Google/guest sessions থাকলে যাবে
      body: JSON.stringify({ productId,productName, size, color, image, price, selling })
    });

    const result = await response.json();

    if (result.success) {
      toast.success(result.message || "Added to cart");
      trackBasic("add_to_cart", { subCategory, count: 1 });
      return true;
    }

    if (t) {
      toast.error(result.message || "Failed to add to cart");
      return false;
    }
  } catch (error) {
    if (t) {
      console.error("Error adding to cart:", error);
      console.log("Error adding to cart:", error);
      toast.error("Something went wrong!");
      return false;
    }
  }

  const result = await pushGuestCartUnique({
    productId,
    productName,
    size,
    color,
    image,
    price,
    selling,
  });

  if (!result.added && result.reason === "duplicate") {
    toast.info("This product variant is already in your cart");
    return false;
  }

  toast.success("Added to cart");
  trackBasic("add_to_cart", { subCategory, count: 1, guest: true });
  return true;
};

export default addToCart;
