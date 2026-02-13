
// imports remain same
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SummaryApi from "../common";
import "../styles/UserProfile.css";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { setUserDetails } from "../store/userSlice";
import updateProductStock from "../helpers/updateProductStock";

// ---------- Status constants ----------
const ORDER_STATUS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  RETURN: "Return",
  CANCELLED: "Cancelled",
};

const ITEM_STATUS = {
  PENDING: "Pending",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  RETURN_PENDING: "Return Pending",
  RETURN_CONFIRMED: "Return Confirmed",
};

// ---------- Normalizers ----------
const normalizeItemStatus = (s = "") => {
  const t = String(s).toLowerCase().replace(/\s+/g, "");
  if (t === "returnpending" || t === "return") return ITEM_STATUS.RETURN_PENDING;
  if (t === "returnconfirmed") return ITEM_STATUS.RETURN_CONFIRMED;
  if (t === "shipped") return ITEM_STATUS.SHIPPED;
  if (t === "delivered") return ITEM_STATUS.DELIVERED;
  if (t === "pending") return ITEM_STATUS.PENDING;
  return s || ITEM_STATUS.PENDING;
};

// ---------- Tiny helpers ----------
const telHref = (phone) => `tel:${phone}`;
const waHref = (phone, msg = "Hi EGtake") =>
  `https://wa.me/${String(phone).replace(/^\+/, "")}?text=${encodeURIComponent(
    msg
  )}`;

