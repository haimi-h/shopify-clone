import React, { useState, useEffect } from 'react';

export default function ReferralCodes() {
  const [codes, setCodes] = useState([]);
  const [newCode, setNewCode] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('referralCodes');
    if (saved) {
      setCodes(JSON.parse(saved));
    }
  }, []);

  const addCode = () => {
    if (!newCode.trim()) return alert('Enter a referral code');
    if (codes.includes(newCode.trim())) return alert('Code already exists');
    
    const updated = [...codes, newCode.trim()];
    setCodes(updated);
    localStorage.setItem('referralCodes', JSON.stringify(updated));
    setNewCode('');
  };

  const deleteCode = (code) => {
    if (!window.confirm(`Delete referral code "${code}"?`)) return;
    const updated = codes.filter(c => c !== code);
    setCodes(updated);
    localStorage.setItem('referralCodes', JSON.stringify(updated));
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Referral Codes</h2>

      <div>
        <input
          type="text"
          placeholder="New referral code"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          style={{ marginRight: '8px' }}
        />
        <button onClick={addCode}>Add Code</button>
      </div>

      {codes.length === 0 ? (
        <p>No referral codes found.</p>
      ) : (
        <ul style={{ marginTop: '1rem' }}>
          {codes.map(code => (
            <li key={code} style={{ marginBottom: '6px' }}>
              {code}{' '}
              <button onClick={() => deleteCode(code)} style={{ color: 'red' }}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
