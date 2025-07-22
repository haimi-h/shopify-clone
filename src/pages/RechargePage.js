import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../RechargePage.css'; // Make sure this CSS file exists and is styled

// Define your API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const RechargePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get pre-filled amount from location state if available
  const { requiredAmount } = location.state || {};

  // STATE MANAGEMENT
  const [amount, setAmount] = useState(requiredAmount ? String(requiredAmount) : ''); // User input in USD
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [depositInfo, setDepositInfo] = useState(null); // Will hold the full response object from the backend

  const quickAmounts = [300, 500, 1000, 3000, 5000, 10000];

  useEffect(() => {
    if (requiredAmount) {
      setAmount(String(requiredAmount));
    }
  }, [requiredAmount]);

  // FUNCTION TO HANDLE RECHARGE INITIATION
  const handleRecharge = async () => {
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount < 7) {
      setMessage('❌ Please enter a valid amount (minimum $7).');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // The frontend sends the desired USD amount to the backend
      const response = await axios.post(`${API_BASE_URL}/payment/recharge`, {
        amount: numericAmount,
        paymentMethod: 'TRX', // The backend will handle the USD-to-TRX conversion
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Set the entire response object to state, which will trigger the view change
      setDepositInfo(response.data);

    } catch (error) {
      const errorMsg = error.response?.data?.message || 'An unexpected error occurred.';
      console.error('Recharge failed:', errorMsg);
      setMessage(`❌ Recharge failed: ${errorMsg}`);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER LOGIC ---

  // VIEW 1: Show these deposit instructions AFTER successfully initiating the recharge.
  if (depositInfo) {
    return (
      <div className="recharge-container">
        <div className="recharge-header">
            <button className="back-button" onClick={() => navigate(-1)}>←</button>
            <div className="icons">
              <span className="home-icon" onClick={() => navigate('/dashboard')}>🏠</span>
            </div>
        </div>

        <h3>Complete Your Recharge of ${depositInfo.originalUsdAmount.toFixed(2)}</h3>
        
        <div className="deposit-instructions">
          <p>Please send exactly:</p>
          <div className="deposit-amount">
            <strong>{depositInfo.amount} {depositInfo.currency}</strong>
          </div>

          <p>To the following address:</p>
          <div className="deposit-address-box">
            <p>{depositInfo.depositAddress}</p>
            <button onClick={() => navigator.clipboard.writeText(depositInfo.depositAddress)}>
              Copy Address
            </button>
          </div>

          <p className="warning">
            The TRX amount has been calculated based on the current exchange rate. You must send this exact amount for the transaction to be confirmed automatically.
          </p>
          
          <button className="recharge-button" onClick={() => setDepositInfo(null)}>
            Make Another Recharge
          </button>
        </div>
      </div>
    );
  }

  // VIEW 2: The default recharge form where the user enters a USD amount.
  return (
    <div className="recharge-container">
      <div className="recharge-header">
        <button className="back-button" onClick={() => navigate(-1)}>←</button>
        <div className="icons">
          <span className="home-icon" onClick={() => navigate('/dashboard')}>🏠</span>
        </div>
      </div>

      <h2>Recharge Amount (USD)</h2>

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

      <p className="select-method">Payment via TRX Network</p>

      <div className="payment-box">
        <button className="recharge-button" onClick={handleRecharge} disabled={loading}>
          {loading ? 'Processing...' : 'Proceed to Deposit'}
        </button>
        <small>$7 ~ $7,777,777</small>
      </div>

      {message && (
        <div className="recharge-message">
          <p>{message}</p>
        </div>
      )}

      <div className="recharge-footer">
        <p>* The payment amount must be the same as the order amount, otherwise it will not arrive automatically</p>
        <p>* If you do not receive recharge and withdrawal, please consult your supervisor to solve other problems.</p>
      </div>
    </div>
  );
};

export default RechargePage;