
// imports remain same
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SummaryApi from "../common";
import "../styles/UserProfile.css";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { setUserDetails } from "../store/userSlice";
import updateProductStock from "../helpers/updateProductStock";
import { trackMetaOrderCancellation } from "../helpers/metaPixel";
import ReviewModal from "../components/ReviewModal";

// ---------- Status constants ----------
const ORDER_STATUS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELED: "Canceled",
};

const ITEM_STATUS = {
  NORMAL: "Normal",
  RETURN: "Return",
  R_CONFIRMED: "RConfirmed",
  RETURN_COMPLETE: "ReturnComplete",
  REVIEWED: "Reviewed",
  CANCELED: "Canceled",
};

const PROFILE_TABS = ["Pending", "Shipped", "Delivered", "Return", "Review"];

// ---------- Normalizers ----------
const normalizeItemStatus = (status = "") => {
  const raw = String(status || "").trim();
  const key = raw.toLowerCase().replace(/[\s_-]+/g, "");

  if (!key || key === "normal" || key === "pending" || key === "delivered" || key === "shipped") {
    return ITEM_STATUS.NORMAL;
  }

  if (key === "return" || key === "returnpending") return ITEM_STATUS.RETURN;
  if (key === "rconfirmed" || key === "returnconfirmed") return ITEM_STATUS.R_CONFIRMED;
  if (key === "returncomplete" || key === "complete") return ITEM_STATUS.RETURN_COMPLETE;
  if (key === "reviewed" || key === "review") return ITEM_STATUS.REVIEWED;
  if (key === "canceled" || key === "cancelled" || key === "returncanceled" || key === "returncancelled") {
    return ITEM_STATUS.CANCELED;
  }

  return raw || ITEM_STATUS.NORMAL;
};

const getItemStatusLabel = (status) => {
  switch (normalizeItemStatus(status)) {
    case ITEM_STATUS.RETURN:
      return "Return Pending";
    case ITEM_STATUS.R_CONFIRMED:
      return "Return Confirmed";
    case ITEM_STATUS.RETURN_COMPLETE:
      return "Return Complete";
    case ITEM_STATUS.REVIEWED:
      return "Reviewed";
    case ITEM_STATUS.CANCELED:
      return "Return Canceled";
    default:
      return "";
  }
};

const getOrdersForTab = (orders, tab) => {
  const base = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (tab === "Pending") {
    return base.filter((o) => o.status === ORDER_STATUS.PENDING);
  }

  if (tab === "Shipped") {
    return base.filter((o) =>
      [ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPED].includes(o.status)
    );
  }

  if (tab === "Delivered") {
    return base
      .filter((o) => o.status === ORDER_STATUS.DELIVERED)
      .map((o) => ({
        ...o,
        items: (o.items || []).filter((it) => {
          const itemStatus = normalizeItemStatus(it.itemStatus);
          return !isReturnResolvedStatus(itemStatus) && itemStatus !== ITEM_STATUS.REVIEWED;
        }),
      }))
      .filter((o) => (o.items || []).length > 0);
  }

  if (tab === "Return") {
    return base
      .map((o) => ({
        ...o,
        items: (o.items || []).filter((it) => isReturnResolvedStatus(it.itemStatus)),
      }))
      .filter((o) => (o.items || []).length > 0);
  }

  if (tab === "Review") {
    return base
      .map((o) => ({
        ...o,
        items: (o.items || []).filter(
          (it) => normalizeItemStatus(it.itemStatus) === ITEM_STATUS.REVIEWED
        ),
      }))
      .filter((o) => (o.items || []).length > 0);
  }

  return [];
};


const isReturnResolvedStatus = (status) =>
  [ITEM_STATUS.R_CONFIRMED, ITEM_STATUS.RETURN_COMPLETE, ITEM_STATUS.CANCELED].includes(
    normalizeItemStatus(status)
  );

