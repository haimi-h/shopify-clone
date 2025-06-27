import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../RecordsPage.css';

const RecordsPage = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="records-container">
      <div className="record-buttons">
        <button className="record-button" onClick={() => handleNavigation('/recharge-record')}>
          🧾 Recharge record
        </button>
        <button className="record-button" onClick={() => handleNavigation('/withdrawal-record')}>
          💸 Withdrawal record
        </button>
      </div>

      <div className="info-links">
        <p onClick={() => handleNavigation('/about')}>About Us</p>
        <p onClick={() => handleNavigation('/incidents')}>Latest incident</p>
        <p onClick={() => handleNavigation('/terms')}>T&C</p>
        <p onClick={() => handleNavigation('/faq')}>FAQ</p>
      </div>

      <div className="customer-service">
        <h3>Exclusive customer service</h3>
        <div className="avatar-placeholder">🧑‍💼</div>
        <p className="service-time">00:00 - 00:00</p>
        <p className="note">
          Please contact the agent customer service for inquiries related to the enlistment.
        </p>
        <button className="chat-button" onClick={() => alert('Launching chat...')}>
          💬 Chat with Support
        </button>
      </div>
    </div>
  );
};

export default RecordsPage;
