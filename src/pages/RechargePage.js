import React, { useState } from 'react';
import '../RechargePage.css';

const RechargePage = () => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('USDT');
  const [message, setMessage] = useState('');

  const quickAmounts = [300, 500, 1000, 3000, 5000, 10000];

  const handleRecharge = () => {
    const numericAmount = parseFloat(amount);

    if (!numericAmount || numericAmount < 7 || numericAmount > 7777777) {
      setMessage('❌ Please enter a valid amount between $7 and $7,777,777.');
      return;
    }

    // Simulated payment logic
    setMessage(`✅ Recharge of $${numericAmount} via ${paymentMethod} initiated successfully!`);
    // Here you can integrate API call or backend trigger
  };

  return (
    <div className="recharge-container">
      <div className="recharge-header">
        <button className="back-button" onClick={() => alert('Go Back')}>←</button>
        <div className="icons">
          <span className="home-icon" onClick={() => alert('Home clicked')}>🏠</span>
          <span className="grid-icon">🔳</span>
          <span className="notif-icon">🔔</span>
        </div>
      </div>

      <h2>Recharge Amount</h2>

      <input
        type="number"
        className="recharge-input"
        value={amount}
        placeholder="00.00"
        onChange={(e) => setAmount(e.target.value)}
      />

      <div className="amount-options">
        {quickAmounts.map((amt) => (
          <button key={amt} onClick={() => setAmount(amt)}>{amt.toFixed(2)}</button>
        ))}
      </div>

      <p className="select-method">Please select payment method</p>

      <div className="payment-box">
        <button className="recharge-button" onClick={handleRecharge}>Recharge</button>
        <p>{paymentMethod}</p>
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
