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
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    setMessage(''); // Clear previous messages
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // If there's no token, redirect to login. This is a safeguard.
        navigate('/login');
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.post(
        `${API_BASE_URL}/recharge/submit`,
        { amount: numericAmount, currency: 'USDT' }, // Assuming USDT as default currency
        config
      );

      // Check if the token still exists after the API call, right before navigation
      const tokenAfterRecharge = localStorage.getItem('token');
      if (!tokenAfterRecharge) {
          // If the token is gone, it was likely an API-side issue.
          console.error("User token was cleared after recharge submission.");
          setMessage("Your session has expired. Please log in again.");
          // We can navigate to login or just show the message.
          navigate('/login');
          return;
      }


      setMessage(response.data.message + " Please use the chat widget on the dashboard for further assistance and to provide your receipt.");

      // Navigate to the dashboard with state to auto-open the chat widget.
      navigate('/dashboard', { 
          state: { 
              openChat: true, 
              initialChatMessage: `I have submitted a recharge request for $${numericAmount}.` 
          } 
      });


    } catch (error) {
      console.error('Recharge submission error:', error);
      
      let errorMessage = '❌ Failed to submit recharge request.';
      if (error.response?.status === 401 || error.response?.status === 403) {
          errorMessage = 'Your session has expired. Please log in again.';
          // Redirect to login if unauthorized
          navigate('/login');
      } else {
          errorMessage = error.response?.data?.message || errorMessage;
      }

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recharge-page">
      <div className="header-nav">
        <div className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </div>
        <div className="page-title">Recharge</div>
        <div className="home-button">
          <span onClick={() => navigate('/dashboard')}>🏠</span>
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
        <p>* If you do not have a wallet address yet, one will be assigned to you via chat.</p>
      </div>
    </div>
  );
};

export default RechargePage;