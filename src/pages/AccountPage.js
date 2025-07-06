// components/AccountPage.js
import React, { useState, useEffect } from 'react'; // Import useEffect
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import '../AccountPage.css'; // Optional: for styling
// import axios from 'axios'; // We'll need this for fetching referrals or full profile later

export default function AccountPage() { // Removed onLogout prop, handling internally
    const navigate = useNavigate();

    // Initialize user state from localStorage
    const [currentUser, setCurrentUser] = useState(null); // Will store data from localStorage
    const [isEditing, setIsEditing] = useState(false);
    // editValues will be initialized after currentUser is loaded
    const [editValues, setEditValues] = useState({});

    const [referrals, setReferrals] = useState([]); // State for referrals

    // --- Effect to load user data from localStorage on mount ---
    useEffect(() => {
        const loadUserData = () => {
            const userString = localStorage.getItem('user');
            if (userString) {
                try {
                    const user = JSON.parse(userString);
                    // Map backend user fields to your frontend's 'user' state structure
                    setCurrentUser({
                        name: user.username || 'N/A', // Use username for name
                        email: user.email || 'haimi@example.com (Placeholder)', // Email is not in localStorage yet
                        phone: user.phone || 'N/A', // Phone should be here if backend updated
                        vipLevel: user.vipLevel || 'Gold (Placeholder)', // VIP Level not in localStorage yet
                        id: user.id // Store ID for potential future API calls
                    });
                    setEditValues({ // Also initialize editValues
                        name: user.username || 'N/A',
                        phone: user.phone || 'N/A',
                    });

                    // TODO: Fetch real email, VIP Level, and Referrals if needed
                    // fetchUserFullProfile(user.id);
                    // fetchUserReferrals(user.id);

                } catch (e) {
                    console.error("Error parsing user data from localStorage or data missing:", e);
                    // If localStorage data is corrupted or missing, clear and redirect
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            } else {
                // No user found in localStorage, redirect to login
                navigate('/login');
            }
        };

        loadUserData();
    }, [navigate]); // navigate is a dependency of useEffect

    // Placeholder function for fetching full profile (requires backend API)
    // const fetchUserFullProfile = async (userId) => {
    //     try {
    //         const token = localStorage.getItem('token');
    //         const response = await axios.get(`http://localhost:5000/api/users/${userId}/profile`, {
    //             headers: { Authorization: `Bearer ${token}` }
    //         });
    //         // Update currentUser state with more detailed data
    //         setCurrentUser(prev => ({
    //             ...prev,
    //             email: response.data.email,
    //             vipLevel: response.data.vipLevel
    //         }));
    //     } catch (error) {
    //         console.error("Error fetching user full profile:", error);
    //     }
    // };

    // Placeholder function for fetching referrals (requires backend API)
    // const fetchUserReferrals = async (userId) => {
    //     try {
    //         const token = localStorage.getItem('token');
    //         const response = await axios.get(`http://localhost:5000/api/users/${userId}/referrals`, {
    //             headers: { Authorization: `Bearer ${token}` }
    //         });
    //         setReferrals(response.data.referrals);
    //     } catch (error) {
    //         console.error("Error fetching user referrals:", error);
    //     }
    // };


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
        // Reset edit values to current user's values
        setEditValues({
            name: currentUser.name,
            phone: currentUser.phone,
        });
        setIsEditing(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login'); // Redirect to login page
    };

    // Show loading or redirect if user data is not yet loaded
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
                {/* Email is hardcoded/placeholder as it's not in localStorage by default login response */}
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
                {/* VIP Level is hardcoded/placeholder as it's not in localStorage by default login response */}
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
                <h3>My Referrals</h3>
                {referrals.length > 0 ? (
                    <ul>
                        {referrals.map((referral, index) => (
                            <li key={index}>{referral.name} ({referral.email})</li>
                        ))}
                    </ul>
                ) : (
                    <p>No Referrals yet.</p>
                )}
                {/*
                    The current example referral list is hardcoded.
                    To display real referrals, you would need:
                    1. A backend endpoint (e.g., GET /api/users/:id/referrals) to fetch them.
                    2. An Axios call in useEffect here to retrieve them.
                */}
            </div>

            <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
        </div>
    );
}