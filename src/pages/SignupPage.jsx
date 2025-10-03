import React, { useState } from 'react'
import "../styles/SignUpFormStyle.css";
import { Link, useNavigate } from "react-router";
import {FaRegUser} from "react-icons/fa";
import SummaryApi from '../common';
import  {toast} from 'react-toastify';

const SignupPage = () => {
  const navigate = useNavigate();

  const [data, setData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (data.password === data.confirmPassword) {
      const response = await fetch(SummaryApi.signUp.url, {
        method: SummaryApi.signUp.method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Account Created Successfully');
        navigate('/login');
      } else {
        toast.error(result.message);
      }
    } else {
      toast.error('Please check password & confirm password');
    }
  };

  return (
    <section className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-icon">
          <FaRegUser />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={data.name}
              onChange={handleOnChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={data.email}
              onChange={handleOnChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={data.password}
              onChange={handleOnChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password:</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={data.confirmPassword}
              onChange={handleOnChange}
              required
            />
          </div>
          <button type="submit" className="auth-btn">Sign Up</button>
        </form>
        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
};

export default SignupPage
