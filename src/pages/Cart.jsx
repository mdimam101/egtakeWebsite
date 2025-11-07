// // pages/CartPage.js
// import React, { useEffect, useState } from "react";
// import SummaryApi from "../common";
// import CartItem from "../components/CartItem";
// import "../styles/CatrStyle.css";
// import { Link, useNavigate } from "react-router";

// const Cart = () => {
//   const [cartItems, setCartItems] = useState([]);
//   const [unselectedItems, setUnselectedItems] = useState([]);

//   // 1️⃣ নতুন state নিবো
// const [latestProducts, setLatestProducts] = useState([]);

// // 2️⃣ নতুন function যা latest product fetch করবে:
// const fetchLatestProducts = async () => {
//   try {
//     const res = await fetch(SummaryApi.get_product.url);
//     const data = await res.json();
//     if (data.success) {
//       setLatestProducts(data.data); 
//     }
//   } catch (err) {
//     console.error("Failed to fetch latest products:", err);
//   }
// };

// // 3️⃣ যখন CartPage লোড হবে তখন latestProducts লোড হবে
// useEffect(() => {
//   fetchLatestProducts();
// }, []);

//   const navigate = useNavigate();

//   // Load unselected items from localStorage FIRST
//   useEffect(() => {
//     const savedUnselected = JSON.parse(
//       localStorage.getItem("unselectedCartItems") || "[]"
//     );
//     setUnselectedItems(savedUnselected);
//   }, []);

//   // Save to localStorage when unselectedItems change
//   useEffect(() => {
//     localStorage.setItem(
//       "unselectedCartItems",
//       JSON.stringify(unselectedItems)
//     );
//   }, [unselectedItems]);

//   const fetchCartItems = async () => {
//     const t = localStorage.getItem('authToken');
//     try {
//       const res = await fetch(SummaryApi.getCartProduct.url, {
//         method: SummaryApi.getCartProduct.method,
//          headers: t ? { Authorization: `Bearer ${t}` } : {},
//         credentials: "include",
//       });
//       const data = await res.json();
//       console.log("🦌◆🦌◆", data.data);
      
//       if (data.success) {
//         setCartItems(data.data);
//       }
//     } catch (err) {
//       console.error("Failed to fetch cart items:", err);
//     }
//   };

//   // Derived selected items
//   const selectedItems = cartItems
//     .map((item) => item._id)
//     .filter((id) => !unselectedItems.includes(id));

//     console.log("selectedItems", selectedItems);
    

//   useEffect(() => {
//     fetchCartItems();
//   }, []);

// const totalAmount = cartItems
//   .filter((item) => {
//     const latestProduct = latestProducts.find(
//       (p) => p._id === item.productId._id
//     );
//     if (!latestProduct) return false;

//     const variant = latestProduct.variants.find(
//       (v) => v.color.toLowerCase() === item.color.toLowerCase()
//     );
//     if (!variant) return false;

//     const sizeObj = variant.sizes.find(
//       (s) => s.size.toLowerCase() === item.size.toLowerCase()
//     );
//     if (!sizeObj || sizeObj.stock === 0) return false;

//     return selectedItems.includes(item._id);
//   })
//   .reduce((acc, item) => {
//     const price = item?.productId?.selling || item?.productId?.price || 0;
//     return acc + price * item.Quantity;
//   }, 0);

// const handleCheckout = () => {
//   const selectedItemsDetails = cartItems.filter((item) => {
//     // Latest product খুঁজে বের করি
//     const latestProduct = latestProducts.find(
//       (p) => p._id === item.productId._id
//     );
//     if (!latestProduct) return false;

//     const variant = latestProduct.variants.find(
//       (v) => v.color.toLowerCase() === item.color.toLowerCase()
//     );
//     if (!variant) return false;

//     const sizeObj = variant.sizes.find(
//       (s) => s.size.toLowerCase() === item.size.toLowerCase()
//     );

//     // ✅ stock check করবো
//     if (!sizeObj || sizeObj.stock === 0) return false;

//     // ✅ সাথে সাথে checkbox selection confirm করবো
//     return selectedItems.includes(item._id);
//   });

//   console.log("selectedItems", selectedItems, selectedItemsDetails);

//   navigate("/checkout", { state: { selectedItemsDetails } });
// };

