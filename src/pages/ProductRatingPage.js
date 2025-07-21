// Updated ProductRatingPage.jsx based on client requirements
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import { FaStar } from "react-icons/fa";
import axios from "axios";
import "../ProductRating.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const LUCKY_ORDER_POSITION = 22; // We'll later make this dynamic if needed

function ProductRatingPage() {
    const navigate = useNavigate();
    const location = useLocation(); // Initialize useLocation

    const [product, setProduct] = useState(null);
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

    // ⭐ NEW: State to hold the product passed from the dashboard
    const [initialDashboardProduct, setInitialDashboardProduct] = useState(null);

    const fetchTask = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const res = await axios.get(`${API_BASE_URL}/tasks/task`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const task = res.data.task;
            setProduct(task);
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
            setError(err.response?.data?.message || 'Failed to load task.');
            setProduct(null);
            if ([401, 403].includes(err.response?.status)) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    // ⭐ MODIFIED useEffect: Handle initial product from dashboard
    useEffect(() => {
        // Check if a product was passed via navigation state
        if (location.state && location.state.product) {
            setInitialDashboardProduct(location.state.product);
            // Optionally, if you want to initially display *only* this product
            // and fetch the actual task later, you could set 'product' here too
            // setProduct({
            //     name: location.state.product.name,
            //     image_url: location.state.product.image // Note: using image_url for consistency
            // });
            // setLoading(false); // If you don't want to show 'Loading task...' initially
        }
        fetchTask(); // Always fetch a new task from the backend
    }, [location]); // Depend on location to re-run if state changes

    const handleSubmitRating = async () => {
        setError('');
        setMessage('');

        if (rechargeRequired) {
            alert(`In order to evaluate this item, please recharge $${capitalRequired}.`);
            navigate('/recharge');
            return;
        }

        if (!product?.id || rating < 1 || rating > 5) {
            setError("Please provide a valid rating.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/tasks/submit-rating`, {
                productId: product.id,
                rating
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setMessage(res.data.message);

            if (res.data.isCompleted) {
                setTimeout(fetchTask, 1500);
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit rating.');
            if ([401, 403].includes(err.response?.status)) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    };

    const handleStarClick = (index) => setRating(index + 1);

    // ⭐ MODIFIED rendering logic to use initialDashboardProduct if available
    const displayProduct = product || initialDashboardProduct;
    const displayImage = product?.image_url || initialDashboardProduct?.image;
    const displayName = product?.name || initialDashboardProduct?.name;

    if (loading && !initialDashboardProduct) return <div className="rating-wrapper"><h2>Loading task...</h2></div>;

    if (error && !displayProduct) return (
        <div className="rating-wrapper">
            <h2>Error: {error}</h2>
            <button onClick={fetchTask}>Try Again</button>
            <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
    );

    if (!displayProduct) return (
        <div className="rating-wrapper">
            <h2>No new tasks available.</h2>
            <button onClick={fetchTask}>Refresh Tasks</button>
            <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
    );

    return (
        <div className="rating-wrapper">
            <div className="rating-card">
                {displayImage && ( // Display image from either fetched task or initial dashboard product
                    <img src={displayImage} alt={displayName} className="rating-image" />
                )}
                <h2 className="rating-title">{displayName}</h2> {/* Display name from either */}
                {/* Only show description and price if a task product is loaded */}
                {product && (
                    <>
                        <p className="rating-description">{product.description}</p>
                        <p className="rating-price">Price: ${product.price}</p>
                    </>
                )}

                {/* Dollar Info - Only relevant if a task product is loaded */}
                {product && (
                    <div className="rating-financials">
                        <p><strong>💰 Your Balance:</strong> ${userBalance.toFixed(2)}</p>
                        <p><strong>📈 Profit if you rate:</strong> ${profitAmount.toFixed(2)}</p>
                        <p><strong>💵 Capital Required:</strong> ${capitalRequired.toFixed(2)}</p>
                    </div>
                )}

                {/* Lucky order message - Only relevant if a task product is loaded */}
                {product && rechargeRequired && (
                    <div className="lucky-order-warning">
                        ⚠️ This is a lucky order! You need to recharge ${capitalRequired} to proceed.
                        <br />
                        <button onClick={() => navigate('/recharge')}>Continue to Recharge</button>
                    </div>
                )}

                {/* Display a message if initially showing dashboard product and a task is loading */}
                {initialDashboardProduct && !product && loading && (
                     <p className="loading-task-message">Loading your next task...</p>
                )}
                {/* Rating Stars - Only allow rating if a task product is loaded */}
                {product && (
                    <>
                        <div className="rating-instruction">Rate this product (5 stars to complete task)</div>
                        <div className="stars">
                            {[...Array(5)].map((_, index) => (
                                <FaStar
                                    key={index}
                                    className="star"
                                    color={(hover || rating) > index ? "#ffc107" : "#ccc"}
                                    onClick={() => handleStarClick(index)}
                                    onMouseEnter={() => setHover(index + 1)}
                                    onMouseLeave={() => setHover(null)}
                                />
                            ))}
                        </div>
                    </>
                )}


                {/* Feedback */}
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}

                {product && !message && rating > 0 && rating < 5 && (
                    <div className="incomplete-message">
                        ⭐ Task not complete – Please give 5 stars to finish.
                    </div>
                )}
                {product && !message && rating === 5 && (
                    <div className="success-message">
                        ✅ Ready to complete – Submit your 5-star rating!
                    </div>
                )}

                {/* Only enable submit button if a task is loaded */}
                <button
                    className="submit-rating-button"
                    onClick={handleSubmitRating}
                    disabled={!product || loading || rating === 0 || message.includes("Task completed")}
                >
                    Submit Rating
                </button>

                <button className="back-button" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
            </div>
        </div>
    );
}

export default ProductRatingPage;