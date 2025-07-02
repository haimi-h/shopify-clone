import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';  // <-- import useNavigate

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate(); // <-- initialize navigate

  useEffect(() => {
    const usersFromStorage = JSON.parse(localStorage.getItem('users')) || [];
    setUsers(usersFromStorage);
  }, []);

  const deleteUser = (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    const updatedUsers = users.filter(user => user.id !== id);
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>User Management</h2>

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)} // Go back one page in history
        style={{
          marginBottom: '1rem',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        &larr; Back
      </button>

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>ID</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Username</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Phone Number</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{user.id}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{user.username}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{user.phone_number}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  <button onClick={() => deleteUser(user.id)} style={{ color: 'red' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
