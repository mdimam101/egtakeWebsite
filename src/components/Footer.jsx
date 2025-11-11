import React, { useContext } from "react";
import "../styles/FooterStyles.css";
import { FaHome } from "react-icons/fa";
import { BiSolidCategory } from "react-icons/bi";
import { FaCartArrowDown } from "react-icons/fa";
import { FaRegUserCircle } from "react-icons/fa";
import { Link, useLocation } from "react-router";
import Context from "../context";
import { useSelector } from "react-redux";

const Footer = () => {
  const { cartCountProduct } = useContext(Context);
  const user = useSelector((s) => s?.userState?.user);
  const location = useLocation();
  const redirectURL = user?._id ? "/profile" : "/sign-up";

  const path = location.pathname;

  // RN-এর মত active চেক
  const isActive = (name) => {
    switch (name) {
      case "home":
        return path === "/home" || path === "/";
      case "category":
        return path.startsWith("/category");
      case "cart":
        return path.startsWith("/cart");
      case "account":
        return path.startsWith("/profile") || path.startsWith("/sign-up");
      default:
        return false;
    }
  };

  return (
    <div className="main-footer rn-footer">
      {/* Home */}
      <Link to="/home" className={`footer-item ${isActive("home") ? "active" : ""}`}>
        <FaHome className="footer-icon" />
        <span className="footer-label">Home</span>
      </Link>

      {/* Category */}
      <Link to="/category" className={`footer-item ${isActive("category") ? "active" : ""}`}>
        <BiSolidCategory className="footer-icon" />
        <span className="footer-label">Category</span>
      </Link>

      {/* Cart */}
      <Link to="/cart" className={`footer-item ${isActive("cart") ? "active" : ""}`}>
        <div className="cart-icon-container">
          <FaCartArrowDown className="footer-icon" />
          {cartCountProduct > 0 && (
            <span className="cart-count-badge">{cartCountProduct}</span>
          )}
        </div>
        <span className="footer-label">Cart</span>
      </Link>

      {/* Account */}
      <Link to={redirectURL} className={`footer-item ${isActive("account") ? "active" : ""}`}>
        <FaRegUserCircle className="footer-icon" />
        <span className="footer-label">Account</span>
      </Link>
    </div>
  );
};

export default Footer;
