import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { LanguageContext } from "./LanguageProvider";
import LanguageSelector from "./LanguageProvider"; // This is the globe-icon version
import LanguageOptionsModal from '../components/LanguageOptionsModal'; // NEW: Import the modal-only version
import shopifyLogo from "../shopify-logo.png";
import "../UserSettingsPage.css"; // Import the custom CSS file

// Define your API base URL
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

export default function UserSettingsPage() {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false); // State to control the LanguageOptionsModal visibility

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
      setError(t("failedToLoadProfile"));
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
  const handleSettingClick = (path, type) => {
    // If it's the "change language" option, open the modal instead of navigating
    if (type === 'changeLanguage') {
      setShowLanguageOptions(true); // Open the language selection modal directly
    } else {
      setShowLanguageOptions(false); // Ensure modal is closed if another option is clicked
      navigate(path);
    }
  };

  if (loading) {
    return (
      <div className="loading-message-container">
        <p>{t("loadingText")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message-container">
        <p>{error}</p>
        <button
          onClick={fetchUserProfile}
          className="retry-button"
        >
          {t("retryButton")}
        </button>
      </div>
    );
  }

  return (
    <div className="user-settings-page-container">
      {/* NO GLOBE ICON here for UserSettingsPage. Instead, the LanguageOptionsModal is rendered conditionally. */}
      {/* The LanguageOptionsModal is controlled by showLanguageOptions state */}
      <LanguageOptionsModal isOpen={showLanguageOptions} setIsOpen={setShowLanguageOptions} />


      {/* Header Section */}
      <header className="user-settings-header">
        {user && (
          <>
            <h1 className="user-name-heading">{user.username}</h1>
            <p className="user-phone-text">{user.phone}</p>
            <div className="balance-display">
              <span className="balance-amount">
                {user.wallet_balance
                  ? parseFloat(user.wallet_balance).toFixed(2)
                  : "0.00"}
              </span>
              <span className="currency-symbol">
                {t("currencySymbol")}
              </span>
              <button
                onClick={() => handleSettingClick("/recharge")}
                className="add-funds-button"
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
            <div className="settings-item-content">
              <span className="settings-item-text">
                {t("changePasswordOption")}
              </span>
            </div>
            <span className="settings-item-arrow">&gt;</span>
          </li>
          {/* Change Language - MODIFIED to open the specific modal */}
          <li onClick={() => handleSettingClick(null, 'changeLanguage')}>
            <div className="settings-item-content">
              <span className="settings-item-text">
                {t("changeLanguageOption")}
              </span>
            </div>
            <span className="settings-item-arrow">&gt;</span>
          </li>
          {/* Recharge Wallet Address (or whatever this setting is) */}
          <li>
            <div className="settings-item-content">
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