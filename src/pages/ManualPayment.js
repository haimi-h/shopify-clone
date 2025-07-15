import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios'; // Import axios for API calls

// const API_BASE_URL = 'http://localhost:5000/api'; // Your backend API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

function ManualPayment() {
  const [paymentAddress, setPaymentAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrCreatePaymentAddress = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in.');
          setLoading(false);
          // Optionally redirect to login page if not authenticated
          // navigate('/login');
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        // Call the backend endpoint that generates/retrieves the user's unique wallet address
        const response = await axios.get(`${API_BASE_URL}/payment/generate-address`, config);
        const data = response.data;

        if (data.address) {
          setPaymentAddress(data.address);
        } else {
          setError('Could not retrieve or generate payment address.');
        }
      } catch (err) {
        console.error('Error fetching or generating payment address:', err);
        setError(err.response?.data?.error || 'Server connection error. Failed to get payment address.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreatePaymentAddress();
  }, []); // Empty dependency array means this runs once on component mount

  return (
    <div className="manual-payment-container">
      <h2>Your Deposit Address</h2>
      {loading ? (
        <p>Loading or generating your unique deposit address...</p>
      ) : paymentAddress ? (
        <div className="payment-details">
          <p>Please send your payment (TRX or USDT TRC20) to your unique address:</p>
          <div className="address-display">
            <strong>{paymentAddress}</strong>
            {/* Optional: Add a copy to clipboard button */}
            <button
              className="copy-button"
              onClick={() => {
                // Using document.execCommand('copy') for broader iframe compatibility
                const el = document.createElement('textarea');
                el.value = paymentAddress;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                alert('Address copied to clipboard!'); // Simple alert for confirmation
              }}
            >
              Copy
            </button>
          </div>
          <div style={{ marginTop: '20px' }}>
            <QRCodeCanvas value={paymentAddress} size={256} level="H" />
          </div>
          <p style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>
            Ensure you send funds on the **Tron (TRX) network** or **USDT (TRC20)**. Sending other coins or tokens to this address may result in loss of funds.
          </p>
        </div>
      ) : (
        <p style={{ color: 'red' }}>{error}</p>
      )}
    </div>
  );
}

export default ManualPayment;
