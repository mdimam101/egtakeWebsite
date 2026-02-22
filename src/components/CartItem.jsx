import { useContext, useMemo } from "react";
import { useNavigate } from "react-router";
import Context from "../context";
import "../styles/CartItem.css";
import increaseQuantity from "../helpers/increaseQuantity ";
import decreaseQuantity from "../helpers/decreaseQuantity";
import removeFromCart from "../helpers/removeFromCart";
import { toast } from "react-toastify";

// ছোট helper: http → https
const ensureHttps = (u = "") => u.replace("http://", "https://");

const CartItem = ({
  product,           // server cart item
  refreshCart,       // parent refresher
  isSelected,        // checkbox state (from parent)
  toggleSelect,      // checkbox toggle (from parent)
  latestProducts,    // live catalog for stock/price
}) => {
  const { fetchUserAddToCart } = useContext(Context);
  const navigate = useNavigate();

  // productId object বা string — দুইটাই সাপোর্ট
  const productData = typeof product?.productId === "object"
    ? product?.productId
    : { _id: product?.productId };

  // RN-এর মত: variant match by image (first image)
  const variantImage = product?.image || productData?.productImg?.[0] || "/no-image.png";
  const imgIdentity = (variantImage || "").replace("https://", "http://");

  // 🔍 Live stock finder (RN logic)
  const liveStock = useMemo(() => {
    const latest = latestProducts?.find(p => p?._id === productData?._id);
    if (!latest) return 0;

    const variant = (latest?.variants || []).find(v => (v?.images?.[0] || "") === imgIdentity);
    if (!variant) return 0;

    const sizeKey = (product?.size || "").trim().toLowerCase();

    if (sizeKey) {
      const sizeObj = (variant?.sizes || []).find(
        s => (s?.size || "").trim().toLowerCase() === sizeKey
      );
      return sizeObj?.stock || 0;
    }

    // size না থাকলে সব size যোগ
    return (variant?.sizes || []).reduce((sum, s) => sum + (s?.stock || 0), 0);
  }, [latestProducts, productData?._id, imgIdentity, product?.size]);

  // Qty (both quantity/Quantity)
  const qty = Number(product?.quantity ?? product?.Quantity ?? 1);

  // Unit price (sell || price)
  // const unitPrice =
  //   Number(productData?.selling ?? productData?.price ?? 0);

  const sellingPrice = product?.selling * qty;

  // 📈 Increase
  const handleIncrease = async () => {
    if (qty >= liveStock) {
      toast.info("Stock limit reached");
      return;
    }
    const res = await increaseQuantity(product?._id);
    if (res?.success) {
      await fetchUserAddToCart(true);
      refreshCart?.();
    } else {
      toast.error(res?.message || "Failed to update quantity");
    }
  };

  // 📉 Decrease
  const handleDecrease = async () => {
    const res = await decreaseQuantity(product?._id);
    if (res?.success) {
      await fetchUserAddToCart(true);
      refreshCart?.();
    } else {
      toast.error(res?.message || "Failed to update quantity");
    }
  };

  // 🗑 Remove
  const handleRemove = async () => {
    const res = await removeFromCart(product?._id);
    if (res?.success) {
      await fetchUserAddToCart(true);
      refreshCart?.();
    } else {
      toast.error(res?.message || "Failed to remove item");
    }
  };

  // 🖼️ Image click → ProductDetails
  const handleOpenDetails = () => {
    const pid = productData?._id || product?._id;
    if (!pid) return;
    navigate(`/product/${pid}`, {
      state: {
        id: pid,
        variantColor: product?.color || null,
        variantSize: product?.size || null,
        image: ensureHttps(variantImage),
      },
    });
  };

  // Color/Size text (optional like RN)
  let colorSize = "";
  if (product?.color && product?.size) colorSize = `Color: ${product.color} / Size: ${product.size}`;
  else if (product?.color) colorSize = `Color: ${product.color}`;
  else if (product?.size) colorSize = `Size: ${product.size}`;

  return (
    <div className={`cart-item ${liveStock === 0 ? "oos-fade" : ""}`}>
      <div className="left-block">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={toggleSelect}
          className="cart-item-checkbox"
          disabled={liveStock === 0} // Sold out হলে select করা যাবে না
        />

        <img
          src={ensureHttps(variantImage)}
          alt={productData?.productName || "Product"}
          className="cart-item-img"
          onClick={handleOpenDetails}
          role="button"
        />

        <div className="cart-product-info">
          <div className="top-row">
            <div className="cart-product-name" title={productData?.productName}>
              {product.productName || productData?.productName}
            </div>
            <button className="remove-btn" onClick={handleRemove} aria-label="Remove from cart">
              ✖
            </button>
          </div>

          {!!colorSize && <div className="variant">{colorSize}</div>}

          <div className="price-qty-row">
            <div className="price-section">
              <span className="current-price">৳{sellingPrice}</span>
              <span className="old-price">৳{product?.price}</span>
            </div>

            <div className="quantity-controls-container">
              <button className="qty-btn" onClick={handleDecrease} aria-label="Decrease quantity">-</button>
              <span className="qty-value">{qty}</span>
              <button
                className="qty-btn"
                onClick={handleIncrease}
                aria-label="Increase quantity"
                disabled={qty >= liveStock}
                title={qty >= liveStock ? "Stock limit reached" : ""}
              >
                +
              </button>
            </div>
          </div>

          <p className={`stock-status ${liveStock === 0 ? "out-stock" : "in-stock"}`}>
            {liveStock === 0 ? <span style={{ color: "red", fontWeight: "bold" }}>Sold out</span> : `Only ${liveStock} left`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
