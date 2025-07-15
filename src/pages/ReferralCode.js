// src/components/ReferralComponent.js
import React, { useEffect, useState } from 'react';
import axios from 'axios'; // We'll use axios directly as discussed, for now
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const ReferralCode = () => {
    const navigate = useNavigate(); // Initialize navigate hook

    const [invitationCode, setInvitationCode] = useState('');
    const [referrals, setReferrals] = useState([]);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Change BASE_URL to match our Node.js backend
    // const API_BASE_URL = 'http://localhost:5000/api'; // Our backend is at port 5000
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login'); // Redirect to login if no token
                    return;
                }

                // 1. Fetch user profile (to get invitation_code)
                // We'll need a new backend endpoint for this or include in login response
                // For now, let's assume invitation_code comes from a /user/profile endpoint
                const profileResponse = await axios.get(`${API_BASE_URL}/users/profile`, { // New proposed endpoint
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                });

                // Assuming your backend sends invitation_code directly in profile data
                setInvitationCode(profileResponse.data.user.invitation_code);


                // 2. Fetch user's referrals
                const referralResponse = await axios.get(`${API_BASE_URL}/users/my-referrals`, { // New proposed endpoint
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                });

                setReferrals(referralResponse.data.referrals); // Assuming backend returns { referrals: [...] }

            } catch (err) {
                console.error('Error fetching referral data:', err);
                setError(err.response?.data?.message || 'Failed to load referral data.');
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login'); // Redirect to login on auth error
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]); // Add navigate to dependency array

    const handleCopy = () => {
        navigator.clipboard.writeText(invitationCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            setError('Failed to copy code.');
        });
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>🎉 Invite Friends</h2>

            <div style={styles.box}>
                <p>Your Referral Code:</p>
                <div style={styles.row}>
                    <input
                        type="text"
                        value={invitationCode}
                        readOnly
                        style={styles.input}
                    />
                    <button onClick={handleCopy} style={styles.button}>
                        {copied ? '✅ Copied' : 'Copy'}
                    </button>
                </div>
                <p style={styles.linkText}>
                    Referral Link: <br />
                    {/* Assuming your frontend domain is shopify-clone-orpin.vercel.app as seen in screenshots */}
                    <span style={styles.refLink}>https://shopify-clone-orpin.vercel.app/register?ref={invitationCode}</span>
                </p>
            </div>

            <div>
                <h3>👥 Your Referrals</h3>
                {referrals.length === 0 ? (
                    <p>No referrals yet.</p>
                ) : (
                    <ul>
                        {referrals.map(ref => (
                            <li key={ref.id} style={styles.listItem}>
                                <strong>{ref.username}</strong> — {ref.phone} <br /> {/* Assuming 'phone' from backend */}
                                Joined: {new Date(ref.created_at).toLocaleDateString()}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: 600,
        margin: '2rem auto',
        padding: '1.5rem',
        border: '1px solid #ccc',
        borderRadius: 12,
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#fefefe',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
    header: {
        textAlign: 'center',
        color: '#333',
        marginBottom: '1.5rem',
    },
    box: {
        marginBottom: '2rem',
        padding: '1.5rem',
        background: '#f9f9f9',
        borderRadius: 8,
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
    },
    row: {
        display: 'flex',
        gap: '0.8rem',
        marginTop: '0.8rem',
    },
    input: {
        flex: 1,
        padding: '0.6rem',
        fontSize: '1rem',
        border: '1px solid #ddd',
        borderRadius: 6,
        backgroundColor: '#fff',
    },
    button: {
        padding: '0.6rem 1.2rem',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'background-color 0.3s ease',
        '&:hover': {
            backgroundColor: '#0056b3',
        },
    },
    linkText: {
        marginTop: '1rem',
        fontSize: '0.9rem',
        color: '#555',
    },
    refLink: {
        fontWeight: 'bold',
        color: '#007bff',
        wordBreak: 'break-all',
    },
    listItem: {
        marginBottom: '1rem',
        borderBottom: '1px solid #eee',
        paddingBottom: '0.8rem',
        fontSize: '0.95rem',
        color: '#444',
    },
};

export default ReferralCode;