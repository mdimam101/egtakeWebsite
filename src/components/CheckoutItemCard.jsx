import React from "react";
import "../styles/CheckoutItem.css"; // যদি আলাদা css file এ রাখো, না হলে এই লাইন remove

const ensureHttps = (url = "") => {
  if (!url) return "";
  // তোমার আগের logic এর মতো http/https mismatch fix (optional)
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
};

const CheckoutItemCard = ({ item }) => {
  const { productId = {}, color, size } = item || {};

  // ✅ RN flow: quantity lowercase (fallback)
  const quantity = Number(item?.quantity ?? item?.Quantity ?? 1);

  // ✅ RN flow: unit price from item.selling first; fallback to productId.selling; fallback to 0
  const unitPrice = Number(item?.selling ?? productId?.selling ?? 0);

  const totalPrice = unitPrice * quantity;

  // ✅ RN flow: image from item.image; fallback to first product image
  const img =
    item?.image ||
    (Array.isArray(productId?.productImg) ? productId?.productImg?.[0] : "") ||
    "";

  // ✅ nice label like RN
  const variantText = [color, size].filter(Boolean).join(" / ");

  return (
    <div className="co-item">
      <div className="co-img-wrap">
        <img
          src={ensureHttps(img)}
          alt={item?.productName || productId?.productName || "product"}
          className="co-img"
          loading="lazy"
        />
      </div>

      <div className="co-info">
        <div className="co-top">
          <div className="co-price">৳{totalPrice}</div>
          <div className="co-qty">Qty: {quantity}</div>
        </div>

        {variantText ? (
          <div className="co-variant">{variantText}</div>
        ) : (
          <div className="co-variant co-muted">Variant: —</div>
        )}
      </div>
    </div>
  );
};

export default CheckoutItemCard;