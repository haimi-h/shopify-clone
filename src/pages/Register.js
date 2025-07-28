// src/pages/Register.js
import React, { useState, useEffect, useContext } from 'react'; // Import useContext
import '../Auth.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { LanguageContext } from './LanguageGlobe'; // Import LanguageContext

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

function Register() {
  const { t } = useContext(LanguageContext); // Consume the translation function
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: '',
    confirm_password: '',
    withdrawal_password: '', // ⭐ CORRECTED: Initialize with an empty string
  });

  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const ref = queryParams.get('ref');
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
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const {
      username,
      phone,
      password,
      confirm_password,
      withdrawal_password,
    } = formData;

    if (!username || !phone || !password || !confirm_password || !withdrawal_password) {
      setError(t('fillAllFields')); // Translated
      return;
    }

    if (password !== confirm_password) {
      setError(t('passwordsMismatch')); // Translated
      return;
    }

    if (!referralCodeInput) {
        setError(t('referralCodeRequired')); // Translated
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

      setMessage(res.data.message || t('registrationSuccessful')); // Translated
      // Using a custom message box instead of alert()
      // You would typically have a modal component for this
      // For now, console log and navigate
      console.log(t('registrationSuccessful')); // Translated
      navigate('/login');
    } catch (err) {
      console.error("Registration failed:", err.response?.data?.message || err.message);
      setError(err.response?.data?.message || t('registrationFailed')); // Translated
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="brand-name">{t('registrationTo')}</h2> 
        <p className="tagline">{t('createYourAccount')}</p> 

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <input type="text" placeholder={t('usernamePlaceholder')} name="username" value={formData.username} onChange={handleChange} className="auth-input" required /> 
        <input type="text" placeholder={t('phoneNumberPlaceholder')} name="phone" value={formData.phone} onChange={handleChange} className="auth-input" required /> 
        <input type="password" placeholder={t('passwordPlaceholder')} name="password" value={formData.password} onChange={handleChange} className="auth-input" required /> 
        <input type="password" placeholder={t('confirmPasswordPlaceholder')} name="confirm_password" value={formData.confirm_password} onChange={handleChange} className="auth-input" required /> 
        <input type="password" placeholder={t('withdrawalPasswordPlaceholder')} name="withdrawal_password" value={formData.withdrawal_password} onChange={handleChange} className="auth-input" required /> 

        <input
          type="text"
          placeholder={t('referralCodePlaceholder')} 
          name="referralCode"
          value={referralCodeInput}
          onChange={handleChange}
          className="auth-input"
          required
          readOnly={!!referralCodeInput}
        />

        <button className="auth-button" onClick={handleSubmit}>{t('registerButton')}</button> 
        <Link to="/login" className="auth-link">{t('backToLoginLink')}</Link> 
      </div>
    </div>
  );
}

export default Register;
