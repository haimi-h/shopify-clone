// src/pages/Register.js
import React, { useState, useEffect } from 'react'; // Import useEffect
import '../Auth.css';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import axios from 'axios';

// const API = 'http://localhost:5000/api/auth'; // Your backend API base URL
// const API_URL = process.env.REACT_APP_API_URL;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: '',
    confirm_password: '',
    withdrawal_password: '',
    // Removed 'invitation_code' from formData, as it's for the NEW user's generated code.
    // The input field will now be for 'referralCode' (the code they were invited with).
  });

  const [referralCodeInput, setReferralCodeInput] = useState(''); // New state for the referral code input field
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation(); // Initialize useLocation

  // Effect to read the 'ref' query parameter from the URL on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const ref = queryParams.get('ref'); // Get the 'ref' parameter from the URL
    if (ref) {
      setReferralCodeInput(ref); // If 'ref' is found, pre-fill the referral code input
    }
  }, [location]); // Depend on location to re-run if URL changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "referralCode") { // Handle referralCode input separately
      setReferralCodeInput(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => { // Change to async function and accept event
    e.preventDefault(); // Prevent default form submission
    setError('');
    setMessage('');

    const {
      username,
      phone,
      password,
      confirm_password,
      withdrawal_password,
      // invitation_code, // No longer from formData, as it's generated backend-side
    } = formData;

    if (!username || !phone || !password || !confirm_password || !withdrawal_password) {
      setError('Please fill all required fields.');
      return;
    }

    if (password !== confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/signup`, {
        username,
        phone,
        password,
        confirm_password, // Backend expects this for validation
        withdrawal_password,
        referralCode: referralCodeInput, // <--- IMPORTANT: Send the referral code from the input
      });

      setMessage(res.data.message || 'Registration successful!');
      alert('Registered successfully!');
      navigate('/login'); // Redirect to login page
    } catch (err) {
      console.error("Registration failed:", err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="brand-name">Registration to</h2>
        <p className="tagline">Create your account</p>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <input type="text" placeholder="Username" name="username" value={formData.username} onChange={handleChange} className="auth-input" required />
        <input type="text" placeholder="Phone number" name="phone" value={formData.phone} onChange={handleChange} className="auth-input" required />
        <input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} className="auth-input" required />
        <input type="password" placeholder="Confirm password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} className="auth-input" required />
        <input type="password" placeholder="Withdrawal password" name="withdrawal_password" value={formData.withdrawal_password} onChange={handleChange} className="auth-input" required />

        {/* This input is for the referral code the user was INVITED with */}
        <input
          type="text"
          placeholder="Referral Code (Optional)"
          name="referralCode" // Changed name to referralCode
          value={referralCodeInput} // Use new state for this input
          onChange={handleChange}
          className="auth-input"
          readOnly={!!referralCodeInput} // Make it read-only if pre-filled from URL
        />

        <button className="auth-button" onClick={handleSubmit}>REGISTER</button>
        <Link to="/login" className="auth-link">Back to Login</Link>
      </div>
    </div>
  );
}

export default Register;