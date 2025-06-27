// components/AccountPage.js
import React, { useState } from 'react';
import '../AccountPage.css'; // Optional: for styling

export default function AccountPage({ onLogout }) {
  const [user, setUser] = useState({
    name: 'Haimanot Hailu',
    email: 'haimi@example.com',
    phone: '+251912345678',
    vipLevel: 'Gold',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState(user);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setUser(editValues);
    setIsEditing(false);
    // TODO: Call API to save changes
  };

  const handleCancel = () => {
    setEditValues(user);
    setIsEditing(false);
  };

  return (
    <div className="account-page">
      <h2>My Account</h2>

      <div className="account-section">
        <label>Name:</label>
        {isEditing ? (
          <input name="name" value={editValues.name} onChange={handleChange} />
        ) : (
          <p>{user.name}</p>
        )}
      </div>

      <div className="account-section">
        <label>Email:</label>
        <p>{user.email}</p> {/* Email not editable */}
      </div>

      <div className="account-section">
        <label>Phone:</label>
        {isEditing ? (
          <input name="phone" value={editValues.phone} onChange={handleChange} />
        ) : (
          <p>{user.phone}</p>
        )}
      </div>

      <div className="account-section">
        <label>VIP Level:</label>
        <p>{user.vipLevel}</p>
      </div>

      <div className="account-actions">
        {isEditing ? (
          <>
            <button onClick={handleSave}>💾 Save</button>
            <button onClick={handleCancel}>❌ Cancel</button>
          </>
        ) : (
          <button onClick={() => setIsEditing(true)}>✏️ Edit Profile</button>
        )}
      </div>

      <hr />

      <div className="account-referrals">
        <h3>My Referrals</h3>
        <ul>
          <li>Lucy Kebede (lucy@example.com)</li>
          <li>Dawit Teshome (dawit@example.com)</li>
        </ul>
      </div>

      <button className="logout-btn" onClick={onLogout}>🚪 Logout</button>
    </div>
  );
}
