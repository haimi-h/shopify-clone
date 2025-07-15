// components/AccountPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../AccountPage.css'; // Optional: for styling
import axios from 'axios'; // <--- Import axios here

export default function AccountPage() {
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({});

    const [referrals, setReferrals] = useState([]); // State for referrals

    // Define your API base URL
    // const API_BASE_URL = 'http://localhost:5000/api'; // <--- Define API_BASE_URL here
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

    // --- Effect to load user data from localStorage and fetch referrals on mount ---
    useEffect(() => {
        const loadAndFetchData = async () => {
            const userString = localStorage.getItem('user');
            const token = localStorage.getItem('token'); // Get token for API calls

            if (!userString || !token) {
                console.error("User data or token missing, redirecting to login.");
                navigate('/login');
                return;
            }

            try {
                const user = JSON.parse(userString);
                setCurrentUser({
                    name: user.username || 'N/A',
                    email: user.email || 'haimi@example.com (Placeholder)', // You might fetch real email later
                    phone: user.phone || 'N/A',
                    vipLevel: user.vipLevel || 'Gold (Placeholder)', // You might fetch real VIP level later
                    id: user.id
                });
                setEditValues({
                    name: user.username || 'N/A',
                    phone: user.phone || 'N/A',
                });

                // --- Fetch user's referrals here ---
                try {
                    const referralResponse = await axios.get(`${API_BASE_URL}/users/my-referrals`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        },
                    });
                    setReferrals(referralResponse.data.referrals); // Assuming backend returns { referrals: [...] }
                } catch (referralErr) {
                    console.error('Error fetching referral data:', referralErr);
                    // Handle specific referral fetching errors if needed
                    setReferrals([]); // Ensure referrals is an empty array on error
                }

            } catch (e) {
                console.error("Error parsing user data from localStorage or data missing:", e);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                navigate('/login');
            }
        };

        loadAndFetchData();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditValues(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        // Only update local state for now
        setCurrentUser(prev => ({
            ...prev,
            name: editValues.name,
            phone: editValues.phone,
        }));
        setIsEditing(false);
        // TODO: Call API to save changes to backend (requires new backend endpoint)
        // const token = localStorage.getItem('token');
        // axios.put(`http://localhost:5000/api/users/${currentUser.id}`, {
        //     username: editValues.name, // Assuming name maps to username in backend
        //     phone: editValues.phone
        // }, {
        //     headers: { Authorization: `Bearer ${token}` }
        // }).then(res => {
        //     console.log("Profile updated on backend:", res.data);
        //     // Optionally update localStorage 'user' object if backend returns updated data
        // }).catch(err => {
        //     console.error("Failed to save profile:", err);
        //     // Revert local changes or show error
        // });
    };

    const handleCancel = () => {
        setEditValues({
            name: currentUser.name,
            phone: currentUser.phone,
        });
        setIsEditing(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!currentUser) {
        return (
            <div className="account-page">
                <h2>Loading Account...</h2>
            </div>
        );
    }

    return (
        <div className="account-page">
            <h2>My Account</h2>

            <div className="account-section">
                <label>Name:</label>
                {isEditing ? (
                    <input name="name" value={editValues.name} onChange={handleChange} />
                ) : (
                    <p>{currentUser.name}</p>
                )}
            </div>

            <div className="account-section">
                <label>Email:</label>
                <p>{currentUser.email}</p>
            </div>

            <div className="account-section">
                <label>Phone:</label>
                {isEditing ? (
                    <input name="phone" value={editValues.phone} onChange={handleChange} />
                ) : (
                    <p>{currentUser.phone}</p>
                )}
            </div>

            <div className="account-section">
                <label>VIP Level:</label>
                <p>{currentUser.vipLevel}</p>
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
                <h3>My Referrals ({referrals.length})</h3> {/* <--- Display referral count here */}
                {referrals.length > 0 ? (
                    <ul>
                        {referrals.map((referral) => ( // Use a unique key like referral.id if available
                            <li key={referral.id || referral.username}> {/* <--- Changed key for better practice */}
                                <strong>{referral.username}</strong> — {referral.phone} <br />
                                Joined: {new Date(referral.created_at).toLocaleDateString()}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No Referrals yet.</p>
                )}
            </div>

            <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
        </div>
    );
}