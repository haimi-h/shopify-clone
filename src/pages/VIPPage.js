import React, { useState } from 'react';
import '../VIPPage.css';

const vipLevels = [
  { level: 'VIP1', investment: 0, profit: 0.55, transactions: 40 },
  { level: 'VIP2', investment: 100, profit: 1.0, transactions: 50 },
  { level: 'VIP3', investment: 500, profit: 1.5, transactions: 60 },
];

export default function VIPPage() {
  const [active, setActive] = useState('VIP1');

  const selected = vipLevels.find(v => v.level === active);

  return (
    <div className="vip-container">
      <div className="vip-tabs">
        {vipLevels.map(v => (
          <button
            key={v.level}
            onClick={() => setActive(v.level)}
            className={`vip-tab ${active === v.level ? 'active' : ''}`}
          >
            {v.level}
          </button>
        ))}
      </div>

      <div className="vip-card">
        <div className="vip-header">
          <div className="vip-icon">V</div>
          <div className="vip-title">{selected.level}</div>
          <div className="vip-amount">${selected.investment.toFixed(2)}</div>
        </div>
        <div className="vip-details">
          Required investment ${selected.investment.toFixed(2)} <br />
          Profit {selected.profit}% | {selected.transactions} Transactions
        </div>
      </div>

      <button className="go-button"> GO!</button>

      <div className="vip-footer">
        <img src="https://upload.wikimedia.org/wikipedia/commons/8/80/Black_triangle_icon.png" alt="i3 logo" />
        <span>i3 mobile solutions</span>
      </div>
    </div>
  );
}