// ---------- UI bits ----------
const StatusBar = ({ currentStatus }) => {
  const steps = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.DELIVERED,
  ];
  const currentIndex = steps.indexOf(currentStatus);

  return (
    <div className="statusbar">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;

        return (
          <div key={step} className="statusbar__step">
            <span
              className={[
                "statusbar__label",
                isActive ? "is-active" : "",
                isCompleted ? "is-completed" : "",
              ].join(" ")}
            >
              {step}
            </span>

            {index < steps.length - 1 && (
              <div
                className={[
                  "statusbar__line",
                  isCompleted ? "is-completed" : "",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---------- Web Modals (lightweight) ----------
const ConfirmModal = ({ open, title, okText = "Confirm", cancelText = "Cancel", onOk, onClose }) => {
  if (!open) return null;
  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className="modal__content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal__title">{title}</h3>
        <div className="modal__actions">
          <button className="btn btn--muted" onClick={onClose}>
            {cancelText}
          </button>
          <button className="btn btn--danger" onClick={onOk}>
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
};

const TrackOrderModal = ({ open, status, onClose }) => {
  if (!open) return null;
  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className="modal__content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal__title">Tracking Order</h3>
        <StatusBar currentStatus={status} />
        <div className="modal__actions">
          <button className="btn" onClick={onClose}>✖ Close</button>
        </div>
      </div>
    </div>
  );
};

// ---------- Main ----------
const UserProfile = () => {
  const t = localStorage.getItem('authToken');
  const user = useSelector((s) => s?.userState?.user);
  const commonInfo = useSelector((s) => s?.commonState?.commonInfoList) || [];
  const SUPPORT_PHONE = commonInfo[0]?.supportCallNumber || "";
  const WHATSAPP_PHONE = commonInfo[0]?.whatsAppNumber || "";

  const [orders, setOrders] = useState([]);
  const [selectedTab, setSelectedTab] = useState("All");
  const [loading, setLoading] = useState(false);

  // modals / asks
  const [logoutAsk, setLogoutAsk] = useState(false);
  const [deleteAsk, setDeleteAsk] = useState(false);
  const [cancelAskId, setCancelAskId] = useState(null);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackStatus, setTrackStatus] = useState(ORDER_STATUS.PENDING);

  // sheets
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fetchUserOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.get_user_orders.url, {
        method: "GET",
         headers: t ? { Authorization: `Bearer ${t}` } : {},
        credentials: "include",
      });
      const dataApi = await response.json();
      if (dataApi?.success) {
        const normalized = (dataApi.data || []).map((o) => ({
          ...o,
          items: (o.items || []).map((it) => ({
            ...it,
            itemStatus: normalizeItemStatus(it.itemStatus),
          })),
        }));
        setOrders(normalized);
      } else {
        toast.error(dataApi?.message || "Failed to load orders");
      }
    } catch {
      toast.error("Network error while loading orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);



  // Filters per tab (Review section fully removed)
  const filteredOrders = useMemo(() => {
    const base = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (selectedTab === "Pending") {
      return base.filter((o) => o.status === ORDER_STATUS.PENDING);
    }

    if (selectedTab === "Shipping") {
      return base.filter((o) =>
        [ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED].includes(o.status)
      );
    }

    if (selectedTab === "Delivered") {
      return base
        .filter((o) => o.status === ORDER_STATUS.DELIVERED)
        .map((o) => ({
          ...o,
          // review বাদ, শুধু return-confirmed বাদ দিই
          items: (o.items || []).filter(
            (it) => it.itemStatus !== ITEM_STATUS.RETURN_CONFIRMED
          ),
        }))
        .filter((o) => (o.items || []).length > 0);
    }

    if (selectedTab === "Return") {
      return base
        .map((o) => ({
          ...o,
          items: (o.items || []).filter(
            (it) => it.itemStatus === ITEM_STATUS.RETURN_CONFIRMED
          ),
        }))
        .filter((o) => (o.items || []).length > 0);
    }

    return base; // All
  }, [orders, selectedTab]);

  // Stats
  const stats = useMemo(() => {
    const all = orders.length;
    const delivered = orders.filter((o) => o.status === ORDER_STATUS.DELIVERED).length;
    const returnConfirmed = orders.reduce(
      (acc, o) =>
        acc + (o.items || []).filter((it) => it.itemStatus === ITEM_STATUS.RETURN_CONFIRMED).length,
      0
    );
    return { all, delivered, returnConfirmed };
  }, [orders]);

  // Actions
  const handleLogout = async () => {
    try {
      const res = await fetch(SummaryApi.logout_user.url, {
        method: SummaryApi.logout_user.method,
        credentials: "include",
         headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Logged out");
        dispatch(setUserDetails(null));
        navigate("/");
      } else {
        toast.error(data.message || "Logout failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLogoutAsk(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch(SummaryApi.delete_account.url, {
        method: "DELETE",
        credentials: "include",
         headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
      const data = await res.json();
      if (data?.success) {
        dispatch(setUserDetails(null));
        toast.success("Account deleted");
        navigate("/");
      } else {
        toast.error(data?.message || "Delete failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleteAsk(false);
    }
  };

  // const handleCancelOrder = async (orderId) => {
  //   setCancelAskId(orderId); // confirm first
  // };

  const doCancelOrder = async (orderId, item) => {
    console.log("order cancel...", orderId, item);
    
    try {
      const response = await fetch(`${SummaryApi.cancel_user_order.url}/${orderId}`, {
        method: "DELETE",
         headers: t ? { Authorization: `Bearer ${t}` } : {},
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
        toast.success("Order cancelled");
        // product stock update
        for (const itm of item) {
         await updateProductStock(
         itm.productId,
         itm.image,
         itm.size,
         itm.quantity,
         true
         );
        }
      } else {
        toast.error(data?.message || "Cancel failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleReturnOrder = async (orderId) => {
    try {
      const response = await fetch(`${SummaryApi.return_user_order.url}/${orderId}`, {
        method: "PUT",
        credentials: "include",
         headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
      const data = await response.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: ORDER_STATUS.RETURN } : o))
        );
        toast.success("Return requested");
      } else {
        toast.error(data?.message || "Return failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleReturnItem = async (orderId, itemId) => {
    try {
      const response = await fetch(
        `${SummaryApi.return_user_order_item.url}/${orderId}/${itemId}`,
        {
          method: "PUT",
          credentials: "include",
           headers: t ? { Authorization: `Bearer ${t}` } : {},
        }
      );
      const data = await response.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? {
                  ...o,
                  items: (o.items || []).map((it) =>
                    it._id === itemId ? { ...it, itemStatus: ITEM_STATUS.RETURN_PENDING } : it
                  ),
                }
              : o
          )
        );
        toast.success("Item marked for return");
      } else {
        toast.error(data?.message || "Return failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const openTrack = (status) => {
    setTrackStatus(status || ORDER_STATUS.PENDING);
    setTrackOpen(true);
  };

  // Renderers
  const OrderItemRow = ({ item, order, context }) => {
    const img = item?.image ? item.image.replace("http://", "https://") : null;

    const deliveredTab = context.selectedTab === "Delivered";
    const shippingTabOnlyTrack =
      context.selectedTab === "Shipping" && order.status === ORDER_STATUS.CONFIRMED;
    const returnTab = context.selectedTab === "Return";

    let showReturnBtn = false;
    let showReturnPendingBadge = false;

    if (deliveredTab) {
      if (item.itemStatus === ITEM_STATUS.RETURN_PENDING) {
        showReturnPendingBadge = true;
        showReturnBtn = false;
      } else {
        showReturnBtn = true;
      }
    }

    if (shippingTabOnlyTrack) {
      showReturnBtn = false;
      showReturnPendingBadge = false;
    }

    if (returnTab) {
      showReturnBtn = false;
      showReturnPendingBadge = false;
    }

    return (
      <div className="order-item">
        <div className="order-item__top">
          <div className="order-img">
            {img ? <img src={img} alt="product" /> : <div className="no-img">No Image</div>}
          </div>
          <div className="order-info">
            <p className="oi__name"><strong>{item?.productName || "Product"}</strong></p>
            {item?.color ? <p className="oi__meta">Color: {item.color}</p> : null}
            {item?.size ? <p className="oi__meta">Size: {item.size}</p> : null}
            <p className="oi__meta">Qty: {item?.quantity || 1}</p>
            <p className="oi__meta">Price: {item?.price ?? "-"}</p>
             <p className="oi__meta">product Code: {item?.productCodeNumber ?? "-"}</p>
          </div>
        </div>

        <div className="order-item__actions">
          {showReturnPendingBadge ? (
            <span className="tag tag--gray">Return Pending</span>
          ) : null}

          {showReturnBtn ? (
            <button
              className="btn btn--ghost"
              onClick={() => handleReturnItem(order._id, item._id)}
            >
              Return
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  const OrderCard = ({ order, index }) => {
    const ship = order?.shippingDetails || {};
    const createdAt = order?.createdAt ? new Date(order.createdAt) : null;

    const isPending = order.status === ORDER_STATUS.PENDING;
    const isConfirmed = order.status === ORDER_STATUS.CONFIRMED;
    const isShipped = order.status === ORDER_STATUS.SHIPPED;

    const shippingTabOnlyTrack = selectedTab === "Shipping" && isConfirmed;

    return (
      <div className="order-card">
        <div className="order-card__head">
          <h4>Order #{index + 1}</h4>
          <span className={`status-chip status-${String(order.status).toLowerCase()}`}>
            {order.status}
          </span>
        </div>

        <div className="order-meta">
          <p>
            Order ID: <span className="meta__val">{order?._id}</span>
          </p>
          <p>
            Ship to:{" "}
            <span className="meta__val">
              {(ship.address || "-") + (ship.district ? `, ${ship.district}` : "")}
            </span>
          </p>
          <p>
            Phone: <span className="meta__val">{ship.phone || "-"}</span>
          </p>
          <p>
            Total: <span className="meta__val">৳{order?.totalAmount ?? "-"}</span>
          </p>
          <p>
            Placed:{" "}
            <span className="meta__val">{createdAt ? createdAt.toLocaleString() : "-"}</span>
          </p>
        </div>

        {(order.items || []).map((raw) => {
          const item = {
            ...raw,
            itemStatus: normalizeItemStatus(raw.itemStatus),
          };
          return (
            <OrderItemRow
              key={item._id}
              item={item}
              order={order}
              context={{ selectedTab }}
            />
          );
        })}

        {/* Order-level actions (bottom) */}
        <div className="order-actions">
          {selectedTab !== "Return" && (
            <>
              {isPending ? (
                <button className="btn btn--danger" onClick={() => setCancelAskId({orderId:order._id, orderItems:order.items})}>
                  Cancel
                </button>
              ) : (
                <button className="btn btn--primary" onClick={() => openTrack(order.status)}>
                  Track
                </button>
              )}
            </>
          )}

          {/* Hide in Delivered; Confirmed = only Track; Shipped can Return */}
          {selectedTab !== "Delivered" && !shippingTabOnlyTrack && isShipped ? (
            <button className="btn btn--warn" onClick={() => handleReturnOrder(order._id)}>
              {(order.items || []).length > 1 ? "Return All" : "Return"}
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  // Header initials
  const userInitial = (user?.name || user?.deviceId || "?").charAt(0).toUpperCase();

  return (
    <div className="profile-wrapper">
      {/* Header */}
      <div className="profile-header">
        <h2>Profile</h2>

        <div className="header-actions">
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings">
            ⚙️
          </button>
          <Link className="icon-btn" to="/cart" title="Cart">
            🛒
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="profile-hero">
        <div className="avatar">{userInitial}</div>
        <div className="hero-info">
          <div className="hero-name">{user?.name || user?.deviceId || "User"}</div>
          <div className="hero-email">{user?.email || "-"}</div>
          <div className="member-badge">✓ Member</div>
        </div>
        <button
          className="btn btn--outline"
          onClick={() => toast.info("Edit profile coming soon")}
        >
          ✎ Edit
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <button className="stat-card" onClick={() => setSelectedTab("All")}>
          <div className="stat-val">{stats.all}</div>
          <div className="stat-label">Orders</div>
        </button>
        <button className="stat-card" onClick={() => setSelectedTab("Delivered")}>
          <div className="stat-val">{stats.delivered}</div>
          <div className="stat-label">Delivered</div>
        </button>
        <button className="stat-card" onClick={() => setSelectedTab("Return")}>
          <div className="stat-val">{stats.returnConfirmed}</div>
          <div className="stat-label">Return</div>
        </button>
      </div>

      {/* Quick actions */}
      <div className="quick-grid">
        <button className="quick-item" onClick={() => setSelectedTab("All")}>
          📦 <span>My Orders</span>
        </button>
        <button className="quick-item" onClick={() => toast.info("Addresses coming soon")}>
          📍 <span>Addresses</span>
        </button>
        <button className="quick-item" onClick={() => setSupportOpen(true)}>
          🎧 <span>Support</span>
        </button>
        <button className="quick-item" onClick={() => toast.info("Notifications coming soon")}>
          🔔 <span>Notifications</span>
        </button>
        <button className="quick-item" onClick={() => toast.info("Payment methods coming soon")}>
          💳 <span>Payments</span>
        </button>
        <button className="quick-item" onClick={() => toast.info("Help center coming soon")}>
          ❓ <span>Help</span>
        </button>
      </div>

      {/* Tabs (Review removed) */}
      <div className="tabs-row">
        {["All", "Pending", "Shipping", "Delivered", "Return"].map((t) => (
          <button
            key={t}
            className={["chip", selectedTab === t ? "is-active" : ""].join(" ")}
            onClick={() => setSelectedTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="section-title">
        {selectedTab === "All" ? "Recent Orders" : `${selectedTab} Orders`}
      </div>

      {/* Loader / Empty */}
      {loading ? (
        <div className="loading-box">Loading orders…</div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-box">
          <div>📦</div>
          <div>No orders found</div>
          <Link className="btn btn--primary" to="/">Go Shopping</Link>
        </div>
      ) : null}

      {/* Orders */}
      {!loading &&
        filteredOrders.map((o, idx) => <OrderCard key={o._id} order={o} index={idx} />)}

      {/* Footer actions: Admin panel link removed from footer; now inside Settings */}
      <div className="profile-footer">
        <span />
        <button className="btn btn--danger" onClick={() => setLogoutAsk(true)}>
          Logout
        </button>
      </div>

      {/* Modals */}
      <ConfirmModal
        open={logoutAsk}
        title="Are you sure you want to logout?"
        onOk={handleLogout}
        onClose={() => setLogoutAsk(false)}
      />

      <ConfirmModal
        open={deleteAsk}
        title="Are you sure delete your account?"
        okText="Yes, delete"
        cancelText="No"
        onOk={handleDeleteAccount}
        onClose={() => setDeleteAsk(false)}
      />

      <ConfirmModal
        open={!!cancelAskId?.orderId}
        title="Are you sure you want to cancel this order?"
        okText="Yes, cancel"
        cancelText="No"
        onOk={() => {
          const id = cancelAskId?.orderId;
          setCancelAskId(null);
          doCancelOrder(id, cancelAskId?.orderItems);
        }}
        onClose={() => setCancelAskId(null)}
      />

      <TrackOrderModal
        open={trackOpen}
        status={trackStatus}
        onClose={() => setTrackOpen(false)}
      />

      {/* Settings Sheet (ICON-ONLY) */}
      <div className={["sheet", settingsOpen ? "is-open" : ""].join(" ")}>
        <div className="sheet__backdrop" onClick={() => setSettingsOpen(false)} />
        <div className="sheet__body">
          <div className="sheet__head">
            <div className="sheet__title">Settings</div>
            <button className="icon-btn" onClick={() => setSettingsOpen(false)}>
              ✖
            </button>
          </div>

          {/* icon-only grid; NO LABEL TEXT */}
          <div className="icons-grid">
            <button className="icon-only" title="Edit Profile" onClick={() => toast.info("Edit profile coming soon")}>👤</button>
            <button className="icon-only" title="Addresses" onClick={() => toast.info("Addresses coming soon")}>🗺️</button>
            <button className="icon-only" title="Notifications" onClick={() => toast.info("Notifications coming soon")}>🔔</button>
            <button className="icon-only" title="Language" onClick={() => toast.info("Language setting coming soon")}>🌐</button>
            <button className="icon-only" title="Help & Support" onClick={() => { setSettingsOpen(false); setSupportOpen(true); }}>❓</button>
            {/* Admin panel — moved here */}
            <Link to="/admin-panel/all-products" className="icon-only" title="Admin Panel" onClick={() => setSettingsOpen(false)}>🛠️</Link>
            <button className="icon-only danger" title="Logout" onClick={() => { setSettingsOpen(false); setLogoutAsk(true); }}>🚪</button>
            <button className="icon-only danger" title="Delete Account" onClick={() => { setSettingsOpen(false); setDeleteAsk(true); }}>🗑️</button>
          </div>
        </div>
      </div>

      {/* Support sheet */}
      <div className={["sheet", supportOpen ? "is-open" : ""].join(" ")}>
        <div className="sheet__backdrop" onClick={() => setSupportOpen(false)} />
        <div className="sheet__body">
          <div className="sheet__head">
            <div className="sheet__title">Support</div>
            <button className="icon-btn" onClick={() => setSupportOpen(false)}>
              ✖
            </button>
          </div>

          <div className="support-card">
            <a className="support-row" href={telHref(SUPPORT_PHONE)} rel="noreferrer">
              <span>📞 Call Support</span>
              <span className="support-sub">{SUPPORT_PHONE || "-"}</span>
            </a>
            <div className="sheet__divider" />
            <a className="support-row" href={waHref(WHATSAPP_PHONE)} target="_blank" rel="noreferrer">
              <span>🟢 WhatsApp Chat</span>
              <span className="support-sub">{WHATSAPP_PHONE || "-"}</span>
            </a>
          </div>

          <div className="support-note">Our support is available 08:00–21:00 (GMT+6).</div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
