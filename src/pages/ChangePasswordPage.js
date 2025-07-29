// src/components/ChangePasswordPage.js (or your component path)
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from './LanguageProvider';
import '../ChangePasswordPage.css'; // Create a new CSS file for styling

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    // if (formData.newPassword.length < 2) {
    //   setError(t('passwordTooShort'));
    //   return;
    // }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      };

      // We will create this PUT endpoint in the backend next
      await axios.put(`${API_BASE_URL}/users/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setSuccess(t('passwordChangedSuccess'));
      setTimeout(() => navigate('/profile'), 2000); // Redirect after 2 seconds

    } catch (err) {
      setError(err.response?.data?.message || t('failedToChangePassword'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <h2>{t('changePasswordOption')}</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        
        <div className="form-group">
          <label htmlFor="currentPassword">{t('currentPasswordLabel')}</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">{t('newPasswordLabel')}</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">{t('confirmNewPasswordLabel')}</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? t('saving') : t('saveChanges')}
        </button>
        <button type="button" onClick={() => navigate(-1)} className="back-button">
          {t('backButton')}
        </button>
      </form>
    </div>
  );
}