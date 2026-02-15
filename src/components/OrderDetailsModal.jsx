import React from "react";
import "../styles/Modal.css";

const OrderDetailsModal = ({ show, onClose, children }) => {
  if (!show) return null;

  return (
    <div className="od-modal-overlay" onClick={onClose}>
      <div className="od-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="od-modal-header">
          <h3 className="od-modal-title">Order Details</h3>
          <button className="od-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* ✅ Only this part will scroll when items are many */}
        <div className="od-modal-body">{children}</div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
