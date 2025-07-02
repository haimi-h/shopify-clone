import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VIPSettings() {
  const [vipLevels, setVipLevels] = useState([
    { level: 1, investment: 0, profit: 0.55, transactions: 40 },
    { level: 2, investment: 100, profit: 1.0, transactions: 50 },
    { level: 3, investment: 500, profit: 1.5, transactions: 60 },
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('vipLevels');
    if (saved) {
      setVipLevels(JSON.parse(saved));
    }
  }, []);

  const handleChange = (index, field, value) => {
    const updated = [...vipLevels];
    if(field === 'level') {
      updated[index][field] = parseInt(value, 10);
    } else if(field === 'transactions') {
      updated[index][field] = parseInt(value, 10);
    } else {
      updated[index][field] = parseFloat(value);
    }
    setVipLevels(updated);
  };

  const handleSave = () => {
    localStorage.setItem('vipLevels', JSON.stringify(vipLevels));
    alert('VIP settings saved successfully!');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '700px', margin: 'auto' }}>
      <h2>VIP Settings</h2>

      <button onClick={handleBack} style={{ marginBottom: '1rem' }}>
        &larr; Back
      </button>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>Level</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>Investment ($)</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>Profit (%)</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>Transactions</th>
          </tr>
        </thead>
        <tbody>
          {vipLevels.map((vip, i) => (
            <tr key={i}>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{vip.level}</td>

              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                <input
                  type="number"
                  min="0"
                  value={vip.investment}
                  onChange={(e) => handleChange(i, 'investment', e.target.value)}
                />
              </td>

              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={vip.profit}
                  onChange={(e) => handleChange(i, 'profit', e.target.value)}
                />
              </td>

              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                <input
                  type="number"
                  min="0"
                  value={vip.transactions}
                  onChange={(e) => handleChange(i, 'transactions', e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleSave} style={{ marginTop: '1rem' }}>
        Save Changes
      </button>
    </div>
  );
}