//   return (
//     <div>
//       <h2>Your Cart</h2>
//       <div className="contain-cart-page">
//         <div className="select-all-container">
//           <input
//             type="checkbox"
//             checked={unselectedItems.length === 0 && cartItems.length > 0}
//             onChange={(e) => {
//               if (e.target.checked) {
//                 // Select all → clear unselected list
//                 setUnselectedItems([]);
//                 localStorage.setItem("unselectedCartItems", JSON.stringify([]));
//               } else {
//                 // Unselect all → store all item IDs
//                 const allIds = cartItems.map((item) => item._id);
//                 setUnselectedItems(allIds);
//                 localStorage.setItem(
//                   "unselectedCartItems",
//                   JSON.stringify(allIds)
//                 );
//               }
//             }}
//             id="select-all-checkbox"
//           />
//           <label htmlFor="select-all-checkbox">Select All</label>
//         </div>

//         {cartItems.length === 0 ? (
//           <p>No items in cart.</p>
//         ) : (
//           cartItems.map((item) => (
//             <CartItem
//               key={item._id}
//               product={item}
//               refreshCart={fetchCartItems}
//               isSelected={!unselectedItems.includes(item._id)}
//                latestProducts={latestProducts} // 4️⃣ নতুন props পাঠাচ
//               toggleSelect={() => {
//                 if (unselectedItems.includes(item._id)) {
//                   const updated = unselectedItems.filter(
//                     (id) => id !== item._id
//                   );
//                   setUnselectedItems(updated);
//                   localStorage.setItem(
//                     "unselectedCartItems",
//                     JSON.stringify(updated)
//                   );
//                 } else {
//                   const updated = [...unselectedItems, item._id];
//                   setUnselectedItems(updated);
//                   localStorage.setItem(
//                     "unselectedCartItems",
//                     JSON.stringify(updated)
//                   );
//                 }
//               }}
//             />
//           ))
//         )}

//         {selectedItems.length > 0 && (
//           <div className="checkout-bar">
//             <span className="total-amount">৳{totalAmount}</span>
//             <button onClick={handleCheckout} className="checkout-cart-btn">
//               Checkout ({selectedItems.length})
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
// export default Cart;
// pages/CartPage.js
import React, { useEffect, useMemo, useState } from "react";
import SummaryApi from "../common";
import CartItem from "../components/CartItem";
import "../styles/CatrStyle.css";
import { useNavigate } from "react-router";

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
      ? item?.productId?.selling || item?.productId?.price
      : 0) || 0;

  return { inStock: true, price };
};

const Cart = () => {
  const navigate = useNavigate();

  // Server cart only
  const [cartItems, setCartItems] = useState([]);
  // Selection lives in memory only (no localStorage)
  const [unselectedItems, setUnselectedItems] = useState([]);
  // Live products for stock/price
  const [latestProducts, setLatestProducts] = useState([]);

  // ---- Fetch: latest products (for stock validation) ----
  const fetchLatestProducts = async () => {
    try {
      const res = await fetch(SummaryApi.get_product.url, { credentials: "include" });
      const data = await res.json();
      if (data?.success) setLatestProducts(data?.data || []);
    } catch (err) {
      console.error("Failed to fetch latest products:", err);
    }
  };

  // ---- Fetch: cart from server (no localStorage fallback) ----
  const fetchCartItems = async () => {
    try {
      const t = localStorage.getItem('authToken');
      const res = await fetch(SummaryApi.getCartProduct.url, {
        method: SummaryApi.getCartProduct.method,
         headers: t ? { Authorization: `Bearer ${t}` } : {},
        credentials: "include", // rely on cookies/session
      });
      const data = await res.json();
      if (data?.success) setCartItems(data?.data || []);
    } catch (err) {
      console.error("Failed to fetch cart items:", err);
    }
  };

  useEffect(() => {
    fetchLatestProducts();
    fetchCartItems();
  }, []);

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
    navigate("/checkout", { state: { selectedItemsDetails } });
  };

  return (
    <div>
      <h2>Your Cart</h2>

      <div className="contain-cart-page">
        <div className="select-all-container">
          <input
            id="select-all-checkbox"
            type="checkbox"
            checked={allSelected}
            onChange={(e) => toggleSelectAll(e.target.checked)}
          />
          <label htmlFor="select-all-checkbox">Select All</label>
        </div>

        {cartItems.length === 0 ? (
          <p>No items in cart.</p>
        ) : (
          cartItems.map((item) => (
            <CartItem
              key={`${item?._id}_${item?.addedAt || ""}`}
              product={item}
              refreshCart={fetchCartItems}
              latestProducts={latestProducts}
              isSelected={!unselectedItems.includes(item._id)}
              toggleSelect={() => toggleSelectOne(item._id)}
            />
          ))
        )}

        {canCheckout && (
          <div className="checkout-bar">
            <div className="checkout-price-summary">
              <span className="total-amount">৳{totalAmount}</span>
              {totalSaved > 0 && (
                <span className="saved-amount">Saved: ৳{totalSaved}</span>
              )}
            </div>

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
