import React from "react";

const CheckoutItemCard = ({ item }) => {
  const { productId, Quantity } = item;
  const unitPrice = productId?.selling || productId?.price || 0;
  const totalPrice = unitPrice * Quantity;
  const img = productId?.productImg?.[0];

  return (
    <div className="checkout-item-card">
      <img src={img} alt="product" className="checkout-item-image" />
      <div className="checkout-item-details">
        <span>৳{totalPrice}</span>
        <span>Qty: {Quantity}</span>
      </div>
    </div>
  );
};

export default CheckoutItemCard;