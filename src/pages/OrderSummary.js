// components/OrderSummary.js
import React from 'react'; // ✅ Required for JSX
import '../OrderSummary.css';

export default function OrderSummary({ order, onClose }) {
  if (!order) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        {/* Brand Logo */}
        <div className="popup-logo">
          {/* <img src="/logo512.png" alt="Brand Logo" /> */}
        </div>

        {/* Order Brand Logo */}
        <div className="popup-brand-logo">
          <img src={order.logo} alt={order.brand} />
        </div>

        {/* Order Details */}
        <div className="popup-details">
          <div className="popup-row">
            <span>Time to rush an order:</span>
            <span>{order.time}</span>
          </div>
          <div className="popup-row">
            <span>Order number:</span>
            <span>{order.id}</span>
          </div>
          <div className="popup-row">
            <span>Total order:</span>
            <span>{order.total}</span>
          </div>
          <div className="popup-row bold">
            <span>Profit:</span>
            <span>{order.profit}</span>
          </div>

          <button className="popup-submit-btn">SUBMIT ORDER</button>
        </div>

        {/* Close Button */}
        <button className="popup-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
}


