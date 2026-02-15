import React, { useState } from "react";
import { Link, Outlet } from "react-router";
import { useSelector } from "react-redux";
import "../styles/AdminPanel.css";

const AdminPanel = () => {
  const user = useSelector((state) => state?.userState?.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="grid-layout">
      {/* Mobile Topbar */}
      <div className="mobile-topbar">
        <button
          type="button"
          className="menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <div className="mobile-title">Admin Dashboard</div>
        <div style={{ width: 40 }} /> {/* balance spacing */}
      </div>

      {/* Overlay (mobile only) */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h2>Dashboard</h2>
        <h3 className="user-name">{user?.name}</h3>

        <nav className="nav-section">
          <Link to="all-users" onClick={closeSidebar}>All Users</Link>
          <Link to="all-products" onClick={closeSidebar}>ALL Products</Link>
          <Link to="all-banners" onClick={closeSidebar}>All Banners</Link>
          <Link to="orders" onClick={closeSidebar}>Orders</Link>
          <Link to="coupons" onClick={closeSidebar}>Coupons</Link>
        </nav>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminPanel;
