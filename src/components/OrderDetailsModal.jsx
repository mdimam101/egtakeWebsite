import React from "react";
import "../styles/Modal.css";

const MEMBERSHIP_ROLE_OPTIONS = ["GENERAL", "SUBPENDING", "PREMIUM"];

const DEFAULT_MEMBERSHIP_ROLE_LABELS = {
  GENERAL: "General Member",
  SUBPENDING: "Subscription Pending",
  PREMIUM: "Premium Member",
  ADMIN: "Admin",
  GUEST: "Guest",
};

const formatMembershipDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const OrderDetailsModal = ({
  show,
  onClose,
  selectedOrder,
  renderItems,
  getStatusBadgeClass,
  getOrderUser,
  getOrderUserId,
  onMembershipUpdate,
  updatingMembershipUserId,
  loadingMembershipUserId,
  membershipRoleLabels = DEFAULT_MEMBERSHIP_ROLE_LABELS,
}) => {
  if (!show) return null;

  const orderUser = getOrderUser?.(selectedOrder) || null;
  const orderUserId = getOrderUserId?.(selectedOrder) || null;
  const currentRole = orderUser?.role || "GENERAL";
  const isGuestOrder = !orderUserId;
  const isAdminUser = currentRole === "ADMIN";
  const isUpdatingMembership =
    Boolean(orderUserId) &&
    String(updatingMembershipUserId) === String(orderUserId);
  const isLoadingMembership =
    Boolean(orderUserId) &&
    String(loadingMembershipUserId) === String(orderUserId);
  const membershipLabel = membershipRoleLabels[currentRole] || currentRole;

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
 <h4 className="od-section-title">Membership</h4>
              <div className="od-membership-card">
                {isGuestOrder ? (
                  <div className="od-membership-empty">
                    Guest order — membership cannot be changed.
                  </div>
                ) : (
                  <>
                    <div className="od-membership-info">
                      <div>
                        <p className="od-label">Registered User</p>
                        <p className="od-value">
                          {orderUser?.name ||
                            selectedOrder.shippingDetails?.name ||
                            "-"}
                        </p>
                        <p className="od-membership-contact">
                          {orderUser?.email || orderUser?.phone || ""}
                        </p>
                      </div>

                      <span
                        className={`membership-badge membership-${String(
                          currentRole,
                        ).toLowerCase()}`}
                      >
                        {membershipLabel}
                      </span>
                    </div>

                    {isAdminUser ? (
                      <p className="od-membership-warning">
                        Admin membership role cannot be changed.
                      </p>
                    ) : (
                      <div className="od-membership-control">
                        <label
                          className="od-label"
                          htmlFor={`membership-role-${orderUserId}`}
                        >
                          Change membership role
                        </label>

                        <select
                          id={`membership-role-${orderUserId}`}
                          className="order-filter membership-select"
                          value={
                            MEMBERSHIP_ROLE_OPTIONS.includes(currentRole)
                              ? currentRole
                              : "GENERAL"
                          }
                          disabled={isUpdatingMembership || isLoadingMembership}
                          onChange={(event) =>
                            onMembershipUpdate?.(
                              selectedOrder,
                              event.target.value,
                            )
                          }
                        >
                          <option value="GENERAL">General Member</option>
                          <option value="SUBPENDING">
                            Subscription Pending
                          </option>
                          <option value="PREMIUM">Premium Member</option>
                        </select>

                        {isUpdatingMembership && (
                          <span className="membership-updating">
                            Updating membership...
                          </span>
                        )}

                        {isLoadingMembership && !isUpdatingMembership && (
                          <span className="membership-updating">
                            Loading latest membership...
                          </span>
                        )}
                      </div>
                    )}

                    {currentRole === "PREMIUM" && (
                      <div className="od-membership-dates">
                        <div>
                          <p className="od-label">Start Date</p>
                          <p className="od-value">
                            {formatMembershipDate(
                              orderUser?.subscriptionStartDate,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="od-label">End Date</p>
                          <p className="od-value">
                            {formatMembershipDate(
                              orderUser?.subscriptionEndDate,
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <h4 className="od-section-title">Products</h4>
              <ul className="od-list" style={{marginBottom:"150px"}}>
                {renderItems
                  ? renderItems(selectedOrder._id, selectedOrder.items || [])
                  : null}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
