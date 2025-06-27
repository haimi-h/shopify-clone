// Register.jsx
import React, { useState } from 'react';
import '../Auth.css';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    phone_number: '',
    password: '',
    password_confirmation: '',
    withdrawal_password: '',
    invitation_code: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async () => {
    try {
      await axios.get("http://127.0.0.1:8000/sanctum/csrf-cookie", { withCredentials: true });

      const res = await axios.post(
        'http://127.0.0.1:8000/register',
        formData,
        { withCredentials: true }
      );

      console.log('Registered:', res.data);
      alert('Registration successful!');
      navigate('/dashboard'); // or navigate('/login') depending on your flow
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert('Registration failed!');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="brand-name">Registration to</h2>
        <img src="..." alt="Logo" className="logo" />
        <p className="tagline">Create your account</p>

        <input type="text" placeholder="Username" name="username" value={formData.username} onChange={handleChange} className="auth-input" />
        <input type="text" placeholder="Phone number" name="phone" value={formData.phone_number} onChange={handleChange} className="auth-input" />
        <input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} className="auth-input" />
        <input type="password" placeholder="Confirm password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} className="auth-input" />
        <input type="password" placeholder="Withdrawal password" name="withdrawal_password" value={formData.withdrawal_password} onChange={handleChange} className="auth-input" />
        <input type="text" placeholder="Invitation Code" name="invitation_code" value={formData.invitation_code} onChange={handleChange} className="auth-input" />

        <button className="auth-button" onClick={handleSubmit}>REGISTER</button>
        <Link to="/login" className="auth-link">Back to Login</Link>
      </div>
    </div>
  );
}

export default Register;
