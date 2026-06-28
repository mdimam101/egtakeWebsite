// pages/CartPage.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import SummaryApi from "../common";
import CartItem from "../components/CartItem";
import "../styles/CatrStyle.css";
import { useNavigate } from "react-router";
import {getGuestCart, savePendingCheckoutItems } from "../helpers/guestCart";
import { useSelector } from "react-redux";

// ---- Helper: find live stock/price using image (+ optional size) ----
const findStockFromLatest = (item, latestProducts) => {
  // Accept both object and id string
  const pid = typeof item?.productId === "object" ? item.productId?._id : item?.productId;
  if (!pid) return { inStock: false };

  const latest = latestProducts.find((p) => p._id === pid);
  if (!latest) return { inStock: false };

  // 👉 We identify variant by the image URL (first image match), just like RN
  const img = (item?.image || "").replace("https://", "http://");
  const variant = latest.variants?.find((v) => (v?.images?.[0] || "") === img);
  if (!variant) return { inStock: false };

  // If size provided, check that size’s stock; else sum all sizes
  const sizeKey = (item?.size || "").trim().toLowerCase();
  if (sizeKey) {
    const sizeObj = (variant.sizes || []).find(
      (s) => (s?.size || "").trim().toLowerCase() === sizeKey
    );
    if (!sizeObj || (sizeObj.stock || 0) === 0) return { inStock: false };
  } else {
    const totalStock = (variant.sizes || []).reduce((sum, s) => sum + (s?.stock || 0), 0);
    if (totalStock === 0) return { inStock: false };
  }

  const price =
    (typeof item?.productId === "object"
      ? variant?.SpcSelling || item?.productId?.selling
      : item?.productId?.selling) || 0;

      
  return { inStock: true, price };
};

