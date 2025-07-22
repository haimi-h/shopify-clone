import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../RechargePage.css'; // Make sure you have this CSS file

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const RechargePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requiredAmount } = location.state || {};

  const [amount, setAmount] = useState(requiredAmount ? String(requiredAmount) : '');
  
  // NOTE: For now, we'll hardcode to 'TRX' to match our backend monitor.
  // When you implement USDT checks, you can change this back to 'USDT'.
  const [paymentMethod] = useState('TRX'); 
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // NEW STATE: To hold the deposit information from the backend
  const [depositInfo, setDepositInfo] = useState(null);

  const quickAmounts = [300, 500, 1000, 3000, 5000, 10000];

  useEffect(() => {
    if (requiredAmount) {
      setAmount(String(requiredAmount));
    }
  }, [requiredAmount]);

  const handleRecharge = async () => {
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount < 7) {
      setMessage('❌ Please enter a valid amount (minimum 7).');
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
      
      // Call our new backend endpoint
      const response = await axios.post(`${API_BASE_URL}/payment/recharge`, {
        amount: numericAmount,
        paymentMethod: paymentMethod,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Instead of just a message, we now set the deposit info object
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

  // Render the deposit instructions if we have them, otherwise render the form
  if (depositInfo) {
    return (
      <div className="recharge-container">
        <h3>Complete Your Deposit</h3>
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
            Your account will be credited automatically after the transaction is confirmed on the network.
          </p>
          <button className="back-button" onClick={() => setDepositInfo(null)}>
            Make another recharge
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recharge-container">
      {/* ... your existing header ... */}
      <h2>Recharge Amount ({paymentMethod})</h2>
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
          <button key={amt} onClick={() => setAmount(String(amt))}>{amt.toFixed(2)}</button>
        ))}
      </div>
      <div className="payment-box">
        <button className="recharge-button" onClick={handleRecharge} disabled={loading}>
          {loading ? 'Processing...' : 'Proceed to Deposit'}
        </button>
      </div>
      {message && <p className="recharge-message">{message}</p>}
      <div className="recharge-footer">
        <p>* The payment amount must be the same as the order amount, otherwise it will not arrive automatically</p>
        <p>* If you do not receive recharge and withdrawal, please consult your supervisor to solve other problems.</p>
      </div>
    </div>
  );
};

export default RechargePage;