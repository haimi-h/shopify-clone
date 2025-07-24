import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/WithdrawalPage.css'; // You'll create this CSS file

export default function WithdrawalPage() {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState('');
    const [withdrawalAddress, setWithdrawalAddress] = useState('');
    const [withdrawalPassword, setWithdrawalPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Hardcoded for now as per your sketches.
    // In a real app, these might come from an API or user selection.
    const currency = 'USDT';
    const network = 'TRC20';

    useEffect(() => {
        fetchUserBalance();
    }, []);

    const fetchUserBalance = async () => {
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
            setBalance(response.data.user.wallet_balance);
        } catch (err) {
            console.error('Error fetching balance:', err);
            setError('Failed to load balance.');
            // Optionally, navigate to login if token is invalid
            if (err.response && err.response.status === 401) {
                navigate('/login');
            }
        }
    };

    const handleWithdrawal = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Basic frontend validation (backend has more robust validation)
        if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance) {
            setError('Please enter a valid amount less than or equal to your balance.');
            setLoading(false);
            return;
        }
        if (!withdrawalAddress) {
            setError('Please enter a wallet address.');
            setLoading(false);
            return;
        }
        // Basic TRC20 address format check (starts with 'T', alphanumeric, length 34)
        if (network === 'TRC20' && (!withdrawalAddress.startsWith('T') || withdrawalAddress.length !== 34 || !/^[a-zA-Z0-9]+$/.test(withdrawalAddress))) {
            setError('Invalid TRC20 wallet address format. It should start with "T" and be 34 alphanumeric characters long.');
            setLoading(false);
            return;
        }
        if (!withdrawalPassword) {
            setError('Please enter your withdrawal password.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/users/withdraw`, {
                amount: parseFloat(amount),
                to_address: withdrawalAddress,
                withdrawal_password: withdrawalPassword,
                currency: currency,
                network: network
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setSuccessMessage(response.data.message);
            // Clear fields and refresh balance after successful withdrawal
            setAmount('');
            setWithdrawalAddress('');
            setWithdrawalPassword('');
            fetchUserBalance(); // Fetch updated balance
        } catch (err) {
            console.error('Withdrawal error:', err.response ? err.response.data : err.message);
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
                Your Balance: <span>{parseFloat(balance).toFixed(2)}$</span>
            </div>

            <form onSubmit={handleWithdrawal} className="withdrawal-form">
                {error && <p className="error-message">{error}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}

                <div className="form-group">
                    <label htmlFor="amount">Amount</label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount to withdraw"
                        step="0.01"
                        min="0.01"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Currency / Network</label>
                    <div className="read-only-field">
                        <span>{currency} / {network}</span>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="withdrawalAddress">Wallet Address</label>
                    <input
                        type="text"
                        id="withdrawalAddress"
                        value={withdrawalAddress}
                        onChange={(e) => setWithdrawalAddress(e.target.value)}
                        placeholder="Enter recipient wallet address (TRC20 USDT)"
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
                        placeholder="Enter your withdrawal password"
                        required
                    />
                </div>

                <button type="submit" className="confirm-withdrawal-button" disabled={loading}>
                    {loading ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
            </form>

            <div className="withdrawal-notes">
                <h3>Important Notes:</h3>
                <ul>
                    <li>Ensure the network ({network}) and currency ({currency}) match the recipient wallet.</li>
                    <li>Withdrawals are irreversible. Double-check the address.</li>
                    <li>A small network fee may apply (not shown in current UI).</li>
                </ul>
            </div>
        </div>
    );
}