// ---------- Tiny helpers ----------
const telHref = (phone) => `tel:${phone}`;
const waHref = (phone, msg = "Hi Pyzara") =>
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
  const normalizedRole = String(user?.role || user?.userRole || "").toUpperCase();
  const isAdminUser = normalizedRole === "ADMIN" || user?.isAdmin === true;
  const commonInfo = useSelector((s) => s?.commonState?.commonInfoList) || [];
  const SUPPORT_PHONE = commonInfo[0]?.supportCallNumber || "";
  const WHATSAPP_PHONE = commonInfo[0]?.whatsAppNumber || "";

  const [orders, setOrders] = useState([]);
  const [selectedTab, setSelectedTab] = useState("Pending");
  const [loading, setLoading] = useState(false);

  // modals / asks
  const [logoutAsk, setLogoutAsk] = useState(false);
  const [deleteAsk, setDeleteAsk] = useState(false);
  const [cancelAskId, setCancelAskId] = useState(null);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackStatus, setTrackStatus] = useState(ORDER_STATUS.PENDING);

  const [reviewProduct, setReviewProduct] = useState(null);

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
 }, [t]);

  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);



  useEffect(() => {
    if (orders.length === 0) return;

    const firstAvailableTab = PROFILE_TABS.find(
      (tab) => getOrdersForTab(orders, tab).length > 0
    );

    if (firstAvailableTab) setSelectedTab(firstAvailableTab);
  }, [orders]);

  // Filters per tab. No "All" bucket; item status decides Delivered/Return/Review placement.
  const filteredOrders = useMemo(
    () => getOrdersForTab(orders, selectedTab),
    [orders, selectedTab]
  );


  // Stats
  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === ORDER_STATUS.PENDING).length;
    const delivered = orders.filter((o) => o.status === ORDER_STATUS.DELIVERED).length;
     const returnItems = orders.reduce(
      (acc, o) => acc + (o.items || []).filter((it) => isReturnResolvedStatus(it.itemStatus)).length,
      0
    );
    return { pending, delivered, returnItems };
  }, [orders]);

  // Actions
  const handleLogout = async () => {
  try {
    const res = await fetch(SummaryApi.logout_user.url, {
      method: SummaryApi.logout_user.method,
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      localStorage.removeItem("authToken");
      dispatch(setUserDetails(null));
      toast.success(data.message || "Logged out");
      navigate("/", { replace: true });
    } else {
      toast.error(data.message || "Logout failed");
    }
  } catch {
    console.log();
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
        localStorage.removeItem("authToken");
        dispatch(setUserDetails(null));
        toast.success("Account deleted");
        window.location.reload();
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

    const doCancelOrder = async (order) => {
    const orderId = order?._id;
    const item = order?.items || [];
    
    try {
      const response = await fetch(`${SummaryApi.cancel_user_order.url}/${orderId}`, {
        method: "DELETE",
         headers: t ? { Authorization: `Bearer ${t}` } : {},
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        trackMetaOrderCancellation(
          { ...order, ...(data?.data || {}) },
          "customer"
        );
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

  const handleReturnItem = async (orderId, itemId) => {
    try {
      const response = await fetch(`${SummaryApi.return_user_order.url}/${orderId}/${itemId}`, {
        method: SummaryApi.return_user_order.method.toUpperCase(),
        credentials: "include",
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
      const data = await response.json();

      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? {
                  ...o,
                  items: (o.items || []).map((it) =>
                    it._id === itemId ? { ...it, itemStatus: ITEM_STATUS.RETURN } : it
                  ),
                }
              : o
          )
        );
        toast.success(data?.message || "Item return request submitted");
      } else {
        toast.error(data?.message || "Return failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleSubmitReview = async ({ rating, comment, images }) => {
    if (!reviewProduct) return false;
    try {
      const response = await fetch(SummaryApi.create_review.url, {
        method: SummaryApi.create_review.method.toUpperCase(),
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) },
        body: JSON.stringify({
          productId: reviewProduct.productId,
          orderId: reviewProduct.orderId,
          itemId: reviewProduct.itemId,
          rating,
          comment,
          images,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        toast.error(data?.message || "Review submission failed");
        return false;
      }
      setOrders((current) => current.map((order) =>
        order._id === reviewProduct.orderId
          ? { ...order, items: (order.items || []).map((item) => item._id === reviewProduct.itemId ? { ...item, itemStatus: ITEM_STATUS.REVIEWED } : item) }
          : order
      ));
      toast.success(data?.message || "Review submitted");
      return true;
    } catch {
      toast.error("Network error while submitting review");
      return false;
    }
  };


  const openTrack = (status) => {
    setTrackStatus(status || ORDER_STATUS.PENDING);
    setTrackOpen(true);
  };

  // Renderers
  const OrderItemRow = ({ item, order, context }) => {
    const img = item?.image ? item.image.replace("http://", "https://") : null;

    const itemStatus = normalizeItemStatus(item.itemStatus);
    const statusLabel = getItemStatusLabel(itemStatus);

    const canRequestReturn =
      context.selectedTab === "Delivered" &&
      order.status === ORDER_STATUS.DELIVERED &&
      itemStatus === ITEM_STATUS.NORMAL;

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
           {statusLabel ? (
            <span className={`tag tag--${itemStatus.toLowerCase()}`}>{statusLabel}</span>
          ) : null}

          {canRequestReturn ? (
            <button
              className="btn btn--ghost"
              onClick={() => handleReturnItem(order._id, item._id)}
            >
              Return
            </button>
          ) : null}
          {canRequestReturn ? (
            <button
              className="btn btn--review"
              onClick={() => setReviewProduct({
                productId: item?.productId?._id || item?.productId,
                productName: item?.productName,
                orderId: order._id,
                itemId: item._id,
              })}
            >
              Add Review
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
           {isPending ? (
            <button className="btn btn--danger" onClick={() => setCancelAskId(order)}>
              Cancel
            </button>
           ) : (
            <button className="btn btn--primary" onClick={() => openTrack(order.status)}>
              Track
            </button>
          )}
        </div>
      </div>
    );
  };

  // Header initials
  const userInitial = (user?.name || user?.deviceId || "?").charAt(0).toUpperCase();

  return (
    <div className="profile-wrapper">
      {/* Header */}
     {/* Header */}
<div className="profile-header">
  <div className="profile-header__left">
    <h2>Profile</h2>
    <p className="profile-header__sub">Manage your account and orders</p>
  </div>

  {/* <div className="header-actions"> */}
    <button
      type="button"
      className="icon-btn"
      onClick={() => setSettingsOpen(true)}
      title="Settings"
    >
      ⚙️
    </button>

    {/* <Link className="icon-btn" to="/cart" title="Cart">
      🛒
    </Link> */}
  {/* </div> */}
</div>

      {/* Hero */}
      <div className="profile-hero">
      {user?.profilePic ? (
      <img
        className="avatar"
        src={user.profilePic}
        alt={userInitial || "User avatar"}
      />
      ) : (
        <div className="avatar">{userInitial}</div>
      )}
        
        {/* <div className="avatar">{userInitial}</div> */}
        <div className="hero-info">
          <div className="hero-name">{user?.name || user?.deviceId || "User"}</div>
          <div className="hero-email">{user?.email || "-"}</div>
          <div className="member-badge">✓ {user?.role || "_"} Member</div>
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
        <button className="stat-card" onClick={() => setSelectedTab("Pending")}>
          <div className="stat-val">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </button>
        <button className="stat-card" onClick={() => setSelectedTab("Delivered")}>
          <div className="stat-val">{stats.delivered}</div>
          <div className="stat-label">Delivered</div>
        </button>
        <button className="stat-card" onClick={() => setSelectedTab("Return")}>
          <div className="stat-val">{stats.returnItems}</div>
          <div className="stat-label">Return</div>
        </button>
      </div>

      {/* Quick actions */}
      {/* <div className="quick-grid">
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
      </div> */}

       {/* Tabs */}
      <div className="tabs-row">
        {PROFILE_TABS.map((t) => (
          <button
            key={t}
            className={["p-chip", selectedTab === t ? "is-active" : ""].join(" ")}
            onClick={() => setSelectedTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="section-title">
        {`${selectedTab} Orders`}
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
        open={!!cancelAskId?._id}
        title="Are you sure you want to cancel this order?"
        okText="Yes, cancel"
        cancelText="No"
        onOk={() => {
          const order = cancelAskId;
          setCancelAskId(null);
          doCancelOrder(order);
        }}
        onClose={() => setCancelAskId(null)}
      />

      <TrackOrderModal
        open={trackOpen}
        status={trackStatus}
        onClose={() => setTrackOpen(false)}
      />

       <ReviewModal
        open={Boolean(reviewProduct)}
        product={reviewProduct || {}}
        onClose={() => setReviewProduct(null)}
        onSubmit={handleSubmitReview}
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

    <div className="settings-menu">
      <button
        className="settings-item"
        title="Edit Profile"
        onClick={() => toast.info("Edit profile coming soon")}
      >
        <span className="settings-left">
          <span className="settings-emoji">👤</span>
          <span>Edit Profile</span>
        </span>
        <span className="settings-arrow">›</span>
      </button>

      <button
        className="settings-item"
        title="Addresses"
        onClick={() => toast.info("Addresses coming soon")}
      >
        <span className="settings-left">
          <span className="settings-emoji">🗺️</span>
          <span>Addresses</span>
        </span>
        <span className="settings-arrow">›</span>
      </button>

      <button
        className="settings-item"
        title="Notifications"
        onClick={() => toast.info("Notifications coming soon")}
      >
        <span className="settings-left">
          <span className="settings-emoji">🔔</span>
          <span>Notifications</span>
        </span>
        <span className="settings-arrow">›</span>
      </button>

      <button
        className="settings-item"
        title="Language"
        onClick={() => toast.info("Language setting coming soon")}
      >
        <span className="settings-left">
          <span className="settings-emoji">🌐</span>
          <span>Language</span>
        </span>
        <span className="settings-arrow">›</span>
      </button>

      <button
        className="settings-item"
        title="Help & Support"
        onClick={() => {
          setSettingsOpen(false);
          setSupportOpen(true);
        }}
      >
        <span className="settings-left">
          <span className="settings-emoji">❓</span>
          <span>Help & Support</span>
        </span>
        <span className="settings-arrow">›</span>
      </button>

      {isAdminUser && (
        <Link
          to="/admin-panel/all-products"
          className="settings-item"
          title="Admin Panel"
          onClick={() => setSettingsOpen(false)}
        >
          <span className="settings-left">
            <span className="settings-emoji">🛠️</span>
            <span>Admin Panel</span>
          </span>
          <span className="settings-arrow">›</span>
        </Link>
      )}


      <button
        className="settings-item danger"
        title="Logout"
        onClick={() => {
          setSettingsOpen(false);
          setLogoutAsk(true);
        }}
      >
        <span className="settings-left">
          <span className="settings-emoji">🚪</span>
          <span>Logout</span>
        </span>
        <span className="settings-arrow">›</span>
      </button>

      <button
        className="settings-item danger"
        title="Delete Account"
        onClick={() => {
          setSettingsOpen(false);
          setDeleteAsk(true);
        }}
      >
        <span className="settings-left">
          <span className="settings-emoji">🗑️</span>
          <span>Delete Account</span>
        </span>
        <span className="settings-arrow">›</span>
      </button>
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
