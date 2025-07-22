import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UserSettingsPage.css'; // Use the same CSS file as before, or create a new one for simpler styling

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const UserSettingsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login'); // Redirect to login if no token
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Assuming response.data has a 'user' object with details including walletAddress
        setUser(response.data.user);
      } catch (err) {
        console.error('Error fetching user data for settings:', err);
        setError(err.response?.data?.message || 'Failed to load user settings. Please try again.');
        if (err.response?.status === 401 || err.response?.status === 403) {
          // If token is invalid or expired, clear storage and redirect
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]); // navigate is a stable function, so no issues here.

  if (loading) {
    return <div className="settings-container">Loading your settings...</div>;
  }

  if (error) {
    return <div className="settings-container error-message">{error}</div>;
  }

  if (!user) {
    return <div className="settings-container">User data not available. Please log in.</div>;
  }

  return (
    <div className="settings-container">
      <button onClick={() => navigate(-1)} className="back-button">
        &larr; Back to Dashboard
      </button>
      <h2>Your Profile Settings</h2>

      <div className="setting-item">
        <label>Username:</label>
        <p>{user.username}</p>
      </div>

      <div className="setting-item">
        <label>Phone Number:</label>
        <p>{user.phone}</p>
      </div>

      <div className="setting-item wallet-info">
        <label>Your Wallet Address:</label>
        <p className="wallet-address-display">
          {user.walletAddress || 'No wallet address assigned.'}
        </p>
        <small className="wallet-note">
          This is your personal wallet address for transactions.
          Changes to this or other account details must be requested from administration.
        </small>
      </div>

      <div className="setting-item">
        <label>Login Password:</label>
        <p>******</p> {/* Always display obfuscated */}
        <small className="password-note">
          To change your login password, please contact support or an administrator.
        </small>
      </div>

      <div className="setting-item">
        <label>Withdrawal Password:</label>
        <p>******</p> {/* Always display obfuscated */}
        <small className="password-note">
          To change your withdrawal password, please contact support or an administrator.
        </small>
      </div>

      {/* You can add more view-only information here if needed, e.g., VIP level, invitation code */}
       <div className="setting-item">
        <label>Your Invitation Code:</label>
        <p>{user.invitation_code || 'N/A'}</p>
      </div>
      <div className="setting-item">
        <label>VIP Level:</label>
        <p>{user.vip_level || 'Bronze'}</p>
      </div>

    </div>
  );
};

export default UserSettingsPage;