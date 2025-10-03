import React from "react";
import { Link, Outlet } from "react-router";
import {  useSelector } from "react-redux";
import "../styles/AdminPanel.css";

const AdminPanel = () => {
  const user = useSelector(state => state?.userState?.user)
  console.log("admin user",user?.name);
  
  return (
    <div className="grid-layout">
      <aside className="sidebar">
        <h2>Dashboard</h2>
        <h3 className="user-name"> {user?.name}</h3>
        <nav className="nav-section">
          <Link to="all-users">All Users</Link>
          <Link to="all-products">ALL Products</Link>
          <Link to="all-banners">All Banners</Link>
          <Link to="orders">Orders</Link> 
          <Link to="coupons">Coupons</Link> {/* ✅ new */}
        </nav>
      </aside>
      <main className="main"><Outlet/></main>
    </div>
  );
};

export default AdminPanel;
