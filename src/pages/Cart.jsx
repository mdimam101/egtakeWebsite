// pages/CartPage.js
import React, { useEffect, useState } from "react";
import SummaryApi from "../common";
import CartItem from "../components/CartItem";
import "../styles/CatrStyle.css";
import { Link, useNavigate } from "react-router";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [unselectedItems, setUnselectedItems] = useState([]);

  // 1️⃣ নতুন state নিবো
const [latestProducts, setLatestProducts] = useState([]);

// 2️⃣ নতুন function যা latest product fetch করবে:
const fetchLatestProducts = async () => {
  try {
    const res = await fetch(SummaryApi.get_product.url);
    const data = await res.json();
    if (data.success) {
      setLatestProducts(data.data); 
    }
  } catch (err) {
    console.error("Failed to fetch latest products:", err);
  }
};

// 3️⃣ যখন CartPage লোড হবে তখন latestProducts লোড হবে
useEffect(() => {
  fetchLatestProducts();
}, []);

  const navigate = useNavigate();

  // Load unselected items from localStorage FIRST
  useEffect(() => {
    const savedUnselected = JSON.parse(
      localStorage.getItem("unselectedCartItems") || "[]"
    );
    setUnselectedItems(savedUnselected);
  }, []);

  // Save to localStorage when unselectedItems change
  useEffect(() => {
    localStorage.setItem(
      "unselectedCartItems",
      JSON.stringify(unselectedItems)
    );
  }, [unselectedItems]);

  const fetchCartItems = async () => {
    try {
      const res = await fetch(SummaryApi.getCartProduct.url, {
        method: SummaryApi.getCartProduct.method,
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setCartItems(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch cart items:", err);
    }
  };

  // Derived selected items
  const selectedItems = cartItems
    .map((item) => item._id)
    .filter((id) => !unselectedItems.includes(id));

    console.log("selectedItems", selectedItems);
    

  useEffect(() => {
    fetchCartItems();
  }, []);

const totalAmount = cartItems
  .filter((item) => {
    const latestProduct = latestProducts.find(
      (p) => p._id === item.productId._id
    );
    if (!latestProduct) return false;

    const variant = latestProduct.variants.find(
      (v) => v.color.toLowerCase() === item.color.toLowerCase()
    );
    if (!variant) return false;

    const sizeObj = variant.sizes.find(
      (s) => s.size.toLowerCase() === item.size.toLowerCase()
    );
    if (!sizeObj || sizeObj.stock === 0) return false;

    return selectedItems.includes(item._id);
  })
  .reduce((acc, item) => {
    const price = item?.productId?.selling || item?.productId?.price || 0;
    return acc + price * item.Quantity;
  }, 0);

const handleCheckout = () => {
  const selectedItemsDetails = cartItems.filter((item) => {
    // Latest product খুঁজে বের করি
    const latestProduct = latestProducts.find(
      (p) => p._id === item.productId._id
    );
    if (!latestProduct) return false;

    const variant = latestProduct.variants.find(
      (v) => v.color.toLowerCase() === item.color.toLowerCase()
    );
    if (!variant) return false;

    const sizeObj = variant.sizes.find(
      (s) => s.size.toLowerCase() === item.size.toLowerCase()
    );

    // ✅ stock check করবো
    if (!sizeObj || sizeObj.stock === 0) return false;

    // ✅ সাথে সাথে checkbox selection confirm করবো
    return selectedItems.includes(item._id);
  });

  console.log("selectedItems", selectedItems, selectedItemsDetails);

  navigate("/checkout", { state: { selectedItemsDetails } });
};

  return (
    <div>
      <h2>Your Cart</h2>
      <div className="contain-cart-page">
        <div className="select-all-container">
          <input
            type="checkbox"
            checked={unselectedItems.length === 0 && cartItems.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                // Select all → clear unselected list
                setUnselectedItems([]);
                localStorage.setItem("unselectedCartItems", JSON.stringify([]));
              } else {
                // Unselect all → store all item IDs
                const allIds = cartItems.map((item) => item._id);
                setUnselectedItems(allIds);
                localStorage.setItem(
                  "unselectedCartItems",
                  JSON.stringify(allIds)
                );
              }
            }}
            id="select-all-checkbox"
          />
          <label htmlFor="select-all-checkbox">Select All</label>
        </div>

        {cartItems.length === 0 ? (
          <p>No items in cart.</p>
        ) : (
          cartItems.map((item) => (
            <CartItem
              key={item._id}
              product={item}
              refreshCart={fetchCartItems}
              isSelected={!unselectedItems.includes(item._id)}
               latestProducts={latestProducts} // 4️⃣ নতুন props পাঠাচ
              toggleSelect={() => {
                if (unselectedItems.includes(item._id)) {
                  const updated = unselectedItems.filter(
                    (id) => id !== item._id
                  );
                  setUnselectedItems(updated);
                  localStorage.setItem(
                    "unselectedCartItems",
                    JSON.stringify(updated)
                  );
                } else {
                  const updated = [...unselectedItems, item._id];
                  setUnselectedItems(updated);
                  localStorage.setItem(
                    "unselectedCartItems",
                    JSON.stringify(updated)
                  );
                }
              }}
            />
          ))
        )}

        {selectedItems.length > 0 && (
          <div className="checkout-bar">
            <span className="total-amount">৳{totalAmount}</span>
            <button onClick={handleCheckout} className="checkout-cart-btn">
              Checkout ({selectedItems.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default Cart;
