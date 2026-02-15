import React from "react";
import "../styles/Modal.css";

const OrderDetailsModal = ({
  show,
  onClose,
  selectedOrder,
  renderItems,
  getStatusBadgeClass,
}) => {
  if (!show) return null;

  return (
    <div className="od-modal-overlay" onClick={onClose}>
      <div className="od-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="od-modal-header">
          <h3 className="od-modal-title">Order Details</h3>
          <button className="od-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* ✅ Only this body scrolls */}
        <div className="od-modal-body">
          {!selectedOrder ? (
            <div className="od-empty">No order selected</div>
          ) : (
            <div className="od-details">
              <div className="order-details-head">
                <h3>Order Details</h3>
                <span className={getStatusBadgeClass?.(selectedOrder.status)}>
                  {selectedOrder.status || "-"}
                </span>
              </div>

              <div className="order-details-grid">
                <div className="od-box">
                  <p className="od-label">Customer</p>
                  <p className="od-value">
                    {selectedOrder.shippingDetails?.name || "-"}
                  </p>
                </div>

                <div className="od-box">
                  <p className="od-label">Phone</p>
                  <p className="od-value">
                    {selectedOrder.shippingDetails?.phone || "-"}
                  </p>
                </div>

                <div className="od-box od-full">
                  <p className="od-label">Address</p>
                  <p className="od-value">
                    {selectedOrder.shippingDetails?.address || "-"},{" "}
                    {selectedOrder.shippingDetails?.district || "-"}
                  </p>
                </div>

                <div className="od-box">
                  <p className="od-label">Total Amount</p>
                  <p className="od-value">
                    ৳{selectedOrder.totalAmount ?? 0}
                  </p>
                </div>

                <div className="od-box">
                  <p className="od-label">Items</p>
                  <p className="od-value">{selectedOrder.items?.length || 0}</p>
                </div>
              </div>

              <h4 className="od-section-title">Products</h4>
              <ul className="od-list" style={{marginBottom:"150px"}}>
                {renderItems ? renderItems(selectedOrder.items || []) : null}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
