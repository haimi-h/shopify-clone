import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { LanguageContext } from "./LanguageProvider";
import LanguageSelector from "./LanguageProvider"; // This imports the default export, which is LanguageSelector
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
  const [showLanguageModal, setShowLanguageModal] = useState(false); // New state to control LanguageSelector modal visibility

  // Ref to detect clicks outside the language options modal
  const languageModalRef = useRef(null); // Attach this to the LanguageSelector component's container

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

  // Click outside handler for language options modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the modal content itself, but not on the list item that opens it
      // For this, we need the LanguageSelector's internal ref or a containing div.
      // Since LanguageSelector is a default export, it doesn't expose its internal ref easily.
      // We'll attach the ref to the div that renders LanguageSelector.
      if (languageModalRef.current && !languageModalRef.current.contains(event.target)) {
        // Prevent closing if the click originated from the "Change Language" list item itself
        // This requires checking the event.target's parents, which can be tricky.
        // A simpler approach is to only close if it's already open and the click is clearly outside.
        setShowLanguageModal(false);
      }
    };

    if (showLanguageModal) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLanguageModal]);


  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Function to handle navigation to different setting sections
  const handleSettingClick = (path, type) => {
    // If it's the "change language" option, open the modal instead of navigating
    if (type === 'changeLanguage') {
      setShowLanguageModal(true); // Open the language selection modal
    } else {
      setShowLanguageModal(false); // Ensure modal is closed if another option is clicked
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
          className="retry-button" /* Custom class */
        >
          {t("retryButton")}
        </button>
      </div>
    );
  }

  return (
    <div className="user-settings-page-container">
      {/* Top Right Language Selector - Now conditionally rendered and controlled */}
      {/* The LanguageSelector component is now rendered here and its visibility managed by showLanguageModal */}
      {/* We need to pass the isOpen and setIsOpen props */}
      <div className="language-selector-position" ref={languageModalRef}>
         <LanguageSelector isOpen={showLanguageModal} setIsOpen={setShowLanguageModal} />
      </div>


      {/* Header Section */}
      <header className="user-settings-header">
        {user && (
          <>
            <h1 className="user-name-heading">{user.username}</h1>{" "}
            <p className="user-phone-text">{user.phone}</p> {/* Custom class */}
            <div className="balance-display">
              <span className="balance-amount">
                {user.wallet_balance
                  ? parseFloat(user.wallet_balance).toFixed(2)
                  : "0.00"}
              </span>{" "}
              <span className="currency-symbol">
                {t("currencySymbol")}
              </span>{" "}
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
          {/* Change Language - MODIFIED to open modal */}
          <li onClick={() => handleSettingClick(null, 'changeLanguage')}> {/* Pass a type */}
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