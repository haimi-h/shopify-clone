// Updated ProductRatingPage.jsx to prevent logout and display product correctly
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import "../ProductRating.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const LUCKY_ORDER_POSITION = 22;

function ProductRatingPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // State for the task fetched from the API
    const [product, setProduct] = useState(null);
    // State for the product passed from the dashboard
    const [initialDashboardProduct, setInitialDashboardProduct] = useState(null);

    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [userBalance, setUserBalance] = useState(0);
    const [taskCount, setTaskCount] = useState(0);
    const [capitalRequired, setCapitalRequired] = useState(0);
    const [profitAmount, setProfitAmount] = useState(0);
    const [rechargeRequired, setRechargeRequired] = useState(false);

    const fetchTask = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            // ⚠️ IMPORTANT: This is a security check.
            // If it redirects you, it means the token is not in localStorage.
            // Ensure your Login page is saving the token correctly.
            if (!token) {
                navigate('/login'); // Redirect to login if not authenticated
                return;
            }

            const res = await axios.get(`${API_BASE_URL}/tasks/task`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const task = res.data.task;
            setProduct(task); // Set the live task from the API
            setRating(0);
            setCapitalRequired(task.capital_required || 0);
            setProfitAmount(task.profit || 0);
            setUserBalance(res.data.balance || 0);
            setTaskCount(res.data.taskCount || 0);

            if ((res.data.taskCount + 1) === LUCKY_ORDER_POSITION) {
                setRechargeRequired(true);
            } else {
                setRechargeRequired(false);
            }

        } catch (err) {
            console.error("Error fetching task:", err);
            setError(err.response?.data?.message || 'Failed to load task details.');
            // This is also a security check for invalid/expired tokens
            if ([401, 403].includes(err.response?.status)) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // First, check if a product was passed from the dashboard and set it for display
        if (location.state && location.state.product) {
            setInitialDashboardProduct(location.state.product);
        }
        // Then, fetch the live task data from the backend
        fetchTask();
    }, [location]); // Re-run if the location state changes

    const handleSubmitRating = async () => {
        // ... (submission logic remains the same)
    };

    // Determine which product to display: prioritize the live task, but fall back to the dashboard product.
    const displayProduct = product || initialDashboardProduct;

    // Show a loading indicator only if we have NO product to display at all.
    if (loading && !displayProduct) return <div className="rating-wrapper"><h2>Loading task...</h2></div>;

    // Show an error if fetching failed AND we have no product to display.
    if (error && !displayProduct) return (
        <div className="rating-wrapper">
            <h2>Error: {error}</h2>
            <button onClick={fetchTask}>Try Again</button>
        </div>
    );
    
    // If there's no product from the API or dashboard, show a message.
    if (!displayProduct) return (
        <div className="rating-wrapper">
            <h2>No task available to display.</h2>
            <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
    );

    // ✅ CORRECT: Use the displayProduct for the name and image to ensure it shows immediately.
    return (
        <div className="rating-wrapper">
            <div className="rating-card">
                <img
                    src={displayProduct.image_url || displayProduct.image}
                    alt={displayProduct.name}
                    className="rating-image"
                    onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/200x200?text=No+Image"; }}
                />
                <h2 className="rating-title">{displayProduct.name}</h2>
                
                {/* Details from the live task (only show if 'product' is loaded) */}
                {product && (
                    <>
                        <p className="rating-description">{product.description}</p>
                        <p className="rating-price">Price: ${product.price}</p>
                        <div className="rating-financials">
                            <p><strong>💰 Your Balance:</strong> ${userBalance.toFixed(2)}</p>
                            <p><strong>📈 Profit if you rate:</strong> ${profitAmount.toFixed(2)}</p>
                            <p><strong>💵 Capital Required:</strong> ${capitalRequired.toFixed(2)}</p>
                        </div>
                    </>
                )}

                {/* Show a message while the live task is loading in the background */}
                {loading && <p className="loading-task-message">Loading task details...</p>}

                {/* Stars and submission (only allow if live task is loaded) */}
                {product && !loading && (
                    <>
                        <div className="rating-instruction">Rate this product (5 stars to complete task)</div>
                        <div className="stars">
                            {[...Array(5)].map((_, index) => (
                                <FaStar
                                    key={index}
                                    className="star"
                                    color={(hover || rating) > index ? "#ffc107" : "#ccc"}
                                    onClick={() => setRating(index + 1)}
                                    onMouseEnter={() => setHover(index + 1)}
                                    onMouseLeave={() => setHover(null)}
                                />
                            ))}
                        </div>
                        <button
                            className="submit-rating-button"
                            onClick={handleSubmitRating}
                            disabled={rating === 0 || message.includes("Task completed")}
                        >
                            Submit Rating
                        </button>
                    </>
                )}
                
                {error && <p className="error-message">{error}</p>}
                
                <button className="back-button" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
            </div>
        </div>
    );
}

export default ProductRatingPage;