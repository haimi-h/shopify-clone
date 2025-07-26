import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../RechargePage.css'; // Make sure this CSS file exists and is styled

// Define your API base URL using environment variable
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const RechargePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { requiredAmount } = location.state || {};

  const [amount, setAmount] = useState(requiredAmount ? String(requiredAmount) : '');
  // Removed: receiptImageUrl and whatsappNumber states
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  // depositInfo is no longer relevant for this flow, so it can be removed or ignored.

  const quickAmounts = [300, 500, 1000, 3000, 5000, 10000];

  useEffect(() => {
    if (requiredAmount) {
      setAmount(String(requiredAmount));
    }
  }, [requiredAmount]);

  const handleRecharge = async () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 7) {
      setMessage('❌ Please enter a valid amount (minimum $7).');
      return;
    }
    // Removed validation for receiptImageUrl and whatsappNumber

    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Submit only amount and currency
      const response = await axios.post(`${API_BASE_URL}/recharge/submit`, {
        amount: numericAmount,
        currency: 'USDT', // Assuming USDT for now, or make it dynamic if needed
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage(`✅ ${response.data.message}`);
      // Clear form field after successful submission
      setAmount('');

      // *** IMPORTANT: Redirect to chat after successful submission ***
      // Assuming your chat page route is '/chat'
      // Add a small delay so the user can see the success message before redirection
      setTimeout(() => {
        navigate('/chat'); // Redirect to the user's chat page
      }, 2000); // Redirect after 2 seconds

    } catch (error) {
      const errorMsg = error.response?.data?.message || 'An unexpected error occurred.';
      console.error('Recharge submission failed:', errorMsg);
      setMessage(`❌ Recharge failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recharge-container">
      <div className="recharge-header">
        <button className="back-button" onClick={() => navigate(-1)}>←</button>
        <div className="icons">
          <span className="home-icon" onClick={() => navigate('/dashboard')}>🏠</span>
        </div>
      </div>
      <h2>Submit Recharge Request (USD)</h2>
      <input
        type="number"
        className="recharge-input"
        value={amount}
        placeholder="00.00"
        onChange={(e) => setAmount(e.target.value)}
        min="7"
      />
      <div className="amount-options">
        {quickAmounts.map((amt) => (
          <button key={amt} onClick={() => setAmount(String(amt))}>${amt.toFixed(2)}</button>
        ))}
      </div>

      <p className="select-method">Proceed to Customer Support</p>
      <div className="payment-box">
        {/* Removed: Receipt Image URL and WhatsApp Number inputs */}
        <button className="recharge-button" onClick={handleRecharge} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Request & Go to Chat'}
        </button>
        <small>$7 ~ $7,777,777</small>
      </div>
      {message && (
        <div className="recharge-message">
          <p>{message}</p>
        </div>
      )}
      <div className="recharge-footer">
        <p>* Your request will be reviewed by an administrator via chat. Funds will be credited upon approval.</p>
        <p>* Please discuss payment details and provide receipts directly in the chat.</p>
        <p>* If you do not receive recharge and withdrawal, please consult your supervisor to solve other problems.</p>
      </div>
    </div>
  );
};

export default RechargePage;
