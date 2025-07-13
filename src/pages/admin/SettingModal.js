import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Modal.css'; // Common CSS for modals

const API_BASE_URL = 'http://localhost:5000/api/admin/users'; // Backend endpoint for user updates

function SettingModal({ user, onClose, onSave }) {
    const [formData, setFormData] = useState({
        username: user.username || '',
        phone: user.phone || '',
        wallet_balance: user.wallet_balance || '', // Assuming wallet_balance is the wallet address
        new_password: '', // For changing password
        confirm_password: '' // For confirming new password
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Update form data if the user prop changes (e.g., when opening for a different user)
        setFormData({
            username: user.username || '',
            phone: user.phone || '',
            wallet_balance: user.wallet_balance || '',
            new_password: '',
            confirm_password: ''
        });
        setMessage('');
        setError('');
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (formData.new_password && formData.new_password !== formData.confirm_password) {
            setError("New password and confirm password do not match.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required. Please log in.');
                return;
            }

            const updateData = {
                username: formData.username,
                phone: formData.phone,
                wallet_balance: formData.wallet_balance,
            };

            if (formData.new_password) {
                updateData.password = formData.new_password; // Add password only if provided
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };

            // Send update request to backend
            const response = await axios.put(`${API_BASE_URL}/settings/${user.id}`, updateData, config);
            setMessage(response.data.message || 'Settings updated successfully!');
            onSave(); // Call parent's onSave to re-fetch user list
        } catch (err) {
            console.error("Error updating user settings:", err);
            setError(err.response?.data?.message || 'Failed to update settings.');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Settings for {user.username} (ID: {user.id})</h3>
                {message && <p className="info-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username:</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Phone Number:</label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Wallet Address:</label>
                        <input type="text" name="wallet_balance" value={formData.wallet_balance} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>New Password (optional):</label>
                        <input type="password" name="new_password" value={formData.new_password} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password:</label>
                        <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} />
                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="modal-button confirm-button">Save Changes</button>
                        <button type="button" onClick={onClose} className="modal-button cancel-button">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SettingModal;
