import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// Removed: import { User, Wallet, Lock, Globe, Image, LifeBuoy, Info, Plus } from 'lucide-react';
import { LanguageContext } from './LanguageProvider'; // Assuming LanguageProvider is in the same directory or adjust path
import LanguageSelector from './LanguageProvider'; // Assuming LanguageSelector is default export from LanguageProvider
import shopifyLogo from '../shopify-logo.png'; // Adjust path as needed

// Define your API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export default function UserSettingsPage() {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext); // Consume the translation function from context

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      setError(t('failedToLoadProfile')); // Translated error message
      // If unauthorized, clear token and redirect to login
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, t]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Function to handle navigation to different setting sections
  const handleSettingClick = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">{t('loadingText')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-red-500">
        <p>{error}</p>
        <button
          onClick={fetchUserProfile}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          {t('retryButton')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6 md:p-8">
      {/* Top Right Language Selector */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>

      {/* Header Section */}
      <header className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        {/* Removed User icon */}
        {user && (
          <>
            <h1 className="text-2xl font-bold mb-1">{user.username}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{user.phone}</p>
            <div className="flex items-center mt-4 bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full">
              <span className="text-xl font-semibold mr-2">{user.wallet_balance ? parseFloat(user.wallet_balance).toFixed(2) : '0.00'}</span>
              <span className="text-lg font-medium">{t('currencySymbol')}</span>
              <button
                onClick={() => handleSettingClick('/recharge')}
                className="ml-4 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200"
                title={t('addFundsButton')}
              >
                {/* Removed Plus icon */}
                +
              </button>
            </div>
          </>
        )}
      </header>

      {/* Settings Options List */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {/* Withdraw */}
          <li
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            onClick={() => handleSettingClick('/withdraw')}
          >
            <div className="flex items-center">
              {/* Removed Wallet icon */}
              <span className="text-lg font-medium">{t('withdrawOption')}</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">&gt;</span>
          </li>
          {/* Change Password */}
          <li
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            onClick={() => handleSettingClick('/settings')}
          >
            <div className="flex items-center">
              {/* Removed Lock icon */}
              <span className="text-lg font-medium">{t('changePasswordOption')}</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">&gt;</span>
          </li>
          {/* Change Language */}
          <li
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            onClick={() => handleSettingClick('/selector')}
          >
            <div className="flex items-center">
              {/* Removed Globe icon */}
              <span className="text-lg font-medium">{t('changeLanguageOption')}</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">&gt;</span>
          </li>
          {/* Choose Avatar (Placeholder) */}
          <li
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            onClick={() => alert(t('chooseAvatarPlaceholder'))}
          >
            <div className="flex items-center">
              {/* Removed Image icon */}
              <span className="text-lg font-medium">{t('chooseAvatarOption')}</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">&gt;</span>
          </li>
          {/* Customer Service */}
          <li
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            onClick={() => handleSettingClick('/chat')}
          >
            <div className="flex items-center">
              {/* Removed LifeBuoy icon */}
              <span className="text-lg font-medium">{t('customerServiceOption')}</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">&gt;</span>
          </li>
          {/* About Us */}
          <li
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            onClick={() => alert(t('aboutUsText'))}
          >
            <div className="flex items-center">
              {/* Removed Info icon */}
              <span className="text-lg font-medium">{t('aboutUsHeading')}</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">&gt;</span>
          </li>
        </ul>
      </section>

      {/* Shopify Logo and Logout */}
      <div className="flex flex-col items-center justify-center p-4">
        <img src={shopifyLogo} alt="Shopify Logo" className="w-32 h-auto mb-4" />
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-full shadow-lg hover:bg-red-700 transition-colors duration-200"
        >
          {t('logoutButton')}
        </button>
      </div>
    </div>
  );
}
