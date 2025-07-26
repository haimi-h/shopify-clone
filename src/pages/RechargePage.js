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
  const [receiptImageUrl, setReceiptImageUrl] = useState(''); // New state for receipt image URL
  const [whatsappNumber, setWhatsappNumber] = useState(''); // New state for WhatsApp number
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [depositInfo, setDepositInfo] = useState(null); // This might not be needed as much for manual approval

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
    if (!receiptImageUrl) {
      setMessage('❌ Please provide the URL of your payment receipt image.');
      return;
    }
    if (!whatsappNumber) {
      setMessage('❌ Please provide your WhatsApp number for communication.');
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

      // Instead of an automatic payment method, we now submit a manual request
      const response = await axios.post(`${API_BASE_URL}/recharge/submit`, {
        amount: numericAmount,
        currency: 'USDT', // Assuming USDT for now, or make it dynamic if needed
        receipt_image_url: receiptImageUrl,
        whatsapp_number: whatsappNumber,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage(`✅ ${response.data.message}`);
      // Clear form fields after successful submission
      setAmount('');
      setReceiptImageUrl('');
      setWhatsappNumber('');

      // Optionally, you might navigate the user to a "Recharge History" or "Pending Recharges" page
      // navigate('/user/recharge-history');

    } catch (error) {
      const errorMsg = error.response?.data?.message || 'An unexpected error occurred.';
      console.error('Recharge submission failed:', errorMsg);
      setMessage(`❌ Recharge failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // If depositInfo was used for automatic crypto payments, it might not be relevant here.
  // We'll remove the depositInfo display block as the flow is now manual approval.

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

      <p className="select-method">Payment Receipt & Contact</p>
      <div className="payment-box">
        <input
          type="text"
          className="recharge-input"
          value={receiptImageUrl}
          placeholder="Receipt Image URL (e.g., from Imgur, Cloudinary)"
          onChange={(e) => setReceiptImageUrl(e.target.value)}
        />
        <input
          type="text"
          className="recharge-input"
          value={whatsappNumber}
          placeholder="Your WhatsApp Number (e.g., +1234567890)"
          onChange={(e) => setWhatsappNumber(e.target.value)}
        />
        <button className="recharge-button" onClick={handleRecharge} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Recharge Request'}
        </button>
        <small>$7 ~ $7,777,777</small>
      </div>
      {message && (
        <div className="recharge-message">
          <p>{message}</p>
        </div>
      )}
      <div className="recharge-footer">
        <p>* After payment, please send the receipt image and your WhatsApp number here.</p>
        <p>* Your request will be reviewed by an administrator. Funds will be credited upon approval.</p>
        <p>* If you do not receive recharge and withdrawal, please consult your supervisor to solve other problems.</p>
      </div>
    </div>
  );
};

export default RechargePage;
