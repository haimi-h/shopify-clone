import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './WithdrawalPage.css'; // Make sure your CSS file is correctly linked

export default function WithdrawalPage() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1); // 1: Set Address, 2: Enter Amount
    const [balance, setBalance] = useState('0.00');
    const [savedWithdrawalAddress, setSavedWithdrawalAddress] = useState('');
    const [withdrawalAddress, setWithdrawalAddress] = useState('');
    const [currency, setCurrency] = useState('USDT'); // Default currency
    const [network, setNetwork] = useState('TRC20'); // Default network
    const [withdrawalPassword, setWithdrawalPassword] = useState('');
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Use REACT_APP_API_BASE_URL consistently
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

    const getToken = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return null;
        }
        return token;
    }, [navigate]);

    const fetchUserData = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        setError('');
        setMessage('');
        setLoading(true);

        try {
            // Changed from axios.post to axios.get for fetching user profile
            const response = await axios.get(`${API_BASE_URL}/users/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const userData = response.data.user; // Ensure your backend sends { user: {...} }
            
            // Check if wallet_balance exists before parsing
            if (userData && typeof userData.wallet_balance !== 'undefined') {
                setBalance(parseFloat(userData.wallet_balance).toFixed(2));
            } else {
                setBalance('0.00'); // Default if balance is missing
            }

            // Check for saved withdrawal address and set step accordingly
            if (userData && userData.withdrawal_wallet_address) {
                setSavedWithdrawalAddress(userData.withdrawal_wallet_address);
                setWithdrawalAddress(userData.withdrawal_wallet_address); // Pre-fill if saved
                setCurrentStep(2); // Go to step 2 if address is already set
            } else {
                setCurrentStep(1); // Stay on step 1 if no address
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
            setError(`Failed to load user data: ${err.response?.data?.message || err.message}`);
            if (err.response && err.response.status === 401) {
                navigate('/login'); // Redirect to login if token is invalid
            }
        } finally {
            setLoading(false);
        }
    }, [getToken, navigate, API_BASE_URL]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const handleSetWithdrawalAddress = async (e) => {
        e.preventDefault();
        const token = getToken();
        if (!token) return;

        if (!withdrawalAddress || !withdrawalPassword) {
            setError('Please fill in all fields.');
            return;
        }

        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/users/set-withdrawal-address`, {
                withdrawal_wallet_address: withdrawalAddress,
                currency,
                network,
                withdrawal_password: withdrawalPassword,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setMessage(response.data.message);
            setSavedWithdrawalAddress(withdrawalAddress); // Update saved address on success
            setCurrentStep(2); // Move to the next step
        } catch (err) {
            console.error("Set withdrawal address error:", err);
            setError(`Failed to set withdrawal address: ${err.response?.data?.message || err.message}`);
            if (err.response && err.response.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFinalWithdrawal = async (e) => {
        e.preventDefault();
        const token = getToken();
        if (!token) return;

        if (!withdrawalAmount || !withdrawalPassword) {
            setError('Please enter amount and withdrawal password.');
            return;
        }

        if (parseFloat(withdrawalAmount) <= 0 || parseFloat(withdrawalAmount) > parseFloat(balance)) {
            setError('Invalid withdrawal amount.');
            return;
        }

        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/users/withdraw`, {
                amount: parseFloat(withdrawalAmount),
                currency,
                network,
                withdrawal_password: withdrawalPassword,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setMessage(response.data.message);
            // After successful withdrawal, refetch user data to update balance
            await fetchUserData();
            setWithdrawalAmount(''); // Clear amount field
            setWithdrawalPassword(''); // Clear password field
        } catch (err) {
            console.error("Withdrawal error:", err);
            setError(`Withdrawal failed: ${err.response?.data?.message || err.message}`);
            if (err.response && err.response.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="withdrawal-page-container">
            <header className="withdrawal-header">
                <button onClick={() => navigate(-1)} className="back-button">←</button>
                <h1>Withdraw</h1>
            </header>

            <div className="current-balance">
                Your Balance: <span>{loading ? 'Loading...' : `${balance}$`}</span>
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            {currentStep === 1 && (
                <form onSubmit={handleSetWithdrawalAddress} className="withdrawal-form">
                    <h2>Set/Update Withdrawal Address</h2>
                    <div className="form-group">
                        <label htmlFor="network">Network:</label>
                        <select
                            id="network"
                            value={network}
                            onChange={(e) => setNetwork(e.target.value)}
                            disabled={loading}
                        >
                            <option value="TRC20">TRC20</option>
                            {/* Add other networks if supported by your backend */}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="currency">Currency:</label>
                        <select
                            id="currency"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            disabled={loading}
                        >
                            <option value="USDT">USDT</option>
                            {/* Add other currencies if supported by your backend */}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="withdrawalAddress">Wallet Address:</label>
                        <input
                            type="text"
                            id="withdrawalAddress"
                            value={withdrawalAddress}
                            onChange={(e) => setWithdrawalAddress(e.target.value)}
                            placeholder="Enter your wallet address"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="withdrawalPassword">Withdrawal Password:</label>
                        <input
                            type="password"
                            id="withdrawalPassword"
                            value={withdrawalPassword}
                            onChange={(e) => setWithdrawalPassword(e.target.value)}
                            placeholder="Enter your withdrawal password"
                            required
                            disabled={loading}
                        />
                    </div>
                    <button type="submit" className="confirm-button" disabled={loading}>
                        {loading ? 'Saving...' : 'Confirm Wallet Address'}
                    </button>
                </form>
            )}

            {currentStep === 2 && (
                <form onSubmit={handleFinalWithdrawal} className="withdrawal-form">
                    <h2>Withdraw Funds</h2>
                    {savedWithdrawalAddress && (
                        <p className="saved-address-info">
                            Your saved address: <strong>{savedWithdrawalAddress}</strong> (Network: {network}, Currency: {currency})
                            <button type="button" onClick={() => setCurrentStep(1)} className="change-address-button">Change/Update Address</button>
                        </p>
                    )}
                    <div className="form-group">
                        <label htmlFor="withdrawalAmount">Amount:</label>
                        <input
                            type="number"
                            id="withdrawalAmount"
                            value={withdrawalAmount}
                            onChange={(e) => setWithdrawalAmount(e.target.value)}
                            placeholder="Enter amount to withdraw"
                            required
                            min="0.01"
                            step="0.01"
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="finalWithdrawalPassword">Withdrawal Password:</label>
                        <input
                            type="password"
                            id="finalWithdrawalPassword"
                            value={withdrawalPassword}
                            onChange={(e) => setWithdrawalPassword(e.target.value)}
                            placeholder="Confirm your withdrawal password"
                            required
                            disabled={loading}
                        />
                    </div>
                    <button type="submit" className="confirm-button" disabled={loading || parseFloat(balance) <= 0}>
                        {loading ? 'Processing...' : 'Confirm Withdrawal'}
                    </button>
                    {parseFloat(balance) <= 0 && <p className="info-message">You have no balance to withdraw.</p>}
                </form>
            )}
        </div>
    );
}