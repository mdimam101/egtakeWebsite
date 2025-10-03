import React, { useEffect, useState } from "react";
import SummaryApi from "../common";
import "../styles/OrderList.css"; 
import OrderDetailsModal from "../components/OrderDetailsModal";

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(SummaryApi.get_all_orders.url);
        const data = await res.json();
        if (data.success) {
          console.log("fetchOrders", data.data);
          
          setOrders(data.data || []);
        } else {
          setError(data.message || "Failed to fetch orders");
        }
      } catch (err) {
        setError("Something went wrong",err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getProductDetails = (items) => {
    return items.map((item, idx) => (
      <li key={idx} style={{ display: "flex", alignItems: "center", marginBottom: "1rem", gap: "1rem" }}>
        <img
          src={item.image}
          alt="product"
          style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }}
        />
        <div>
          <p><strong>Product ID:</strong> {item.productId}</p>
          <p><strong>Name:</strong> {item.productName}</p>
          <p><strong>Size:</strong> {item.size}</p>
          <p><strong>Color:</strong> {item.color}</p>
          <p><strong>Quantity:</strong> {item.quantity}</p>
        </div>
      </li>
    ));
  };

  return (
    <div>
      <h2>Order List</h2>
      {loading && <p>Loading orders...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && orders.length === 0 && <p>No orders found.</p>}
      {!loading && !error && orders.length > 0 && (
        <table className="order-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Name</th>
              <th>District</th>
              <th>Status</th>
              <th>৳ Amount</th>
              <th>Total Items</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => (
              <tr key={order._id}>
                <td>{i + 1}</td>
                <td>{order.shippingDetails?.name || "N/A"}</td>
                <td>{order.shippingDetails?.district}</td>
                <td>{order.status}</td>
                <td>৳{order.totalAmount}</td>
                <td>{order.items.length}</td>
                <td>
                  <button onClick={() => setSelectedOrder(order)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <OrderDetailsModal show={!!selectedOrder} onClose={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <div>
            <h3>Order Details</h3>
            <p><strong>Name:</strong> {selectedOrder.shippingDetails?.name}</p>
            <p><strong>Phone:</strong> {selectedOrder.shippingDetails?.phone}</p>
            <p><strong>Address:</strong> {selectedOrder.shippingDetails?.address}, {selectedOrder.shippingDetails?.district}</p>
            <p><strong>Status:</strong> {selectedOrder.status}</p>
            <p><strong>Total Amount:</strong> ৳{selectedOrder.totalAmount}</p>
            <p><strong>Items:</strong></p>
            <ul>{getProductDetails(selectedOrder.items)}</ul>
          </div>
        )}
      </OrderDetailsModal>
    </div>
  );
};

export default OrderList;