const Cart = () => {
  const navigate = useNavigate();

   const currentUser = useSelector((state) => state?.userState?.user);

  // Server cart only
  const [cartItems, setCartItems] = useState([]);
  // Selection lives in memory only (no localStorage)
  const [unselectedItems, setUnselectedItems] = useState([]);
  // Live products for stock/price
  const [latestProducts, setLatestProducts] = useState([]);

    // Loading state (new)
  const [isLoading, setIsLoading] = useState(true);

  const clientKey = import.meta.env.VITE_PUBLIC_CLIENT_KEY;

  if (!clientKey) {
    console.error("VITE_PUBLIC_CLIENT_KEY is missing");
  }

  // ---- Fetch: latest products (for stock validation) ----
   const fetchLatestProducts = useCallback(async () => {
    try {
      const res = await fetch(SummaryApi.get_product.url, {
        credentials: "include",
        headers: {
          "x-client-key": clientKey,
        },
      });
      const data = await res.json();
      if (data?.success) setLatestProducts(data?.data || []);
    } catch (err) {
      console.error("Failed to fetch latest products:", err);
    }
  }, []);

  const isLoggedIn = Boolean(localStorage.getItem("authToken") || currentUser?._id || currentUser?.email);

  // ---- Fetch: cart from server, or localStorage for guest users ----
  const fetchCartItems = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);

    const t = localStorage.getItem("authToken");
    const hasSession = Boolean(t || currentUser?._id || currentUser?.email);
    if (!hasSession) {
      setCartItems(getGuestCart());
      if (!silent) setIsLoading(false);
      return;
    }


    try {
      const t = localStorage.getItem('authToken');
      const res = await fetch(SummaryApi.getCartProduct.url, {
        method: SummaryApi.getCartProduct.method,
        headers: { Authorization: `Bearer ${t}` },
        credentials: "include", // rely on cookies/session
      });
      const data = await res.json();
      if (data?.success) setCartItems(data?.data || []);
      else setCartItems([]); // NEW (safe fallback)
    } catch (err) {
      console.error("Failed to fetch cart items:", err);
      setCartItems([]); // NEW (safe fallback)
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [currentUser?._id, currentUser?.email]);

  useEffect(() => {
    fetchLatestProducts();
    fetchCartItems();
  }, [fetchCartItems, fetchLatestProducts]);

  // Selected ids are those NOT in unselected
  const selectedItems = useMemo(
    () => cartItems.map((it) => it?._id).filter((id) => !unselectedItems.includes(id)),
    [cartItems, unselectedItems]
  );

  // ---- Totals (valid + selected only) ----
  const totalAmount = useMemo(() => {
    return cartItems
      .filter((item) => {
        const res = findStockFromLatest(item, latestProducts);
        return res.inStock && selectedItems.includes(item._id);
      })
      .reduce((acc, item) => {
        const res = findStockFromLatest(item, latestProducts);
        const qty = item?.quantity ?? item?.Quantity ?? 1;
        return acc + (res.price || 0) * qty;
      }, 0);
  }, [cartItems, latestProducts, selectedItems]);

  const totalSaved = useMemo(() => {
    return cartItems
      .filter((item) => {
        const res = findStockFromLatest(item, latestProducts);
        return res.inStock && selectedItems.includes(item._id);
      })
      .reduce((acc, item) => {
        const original =
          (typeof item?.productId === "object" ? item?.productId?.price : 0) || 0;
        const sell =
          (typeof item?.productId === "object" ? item?.productId?.selling : 0) || 0;
        const qty = item?.quantity ?? item?.Quantity ?? 1;
        return acc + Math.max(original - sell, 0) * qty;
      }, 0);
  }, [cartItems, latestProducts, selectedItems]);

  const allSelected = cartItems.length > 0 && selectedItems.length === cartItems.length;
  const canCheckout = selectedItems.length > 0;

  // ---- Selection toggles (memory only) ----
  const toggleSelectOne = (id) => {
    setUnselectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      // select all -> clear unselected
      setUnselectedItems([]);
    } else {
      // unselect all -> mark all ids as unselected
      setUnselectedItems(cartItems.map((it) => it._id));
    }
  };

  // ---- Checkout ----
  const handleCheckout = () => {
    const selectedItemsDetails = cartItems.filter((item) => {
      const res = findStockFromLatest(item, latestProducts);
      return res.inStock && selectedItems.includes(item._id);
    });

   if (!isLoggedIn) {
      savePendingCheckoutItems(selectedItemsDetails);
      navigate("/sign-up", {
        state: {
          from: "/checkout",
          checkoutState: { selectedItemsDetails },
        },
      });
      return;
    }
    navigate("/checkout", { state: { selectedItemsDetails } });
  };

 return (
  <div className="cart-page">
    <div className="cart-page-header">
      <h2>Your Cart</h2>
      <span className="cart-summary-chip">{cartItems.length} item(s)</span>
    </div>

    <div className="contain-cart-page">
      {!isLoading && cartItems.length > 0 && <div className="select-all-container">
        <input
          id="select-all-checkbox"
          type="checkbox"
          checked={allSelected}
          onChange={(e) => toggleSelectAll(e.target.checked)}
        />
        <label htmlFor="select-all-checkbox">Select All</label>
      </div>}
            {isLoading ? (
        <div className="cart-loading-wrap">
          <div className="cart-spinner" />
          <div className="cart-loading-text">Loading your cart...</div>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-illustration">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Browse categories and add items to your cart.</p>
          <button onClick={() => navigate('/category')} className="btn-primary">
            Shop now
          </button>
        </div>
      ) : (
        <div className="cart-list">
          {cartItems.map((item) => (
            <CartItem
              key={`${item?._id}_${item?.addedAt || ""}`}
              product={item}
              refreshCart={() => fetchCartItems({ silent: true })}
              latestProducts={latestProducts}
              isSelected={!unselectedItems.includes(item._id)}
              toggleSelect={() => toggleSelectOne(item._id)}
            />
          ))}
        </div>
      )}

      {!isLoading && canCheckout && (
        <div className="checkout-bar">
          <div className="checkout-price-summary">
            <span className="total-amount">৳{totalAmount}</span>
            {totalSaved > 0 && (
              <span className="saved-amount">You save ৳{totalSaved}</span>
            )}
          </div>

          <button onClick={handleCheckout} className="checkout-cart-btn">
            Checkout ({selectedItems.length})
          </button>
        </div>
      )}

      {/* bottom spacer so content never hides behind fixed bars */}
      <div className="cart-bottom-spacer" />
    </div>
  </div>
);
};

export default Cart;
