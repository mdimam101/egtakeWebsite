import { useContext } from "react";
import Context from "../context";
import "../styles/CartItem.css";
import increaseQuantity from "../helpers/increaseQuantity ";
import decreaseQuantity from "../helpers/decreaseQuantity";
import removeFromCart from "../helpers/removeFromCart";
import { toast } from "react-toastify";

const CartItem = ({
  product,
  refreshCart,
  isSelected,
  toggleSelect,
  latestProducts,
}) => {
  const { fetchUserAddToCart } = useContext(Context);
  const productData = product?.productId;

  // Find matching variant by color
  const variant = productData?.variants?.find(
    (v) => v.color?.toLowerCase() === product.color?.toLowerCase()
  );

  const variantImage =
    variant?.images?.[0] || productData?.productImg?.[0] || "/no-image.png";

  const handleIncrease = async () => {
    // Step 1: Find variant by color
    const variant = productData?.variants?.find(
      (v) => v.color?.toLowerCase() === product.color?.toLowerCase()
    );

    if (!variant) {
      toast.error("Variant not found!");
      return;
    }

    // Step 2: Find size from variant
    const sizeObj = variant.sizes?.find(
      (s) => s.size?.toLowerCase() === product.size?.toLowerCase()
    );

    if (!sizeObj) {
      toast.error("Size not found!");
      return;
    }

    const availableStock = sizeObj.stock;

    // Step 3: Compare quantity vs stock
    if (product.Quantity >= availableStock) {
      toast.error("Stock limit reached!");
      return;
    }
    const result = await increaseQuantity(product._id);
    if (result?.success) {
      fetchUserAddToCart();
      refreshCart();
    }
  };

  const handleDecrease = async () => {
    const result = await decreaseQuantity(product._id);
    if (result?.success) {
      fetchUserAddToCart();
      refreshCart();
    }
  };

  const handleRemove = async () => {
    const result = await removeFromCart(product._id);
    if (result?.success) {
      fetchUserAddToCart();
      refreshCart();
    }
  };

  const sellingPrice =
    productData?.selling * product.Quantity || productData?.price || 0;

  console.log("product-cart-item", product);

  // 5️⃣ Latest stock calculate
  const latestProduct = latestProducts?.find(
    (p) => p._id === product.productId._id
  );

  let availableStock = null;

  if (latestProduct) {
    const latestVariant = latestProduct.variants?.find(
      (v) => v.color?.toLowerCase() === product.color?.toLowerCase()
    );

    if (latestVariant) {
      const latestSizeObj = latestVariant.sizes?.find(
        (s) => s.size?.toLowerCase() === product.size?.toLowerCase()
      );

      if (latestSizeObj) {
        availableStock = latestSizeObj.stock;
      }
    }
  }

  return (
    <div className="cart-item">
      <div className="left-block">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={toggleSelect}
          className="cart-item-checkbox"
          disabled={availableStock === 0} // ✅ Stock out হলে checkbox disable হবে
        />

        <img
          src={variantImage}
          alt={productData?.productName}
          className="cart-item-img"
        />

        <div className="cart-product-info">
          <div className="top-row">
            <div className="product-name">{productData?.productName}</div>
            <button className="remove-btn" onClick={handleRemove}>
              ✖
            </button>
          </div>

          <div className="variant">
            Color: {product.color} / Size: {product.size}
          </div>

          <div className="price-qty-row">
            <div className="price-section">
              <span className="current-price">৳{sellingPrice}</span>
              <span className="old-price">৳{productData?.price}</span>
            </div>

            <div className="quantity-controls-container">
              <button className="qty-btn" onClick={handleDecrease}>
                -
              </button>
              <span className="qty-value">{product.Quantity}</span>
              <button className="qty-btn" onClick={handleIncrease}>
                +
              </button>
            </div>
          </div>
          <p
            className={`stock-status ${
              availableStock === 0 ? "out-stock" : "in-stock"
            }`}
          >
            {availableStock === 0 ? (
              <span style={{ color: "red", fontWeight:"bold" }}>Stock of Out</span>
            ) : (
              `In Stock: ${availableStock}`
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
