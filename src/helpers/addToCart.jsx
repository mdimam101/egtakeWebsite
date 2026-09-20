// src/helpers/addToCart.js
import SummaryApi from '../common';
import { toast } from "react-toastify";
import trackBasic from "./trackBasic";
import { hasGuestCartItem, pushGuestCartUnique } from "./guestCart";
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

  const cartItem = {
    productId,
    productName,
    size,
    color,
    image,
    price,
    selling,
  };

  // Guest cart is browser-owned. Writing it immediately makes the footer
  // count update on the product page without waiting for a cart-page visit or
  // a refresh, and avoids an unauthenticated server cart taking precedence.
  if (!t) {
    const guestResult = await pushGuestCartUnique(cartItem);

    if (!guestResult.added && guestResult.reason === "duplicate") {
      if (showToast) toast.info("This product variant is already in your cart");
      return false;
    }

    if (showToast) toast.success("Added to cart");
    trackBasic("add_to_cart", { subCategory, count: 1, guest: true });
    trackMetaCommerceEvent("AddToCart", {
      content_type: "product",
      content_ids: [String(productId)],
      content_name: productName,
      value: Number(selling ?? price) || 0,
      contents: [
        {
          id: String(productId),
          quantity: 1,
          item_price: Number(selling ?? price) || 0,
        },
      ],
    });
    return true;
  }

  // Signing in does not discard the browser cart. Prevent the same variant
  // from being added to the server cart while it is already stored locally.
  if (hasGuestCartItem(cartItem)) {
    if (showToast) toast.info("This product variant is already in your cart");
    return false;
  }


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
        content_type: "product",
        content_ids: [String(productId)],
        content_name: productName,
        value: Number(selling ?? price) || 0,
        contents: [
          {
            id: String(productId),
            quantity: 1,
            item_price: Number(selling ?? price) || 0,
          },
        ],
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

  return false;
};

export default addToCart;
