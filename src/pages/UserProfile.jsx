// imports remain same
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SummaryApi from '../common';
import '../styles/UserProfile.css';
import { Link, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { setUserDetails } from '../store/userSlice';

const UserProfile = () => {
  const user = useSelector((state) => state?.userState?.user);
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchUserOrders = async () => {
    const response = await fetch(SummaryApi.get_user_orders.url, {
      method: "GET",
      credentials: "include",
    });
    const dataApi = await response.json();
    if (dataApi.success) {
      setOrders(dataApi.data);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const confirmDelete = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmDelete) return;

    const response = await fetch(`${SummaryApi.cancel_user_order.url}/${orderId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json();
    if (data.success) {
      setOrders((prev) => prev.filter(order => order._id !== orderId));
    } else {
      alert("Failed to cancel the order.");
    }
  };

  const handleReturnOrder = async (orderId) => {
    const confirmReturn = window.confirm("Are you sure you want to return this order?");
    if (!confirmReturn) return;

    const response = await fetch(`${SummaryApi.return_user_order.url}/${orderId}`, {
      method: "PUT",
      credentials: "include",
    });

    const data = await response.json();
    if (data.success) {
      // আপডেটেড অর্ডার স্টেট এ replace করো
      setOrders((prevOrders) =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, status: "Return" } : order
        )
      );
    } else {
      alert("Failed to return the order.");
    }
  };

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const handleLogout = async () => {
    const fetchData = await fetch(SummaryApi.logout_user.url, {
      method: SummaryApi.logout_user.method,
      credentials: "include",
    });

    const data = await fetchData.json();

    if (data.success) {
      toast.success(data.message);
      dispatch(setUserDetails(null));
      //go to home page
      navigate('/')
    }
    if (data.error) {
      toast.error(data.message);
    }
  };

  // if (!user) return <p>Loading...</p>;

  return (
    <div className="profile-wrapper">
      <h2>User Profile</h2>
      <div className="profile-box">
        <div className="profile-info">
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          <p><strong>Joined:</strong> {new Date(user?.createdAt).toLocaleDateString()}</p>
        </div>
        <button className="order-btn" onClick={() => setShowOrders(!showOrders)}>
          {showOrders ? 'Hide Orders' : 'Your Orders'}
        </button>
      </div>

      {showOrders && (
        <div className="orders-section">
          {orders.length === 0 && <p>No orders found.</p>}
          {orders.map((order, index) => (
            <div key={order._id} className="order-card">
              <h4>Order #{index + 1} - <span>{order.status}</span></h4>
              <p><strong>Order ID:</strong> {order._id}</p>
              <p><strong>Shipping:</strong> {order.shippingDetails.address}, {order.shippingDetails.district}</p>
              <p><strong>Phone:</strong> {order.shippingDetails.phone}</p>
              <p><strong>Total:</strong> ৳{order.totalAmount}</p>
              <p><strong>Ordered At:</strong> {new Date(order.createdAt).toLocaleString()}</p>

                  {/* Status Bar */}
    <StatusBar currentStatus={order.status} />

              <div className="order-items">
                {order.items.map((item) => (
                  <div key={item._id} className="order-item">
                    <div className="order-img">
                      {item.image ? (
                        <img src={item.image} alt="product" />
                      ) : (
                        <div className="no-img">No Image</div>
                      )}
                    </div>
                    <div className="order-info">
                      <p><strong>Product ID:</strong> {item.productId}</p>
                      <p><strong>Color:</strong> {item.color}</p>
                      <p><strong>Size:</strong> {item.size}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cancel Button */}
              {order.status === "Pending" && (
                <button className="cancel-btn" onClick={() => handleCancelOrder(order._id)}>
                  Cancel Order
                </button>
              )}

              {/* Return Button */}
              {(order.status === "Delivered" || order.status === "Shipped") && (
                <button className="return-btn" onClick={() => handleReturnOrder(order._id)}>
                  Return Order
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div>
        <Link to={'/admin-panel/all-products'}>admin panel</Link>
        <button onClick={handleLogout}>Logout</button>
        
      </div>
    </div>
  );
};

const StatusBar = ({ currentStatus }) => {
    const steps = ["Pending", "Confirmed", "Shipped", "Delivered"];
    const currentIndex = steps.indexOf(currentStatus);
  
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "12px",
          marginBottom: "16px",
          fontWeight: "600",
          fontSize: "14px",
          color: "#555",
          position: "relative",
        }}
      >
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
  
          return (
            <div
              key={step}
              style={{ flex: 1, textAlign: "center", position: "relative" }}
            >
              <span
                style={{
                  color: isActive ? "#1976d2" : isCompleted ? "#4caf50" : "#999",
                  fontWeight: isActive ? "bold" : "normal",
                  zIndex: 1,
                  position: "relative",
                  background: "#fff",
                  padding: "0 8px",
                }}
              >
                {step}
              </span>
  
              {index < steps.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 0,
                    height: "3px",
                    width: "100%",
                    backgroundColor: isCompleted ? "#4caf50" : "#ccc",
                    transform: "translateY(-50%)",
                    zIndex: 0,
                    marginLeft: "8px",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

export default UserProfile;

