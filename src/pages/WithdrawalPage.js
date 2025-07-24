import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../WithdrawalPage.css'; // Ensure this CSS file exists

export default function WithdrawalPage() {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [savedWithdrawalAddress, setSavedWithdrawalAddress] = useState(''); // The permanently saved address
    const [inputAddress, setInputAddress] = useState(''); // Address entered by user in Step 1
    const [inputPassword, setInputPassword] = useState(''); // Password for address setting
    const [withdrawalAmount, setWithdrawalAmount] = useState(''); // Amount for withdrawal
    const [withdrawalPassword, setWithdrawalPassword] = useState(''); // Password for actual withdrawal
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [currentStep, setCurrentStep] = useState(1); // 1 for address management, 2 for amount

    const currency = 'USDT';
    const network = 'TRC20';

    useEffect(() => {
        fetchUserData(); // Fetch user data including balance and saved address
    }, []);

    const fetchUserData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const userData = response.data.user;
            setBalance(parseFloat(userData.wallet_balance).toFixed(2));
            setSavedWithdrawalAddress(userData.withdrawal_wallet_address || '');

            // If a withdrawal address is already saved, proceed to Step 2 by default
            if (userData.withdrawal_wallet_address) {
                setCurrentStep(2);
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError('Failed to load user data.');
            if (err.response && err.response.status === 401) {
                navigate('/login');
            }
        }
    };

    const handleSetWithdrawalAddress = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        if (!inputAddress) {
            setError('Please enter a wallet address.');
            setLoading(false);
            return;
        }
        // Basic TRC20 address format validation
        if (network === 'TRC20' && (!inputAddress.startsWith('T') || inputAddress.length !== 34 || !/^[a-zA-Z0-9]+$/.test(inputAddress))) {
            setError('Invalid TRC20 wallet address format. It should start with "T" and be 34 alphanumeric characters long.');
            setLoading(false);
            return;
        }
        if (!inputPassword) {
            setError('Please enter your withdrawal password.');
            setLoading(false);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/users/set-withdrawal-address`, {
                new_address: inputAddress,
                withdrawal_password: inputPassword
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setSuccessMessage(response.data.message);
            setSavedWithdrawalAddress(inputAddress); // Update the saved address state
            setInputPassword(''); // Clear password field
            setCurrentStep(2); // Move to step 2 after saving
            setError(''); // Clear any previous errors
        } catch (err) {
            console.error('Set withdrawal address error:', err.response ? err.response.data : err.message);
            setError(err.response?.data?.message || 'Failed to set wallet address. Check password.');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalWithdrawal = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Frontend validation for amount
        if (isNaN(withdrawalAmount) || parseFloat(withdrawalAmount) <= 0 || parseFloat(withdrawalAmount) > balance) {
            setError('Please enter a valid amount less than or equal to your balance.');
            setLoading(false);
            return;
        }
        if (!withdrawalPassword) {
            setError('Please enter your withdrawal password.');
            setLoading(false);
            return;
        }

        // Ensure a withdrawal address is saved before proceeding
        if (!savedWithdrawalAddress) {
            setError('No withdrawal wallet address found. Please set it in Step 1.');
            setCurrentStep(1); // Force back to step 1
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/users/withdraw`, {
                amount: parseFloat(withdrawalAmount),
                // DO NOT send to_address here; backend will fetch the saved address
                withdrawal_password: withdrawalPassword,
                currency: currency,
                network: network
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setSuccessMessage(response.data.message);
            setWithdrawalAmount('');
            setWithdrawalPassword('');
            fetchUserData(); // Refresh balance and address state
        } catch (err) {
            console.error('Final withdrawal error:', err.response ? err.response.data : err.message);
            setError(err.response?.data?.message || 'Withdrawal failed. Please try again.');
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
                Your Balance: <span>{balance}$</span>
            </div>

            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}

            {currentStep === 1 && (
                <form onSubmit={handleSetWithdrawalAddress} className="withdrawal-form">
                    <h2>Step 1: Set/Update Withdrawal Address</h2>
                    <p className="form-description">
                        This address will be saved to your profile and used for all future withdrawals.
                    </p>
                    <div className="form-group">
                        <label>Currency / Network</label>
                        <div className="read-only-field">
                            <span>{currency} / {network}</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="inputAddress">Wallet Address</label>
                        <input
                            type="text"
                            id="inputAddress"
                            value={inputAddress || savedWithdrawalAddress} // Pre-fill if already saved
                            onChange={(e) => setInputAddress(e.target.value)}
                            placeholder="Enter recipient wallet address (TRC20 USDT)"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="inputPassword">Withdrawal Password</label>
                        <input
                            type="password"
                            id="inputPassword"
                            value={inputPassword}
                            onChange={(e) => setInputPassword(e.target.value)}
                            placeholder="Enter your withdrawal password"
                            required
                        />
                    </div>

                    <button type="submit" className="confirm-withdrawal-button" disabled={loading}>
                        {loading ? 'Saving Address...' : 'Save Wallet Address'}
                    </button>
                    {savedWithdrawalAddress && (
                        <button
                            type="button"
                            className="skip-button"
                            onClick={() => { setCurrentStep(2); setError(''); setSuccessMessage(''); }}
                            disabled={loading}
                        >
                            Use Saved Address & Continue
                        </button>
                    )}
                </form>
            )}

            {currentStep === 2 && (
                <form onSubmit={handleFinalWithdrawal} className="withdrawal-form">
                    <h2>Step 2: Enter Amount & Finalize</h2>
                    <div className="form-group">
                        <label>Your Saved Wallet Address</label>
                        <div className="read-only-field">
                            <span>{savedWithdrawalAddress || 'Not set'}</span>
                            <button
                                type="button"
                                className="edit-address-button"
                                onClick={() => { setCurrentStep(1); setError(''); setSuccessMessage(''); }}
                            >
                                Change
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="withdrawalAmount">Amount</label>
                        <input
                            type="number"
                            id="withdrawalAmount"
                            value={withdrawalAmount}
                            onChange={(e) => setWithdrawalAmount(e.target.value)}
                            placeholder="Enter amount to withdraw"
                            step="0.01"
                            min="0.01"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="withdrawalPassword">Withdrawal Password</label>
                        <input
                            type="password"
                            id="withdrawalPassword"
                            value={withdrawalPassword}
                            onChange={(e) => setWithdrawalPassword(e.target.value)}
                            placeholder="Re-enter your withdrawal password"
                            required
                        />
                    </div>

                    <button type="submit" className="confirm-withdrawal-button" disabled={loading}>
                        {loading ? 'Processing...' : 'Confirm Withdrawal'}
                    </button>
                </form>
            )}

            <div className="withdrawal-notes">
                <h3>Important Notes:</h3>
                <ul>
                    <li>Ensure the network ({network}) and currency ({currency}) match the recipient wallet.</li>
                    <li>Withdrawals are irreversible. Double-check the address carefully.</li>
                    <li>A small network fee may apply (not shown in current UI).</li>
                </ul>
            </div>
        </div>
    );
}