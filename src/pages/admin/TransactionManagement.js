import React, { useState, useEffect } from 'react';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('transactions');
    if (saved) {
      setTransactions(JSON.parse(saved));
    } else {
      // Mock data if none exist
      const mock = [
        { id: 1, user: 'Alice', amount: 150, status: 'Pending' },
        { id: 2, user: 'Bob', amount: 200, status: 'Completed' },
      ];
      setTransactions(mock);
      localStorage.setItem('transactions', JSON.stringify(mock));
    }
  }, []);

  const markCompleted = (id) => {
    const updated = transactions.map(t =>
      t.id === id ? { ...t, status: 'Completed' } : t
    );
    setTransactions(updated);
    localStorage.setItem('transactions', JSON.stringify(updated));
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Transactions</h2>
      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>ID</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>User</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Amount</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Status</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{t.id}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{t.user}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>${t.amount}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{t.status}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {t.status === 'Pending' && (
                    <button onClick={() => markCompleted(t.id)}>Mark Completed</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
