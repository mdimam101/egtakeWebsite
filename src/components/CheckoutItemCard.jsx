import React from "react";

const CheckoutItemCard = ({ item }) => {
  const { productId = {}, color, size } = item || {};
  // 🔹 RN flow: quantity lowercase, with fallback to legacy Quantity
  const quantity = Number(item?.quantity ?? 1);

  // 🔹 RN flow: price from productId.selling first; fallback to productId.price or 0
  const unitPrice =
    Number(productId?.selling ?? (productId?.price ?? 0)) || 0;
  const totalPrice = unitPrice * quantity;

  // 🔹 RN flow: image from item.image; fallback to first product image
  let img =
    item?.image ||
    (Array.isArray(productId?.productImg) ? productId.productImg[0] : "");

  return (
    <div className="checkout-item-card">
      <img src={img} alt="product" className="checkout-item-image" />
      <div>
        <div><span>৳{totalPrice}</span></div>
        <div><span>Qty: {quantity}</span></div>
        <div>{(color || size) && (
          <span className="checkout-item-variant">
            {color ? `Color: ${color}` : ""} {size ? `Size: ${size}` : ""}
          </span>
        )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutItemCard;
