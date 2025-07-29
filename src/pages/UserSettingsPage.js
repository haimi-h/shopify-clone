import React, { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { LanguageContext } from "./LanguageProvider"; // Assuming LanguageProvider is in the same directory or adjust path
import LanguageSelector from "./LanguageProvider"; // Assuming LanguageSelector is default export from LanguageProvider
import shopifyLogo from "../shopify-logo.png"; // Adjust path as needed
import "../UserSettingsPage.css"; // Import the custom CSS file

// Define your API base URL
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

export default function UserSettingsPage() {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext); // Consume the translation function from context

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
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
      setError(t("failedToLoadProfile")); // Translated error message
      // If unauthorized, clear token and redirect to login
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
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
      <div className="loading-message-container">
        {" "}
        {/* Custom class */}
        <p>{t("loadingText")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message-container">
        {" "}
        {/* Custom class */}
        <p>{error}</p>
        <button
          onClick={fetchUserProfile}
          className="retry-button" /* Custom class */
        >
          {t("retryButton")}
        </button>
      </div>
    );
  }

  return (
    <div className="user-settings-page-container">
      {" "}
      {/* Custom class */}
      {/* Top Right Language Selector */}
      <div className="language-selector-position">
        {" "}
        {/* Custom class */}
        <LanguageSelector />
      </div>
      {/* Header Section */}
      <header className="user-settings-header">
        {user && (
          <>
            <h1 className="user-name-heading">{user.username}</h1>{" "}
            {/* Custom class */}
            <p className="user-phone-text">{user.phone}</p> {/* Custom class */}
            <div className="balance-display">
              {" "}
              {/* Custom class */}
              <span className="balance-amount">
                {user.wallet_balance
                  ? parseFloat(user.wallet_balance).toFixed(2)
                  : "0.00"}
              </span>{" "}
              {/* Custom class */}
              <span className="currency-symbol">
                {t("currencySymbol")}
              </span>{" "}
              {/* Custom class */}
              <button
                onClick={() => handleSettingClick("/recharge")}
                className="add-funds-button" /* Custom class */
                title={t("addFundsButton")}
              >
                +
              </button>
            </div>
          </>
        )}
      </header>
      {/* Settings Options List */}
      <section className="settings-options-list">
        {" "}
        {/* Custom class */}
        <ul>
          {/* Withdraw */}
          <li onClick={() => handleSettingClick("/withdraw")}>
            <div className="settings-item-content">
              <span className="settings-item-text">{t("withdrawOption")}</span>
            </div>
            <span className="settings-item-arrow">&gt;</span>
          </li>
          {/* Change Password */}
          <li onClick={() => handleSettingClick("/change-password")}>
            {" "}
            {/* <-- Change this path */}
            <div className="settings-item-content">
              <span className="settings-item-text">
                {t("changePasswordOption")}
              </span>
            </div>
            <span className="settings-item-arrow">&gt;</span>
          </li>
          {/* Change Language */}
          <li onClick={() => handleSettingClick("/selector")}>
            <div className="settings-item-content">
              <span className="settings-item-text">
                {t("changeLanguageOption")}
              </span>
            </div>
            <span className="settings-item-arrow">&gt;</span>
          </li>
          {/* Choose Avatar (Placeholder) */}
          <li>
            <div className="settings-item-content">
              {/* Display the label and the address itself */}
              <span className="settings-item-text">
                {t("rechargeWalletAddressLabel")}
                {user && user.walletAddress ? (
                  <span className="recharge-address-text">
                    {user.walletAddress}
                  </span>
                ) : (
                  <span className="recharge-address-text">
                    {t("notAvailable")}
                  </span>
                )}
              </span>
            </div>
            {/* Add a button to copy the address to the clipboard */}
            {user && user.walletAddress && (
              <button
                onClick={() =>
                  navigator.clipboard.writeText(user.walletAddress)
                }
                className="copy-button"
                title="Copy Address"
              >
                📋
              </button>
            )}
          </li>
          {/* Customer Service */}
          <li onClick={() => handleSettingClick("/chat")}>
            <div className="settings-item-content">
              <span className="settings-item-text">
                {t("customerServiceOption")}
              </span>
            </div>
            <span className="settings-item-arrow">&gt;</span>
          </li>
          {/* About Us */}
          <li onClick={() => console.log(t("aboutUsText"))}>
            <div className="settings-item-content">
              <span className="settings-item-text">{t("aboutUsHeading")}</span>
            </div>
            <span className="settings-item-arrow">&gt;</span>
          </li>
        </ul>
      </section>
      {/* Shopify Logo and Logout */}
      <div className="user-settings-footer-section">
        <img
          src={shopifyLogo}
          alt="Shopify Logo"
          className="shopify-logo-img"
        />
        <button onClick={handleLogout} className="logout-button">
          {t("logoutButton")}
        </button>
      </div>
    </div>
  );
}
