import React, { useEffect, useMemo, useState } from "react";
import SummaryApi from "../common";
import "../styles/OrderList.css";
import OrderDetailsModal from "../components/OrderDetailsModal";

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // optional: search + filter
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(SummaryApi.get_all_orders.url);
        const data = await res.json();

        if (data?.success) {
          setOrders(data.data || []);
        } else {
          setError(data?.message || "Failed to fetch orders");
        }
      } catch (err) {
        console.log(err);

        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (orders || []).filter((o) => {
      const name = (o?.shippingDetails?.name || "").toLowerCase();
      const phone = (o?.shippingDetails?.phone || "").toLowerCase();
      const district = (o?.shippingDetails?.district || "").toLowerCase();
      const status = (o?.status || "").toLowerCase();

      const matchQuery =
        !q ||
        name.includes(q) ||
        phone.includes(q) ||
        district.includes(q) ||
        (o?._id || "").toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "all" || status === statusFilter.toLowerCase();

      return matchQuery && matchStatus;
    });
  }, [orders, query, statusFilter]);

  const renderItems = (items = []) => {
    return items.map((item, idx) => (
      <li key={idx} className="od-item">
        <img className="od-img" src={item.image} alt="product" />
        <div className="od-info">
          <p className="od-title">{item.productName}</p>
          <p className="od-meta">
            <span>Qty: {item.quantity}</span>
            <span>Size: {item.size || "-"}</span>
            <span>Color: {item.color || "-"}</span>
          </p>
          <p className="od-id">Product ID: {item.productId}</p>
        </div>
      </li>
    ));
  };

  const getStatusBadgeClass = (status = "") => {
    const s = String(status).toLowerCase();
    if (s.includes("pending")) return "badge badge-pending";
    if (s.includes("shipping") || s.includes("shipped"))
      return "badge badge-shipping";
    if (s.includes("delivered")) return "badge badge-delivered";
    if (s.includes("cancel")) return "badge badge-cancelled";
    return "badge";
  };

  return (
    <div className="order-list-container">
      <div className="order-header">
        <h2>Order List</h2>

        <div className="order-tools">
          <div className="search-wrap">
            <input
              className="order-search"
              type="text"
              placeholder="Search by name / phone / district / order id"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <select
            className="order-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="shipping">Shipping</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading && <p className="muted">Loading orders...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && filteredOrders.length === 0 && (
        <div className="empty-box">
          <p>No orders found.</p>
        </div>
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <>
          {/* ✅ Desktop Table */}
          <div className="table-responsive desktop-only">
            <table className="order-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Customer</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>৳ Amount</th>
                  <th>Items</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order, i) => (
                  <tr key={order._id}>
                    <td>{i + 1}</td>
                    <td>
                      <div className="cell-main">
                        <div className="cell-title">
                          {order.shippingDetails?.name || "N/A"}
                        </div>
                        <div className="cell-sub">
                          {order.shippingDetails?.phone || ""}
                        </div>
                      </div>
                    </td>
                    <td>{order.shippingDetails?.district || "-"}</td>
                    <td>
                      <span className={getStatusBadgeClass(order.status)}>
                        {order.status || "-"}
                      </span>
                    </td>
                    <td>৳{order.totalAmount}</td>
                    <td>{order.items?.length || 0}</td>
                    <td>
                      <button
                        className="view-button"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ✅ Mobile Cards */}
          <div className="mobile-only order-cards">
            {filteredOrders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-card-top">
                  <div>
                    <p className="order-card-name">
                      {order.shippingDetails?.name || "N/A"}
                    </p>
                    <p className="order-card-sub">
                      {order.shippingDetails?.phone || ""} •{" "}
                      {order.shippingDetails?.district || "-"}
                    </p>
                  </div>

                  <span className={getStatusBadgeClass(order.status)}>
                    {order.status || "-"}
                  </span>
                </div>

                <div className="order-card-mid">
                  <div className="kpi">
                    <p className="kpi-label">Amount</p>
                    <p className="kpi-value">৳{order.totalAmount}</p>
                  </div>
                  <div className="kpi">
                    <p className="kpi-label">Items</p>
                    <p className="kpi-value">{order.items?.length || 0}</p>
                  </div>
                  <div className="kpi">
                    <p className="kpi-label">Order ID</p>
                    <p className="kpi-value kpi-id">
                      {String(order._id).slice(-8)}
                    </p>
                  </div>
                </div>

                <button
                  className="view-button view-full"
                  onClick={() => setSelectedOrder(order)}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <OrderDetailsModal
        show={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      >
        {selectedOrder && (
          <div className="od-details">
            <div className="order-details-head">
              <h3>Order Details</h3>
              <span className={getStatusBadgeClass(selectedOrder.status)}>
                {selectedOrder.status || "-"}
              </span>
            </div>

            <div className="order-details-grid">
              <div className="od-box">
                <p className="od-label">Customer</p>
                <p className="od-value">
                  {selectedOrder.shippingDetails?.name}
                </p>
              </div>

              <div className="od-box">
                <p className="od-label">Phone</p>
                <p className="od-value">
                  {selectedOrder.shippingDetails?.phone}
                </p>
              </div>

              <div className="od-box od-full">
                <p className="od-label">Address</p>
                <p className="od-value">
                  {selectedOrder.shippingDetails?.address},{" "}
                  {selectedOrder.shippingDetails?.district}
                </p>
              </div>

              <div className="od-box">
                <p className="od-label">Total Amount</p>
                <p className="od-value">৳{selectedOrder.totalAmount}</p>
              </div>

              <div className="od-box">
                <p className="od-label">Items</p>
                <p className="od-value">{selectedOrder.items?.length || 0}</p>
              </div>
            </div>

            <h4 className="od-section-title">Products</h4>
            <ul className="od-list">{renderItems(selectedOrder.items)}</ul>
          </div>
        )}
      </OrderDetailsModal>
    </div>
  );
};

export default OrderList;
