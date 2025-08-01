// src/pages/Register.js
import React, { useState, useEffect } from "react";
import "../Auth.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    password: "",
    confirm_password: "",
    withdrawal_password: "", // ⭐ CORRECTED: Initialize with an empty string
  });

  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const ref = queryParams.get("ref");
    if (ref) {
      setReferralCodeInput(ref);
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "referralCode") {
      setReferralCodeInput(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const { username, phone, password, confirm_password, withdrawal_password } =
      formData;

    if (
      !username ||
      !phone ||
      !password ||
      !confirm_password ||
      !withdrawal_password
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (password !== confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (!referralCodeInput) {
      setError("Referral code is required for registration.");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/signup`, {
        username,
        phone,
        password,
        confirm_password,
        withdrawal_password,
        referralCode: referralCodeInput,
      });

      setMessage(res.data.message || "Registration successful!");
      alert("Registered successfully!");
      navigate("/login");
    } catch (err) {
      console.error(
        "Registration failed:",
        err.response?.data?.message || err.message
      );
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="brand-name">Registration to</h2>
        <p className="tagline">Create your account</p>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <input
          type="text"
          placeholder="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="auth-input"
          required
        />
        <input
          type="text"
          placeholder="Phone number"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="auth-input"
          required
        />
        <input
          type="password"
          placeholder="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="auth-input"
          required
        />
        <input
          type="password"
          placeholder="Confirm password"
          name="confirm_password"
          value={formData.confirm_password}
          onChange={handleChange}
          className="auth-input"
          required
        />
        <input
          type="password"
          placeholder="Withdrawal password"
          name="withdrawal_password"
          value={formData.withdrawal_password}
          onChange={handleChange}
          className="auth-input"
          required
        />

        {/* <input
          type="text"
          placeholder="Referral Code (Required)"
          name="referralCode"
          value={referralCodeInput}
          onChange={handleChange}
          className="auth-input"
          required
          readOnly={!!referralCodeInput}
        /> */}
        <input
          type="text"
          placeholder="Referral Code (Required)"
          name="referralCode"
          value={referralCodeInput}
          onChange={handleChange}
          className="auth-input"
          required
        />

        <button className="auth-button" onClick={handleSubmit}>
          REGISTER
        </button>
        <Link to="/login" className="auth-link">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default Register;
