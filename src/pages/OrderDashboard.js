import React, { useState, useEffect } from 'react'; // Add useState and useEffect
import '../OrderDashboard.css';
import { FaHome, FaList, FaHandPointer, FaUserCircle, FaCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios

const API_BASE_URL = 'http://localhost:5000/api/tasks'; // Base URL for task APIs

const OrderDashboard = () => {
    const navigate = useNavigate();

    // State to store the fetched counts
    const [counts, setCounts] = useState({
        uncompletedOrders: 0,
        completedOrders: 0,
        dailyOrders: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- Function to fetch dashboard summary ---
    const fetchDashboardSummary = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // If no token, redirect to login
                navigate('/login');
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/dashboard-summary`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // The backend returns an object with uncompletedOrders, completedOrders, dailyOrders
            setCounts(response.data);
        } catch (err) {
            console.error("Error fetching dashboard summary:", err);
            setError(err.response?.data?.message || 'Failed to load dashboard summary.');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                // If unauthorized, clear token and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- useEffect to fetch summary on component mount ---
    useEffect(() => {
        fetchDashboardSummary();
    }, []); // Empty dependency array means this runs once on mount

    // --- Handle START ORDER TASK button click ---
    const handleStartOrderTask = () => {
        // Just navigate to the product rating page.
        // ProductRatingPage will now handle fetching the task itself.
        navigate('/product-rating'); // Assuming your route for ProductRatingPage is /product-rating
    };

    if (loading) {
        return (
            <div className="order-dashboard">
                <div className="stats-container">
                    <div className="stat-box">Loading...</div>
                    <div className="stat-box">Loading...</div>
                    <div className="stat-box">Loading...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="order-dashboard">
                <p className="error-message">Error: {error}</p>
                <button onClick={fetchDashboardSummary}>Retry</button>
            </div>
        );
    }

    return (
        <div className="order-dashboard">
            {/* Stats Section */}
            <div className="stats-container">
                <div className="stat-box">
                    <div className="stat-number">{counts.uncompletedOrders}</div>
                    <div className="stat-label">Uncompleted Orders</div>
                </div>
                <div className="stat-box">
                    <div className="stat-number">{counts.completedOrders}</div>
                    <div className="stat-label">Completed Orders</div>
                </div>
                <div className="stat-box">
                    <div className="stat-number">{counts.dailyOrders}</div>
                    <div className="stat-label">Daily Orders</div>
                </div>
            </div>

            {/* Action Button */}
            <div className="action-button">
                <button onClick={handleStartOrderTask}>START ORDER TASK</button>
            </div>

            {/* You can add your navigation icons back here if they were removed for brevity */}
            {/* <div className="navbar">
                <div className="nav-item">
                    <FaHome />
                    <span>Home</span>
                </div>
                <div className="nav-item">
                    <FaList />
                    <span>Orders</span>
                </div>
                <div className="nav-item active">
                    <FaHandPointer />
                    <span>Task</span>
                </div>
                <div className="nav-item">
                    <FaUserCircle />
                    <span>Me</span>
                </div>
                <div className="nav-item">
                    <FaCog />
                    <span>Settings</span>
                </div>
            </div> */}
        </div>
    );
};

export default OrderDashboard;