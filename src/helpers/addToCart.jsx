// src/helpers/addToCart.js
import SummaryApi from '../common';
import { toast } from "react-toastify";
import trackBasic from "./trackBasic";
import { pushGuestCartUnique } from "./guestCart";
import { trackMetaCommerceEvent } from './metaPixel';

// const buildAuthHeaders = () => {
//   const headers = { 'content-type': 'application/json' };
//   // localStorage-এ token থাকলে Authorization যোগ করো
//   const token = localStorage.getItem('token'); // বা sessionStorage
//   if (token) headers['Authorization'] = `Bearer ${token}`;
//   return headers;
// };

const addToCart = async ({ productId,productName, size, color, image, price, selling, subCategory, showToast = true }) => {
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
      if (showToast) toast.success(result.message || "Added to cart");
      trackBasic("add_to_cart", { subCategory, count: 1 });
       trackMetaCommerceEvent("AddToCart", {
        content_ids: [productId],
        content_name: productName,
        value: Number(selling ?? price) || 0,
      });
      return true;
    }

    if (t) {
       if (showToast) toast.error(result.message || "Failed to add to cart");
      return false;
    }
  } catch  {
    if (t) {
      if (showToast) toast.error("Something went wrong!");
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
     if (showToast) toast.info("This product variant is already in your cart");
    return false;
  }

  if (showToast) toast.success("Added to cart");
  trackBasic("add_to_cart", { subCategory, count: 1, guest: true });
  trackMetaCommerceEvent("AddToCart", {
    content_ids: [productId],
    content_name: productName,
    value: Number(selling ?? price) || 0,
  });
  return true;
};

export default addToCart;
