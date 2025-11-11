// import React, { useState } from 'react'
// import "../styles/SignUpFormStyle.css";
// import { Link, useNavigate } from "react-router";
// import {FaRegUser} from "react-icons/fa";
// import SummaryApi from '../common';
// import  {toast} from 'react-toastify';

// const SignupPage = () => {
//   const navigate = useNavigate();

//   const [data, setData] = useState({
//     email: '',
//     password: '',
//     name: '',
//     confirmPassword: '',
//   });

//   const handleOnChange = (e) => {
//     const { name, value } = e.target;
//     setData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (data.password === data.confirmPassword) {
//       const response = await fetch(SummaryApi.signUp.url, {
//         method: SummaryApi.signUp.method,
//         headers: { 'content-type': 'application/json' },
//         body: JSON.stringify(data)
//       });

//       const result = await response.json();

//       if (result.success) {
//         toast.success('Account Created Successfully');
//         navigate('/login');
//       } else {
//         toast.error(result.message);
//       }
//     } else {
//       toast.error('Please check password & confirm password');
//     }
//   };

//   return (
//     <section className="auth-wrapper">
//       <div className="auth-container">
//         <div className="auth-icon">
//           <FaRegUser />
//         </div>
//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label>Name:</label>
//             <input
//               type="text"
//               name="name"
//               placeholder="Enter your name"
//               value={data.name}
//               onChange={handleOnChange}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label>Email:</label>
//             <input
//               type="email"
//               name="email"
//               placeholder="Enter email"
//               value={data.email}
//               onChange={handleOnChange}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label>Password:</label>
//             <input
//               type="password"
//               name="password"
//               placeholder="Enter password"
//               value={data.password}
//               onChange={handleOnChange}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label>Confirm Password:</label>
//             <input
//               type="password"
//               name="confirmPassword"
//               placeholder="Confirm password"
//               value={data.confirmPassword}
//               onChange={handleOnChange}
//               required
//             />
//           </div>
//           <button type="submit" className="auth-btn">Sign Up</button>
//         </form>
//         <p className="auth-footer-text">
//           Already have an account? <Link to="/login">Login</Link>
//         </p>
//       </div>
//     </section>
//   );
// };

// export default SignupPage

// src/pages/SignupPage.jsx
import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import SummaryApi from "../common/index"; // keep your existing file/paths
import { ensureDeviceId, getDeviceId } from "../helpers/deviceId";

// ⬇️ If you already have a global Context with fetchUserDetails, import it:
import Context from "../context"; // adjust path if needed

export default function SignupPage() {
  const navigate = useNavigate();
  const { fetchUserDetails } = useContext(Context) || { fetchUserDetails: () => {} };

  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);
  const [readyDeviceId, setReadyDeviceId] = useState(null);

  // Ensure deviceId exists when screen mounts (web)
  useEffect(() => {
    const id = ensureDeviceId();
    setReadyDeviceId(id);
  }, []);

  // Memo UI states
  const isDisabled = useMemo(
    () => !readyDeviceId || isGuestSubmitting,
    [readyDeviceId, isGuestSubmitting]
  );

  // ✅ Guest flow: body তে শুধু { deviceId }
  const handleGuestContinue = async () => {
    try {
      setIsGuestSubmitting(true);

      const deviceId = getDeviceId() || ensureDeviceId();
      if (!deviceId) {
        toast.error("Failed to get device id");
        return;
      }

      // Try signUp
      let signedUp = false;
      try {
        const res = await axios({
          method: SummaryApi.signUp.method, // "POST"
          url: SummaryApi.signUp.url,       // e.g., /api/user/signup
          headers: { "Content-Type": "application/json" },
          data: { deviceId },               // <<— only deviceId in body
          withCredentials: true,            // cookie auth
        });
        console.log("◆token ",res.data);
        
        signedUp = !!res?.data?.success;
      } catch {
        // signUp failure is acceptable if user already exists –继续 to signIn
      }

      // Then signIn (always attempt)
      try {
        const response = await axios({
          method: SummaryApi.signIn.method, // "POST"
          url: SummaryApi.signIn.url,
          headers: { "Content-Type": "application/json" },
          withCredentials: true,            // cookie auth
          data: { deviceId },
        });

        if (response?.data?.success) {
          console.log("Login successful11111",response?.data.data);
          localStorage.setItem('authToken', response?.data.data);
          
          toast.success("Login successful");
          try {
            await fetchUserDetails?.();
          } catch  (e){console.log("signup err",e)}
          navigate("/", { replace: true });
          return;
        }

        toast.error(response?.data?.message || "Login failed");
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Something went wrong during login"
        );
      }

      // If we get here, signIn failed; surface signUp message if we have it
      if (!signedUp) {
        toast.error("Guest login failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Guest login error");
    } finally {
      setIsGuestSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.cardWrap}>
        {/* Brand Header */}
        <div style={styles.headerWrap}>
          <div style={styles.brand}>EGtake</div>
          <div style={styles.tagline}>Shop with confidence</div>
        </div>

        <div style={styles.card}>
          <div style={styles.title}>Continue as Guest</div>
          <div style={styles.subText}>
            One-tap login. No email or phone required.
          </div>

          <button
            style={{
              ...styles.guestBtn,
              ...(isDisabled ? { opacity: 0.6, cursor: "not-allowed" } : {}),
            }}
            onClick={handleGuestContinue}
            disabled={isDisabled}
          >
            <div style={styles.guestBtnText}>
              {isGuestSubmitting ? "Logging in..." : "Continue"}
            </div>
            <div style={styles.guestHint}>
              We’ll create a secure guest session for this device.
            </div>
          </button>

          {/* (Optional) Later add Email/Phone form here */}
        </div>
      </div>

      <ToastContainer position="top-center" />
    </div>
  );
}

/** simple CSS-in-JS to keep it framework-free */
const styles = {
  page: {
    minHeight: "100dvh",
    background: "#f7f8fa",
    display: "grid",
    placeItems: "center",
    padding: "16px",
  },
  cardWrap: {
    width: "100%",
    maxWidth: "440px",
  },
  headerWrap: { textAlign: "center", marginBottom: "12px" },
  brand: { fontSize: "28px", fontWeight: 800, color: "#111" },
  tagline: { marginTop: 4, fontSize: "12px", color: "#6b7280", letterSpacing: ".4px" },

  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,.06)",
  },
  title: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#111827",
    textAlign: "center",
  },
  subText: {
    marginTop: "8px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "13px",
  },

  guestBtn: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    padding: "14px 16px",
    background: "#fff",
    marginTop: "18px",
  },
  guestBtnText: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: 700,
    color: "#111",
  },
  guestHint: { textAlign: "center", color: "#6b7280", fontSize: "12px", marginTop: "6px" },
};

