// Updated ProductRatingPage.jsx based on client requirements
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import { FaStar } from "react-icons/fa";
import axios from "axios";
import "../ProductRating.css"; // Assuming this CSS file exists and is correctly styled

// Base URL for API calls, defaults to localhost if not set in environment
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const LUCKY_ORDER_POSITION = 22; // This could be dynamic based on backend logic

function ProductRatingPage() {
    const navigate = useNavigate(); // Hook for programmatic navigation
    const location = useLocation(); // Hook to access the current URL's location object, including state

    // State variables for managing product data, rating, and UI feedback
    const [product, setProduct] = useState(null); // Holds the actual task product fetched from the API
    const [rating, setRating] = useState(0); // Current star rating given by the user
    const [hover, setHover] = useState(null); // Used for star hover effect
    const [loading, setLoading] = useState(true); // Indicates if data is being loaded
    const [error, setError] = useState(''); // Stores any error messages
    const [message, setMessage] = useState(''); // Stores success or informational messages
    const [userBalance, setUserBalance] = useState(0); // User's current balance
    const [taskCount, setTaskCount] = useState(0); // Number of tasks completed by the user
    const [capitalRequired, setCapitalRequired] = useState(0); // Capital required for the current task
    const [profitAmount, setProfitAmount] = useState(0); // Profit earned from completing the task
    const [rechargeRequired, setRechargeRequired] = useState(false); // Flag if recharge is needed for a lucky order

    // State to hold the product passed from the dashboard via navigation state
    const [initialDashboardProduct, setInitialDashboardProduct] = useState(null);

    // Function to fetch a new task from the backend
    const fetchTask = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const token = localStorage.getItem('token'); // Get authentication token from local storage
            if (!token) {
                navigate('/login'); // Redirect to login if no token is found
                return;
            }

            // Make API call to fetch a task
            const res = await axios.get(`${API_BASE_URL}/tasks/task`, {
                headers: { Authorization: `Bearer ${token}` } // Include token in headers
            });

            const task = res.data.task;
            setProduct(task); // Set the fetched task as the current product
            setRating(0); // Reset rating for the new task
            setCapitalRequired(task.capital_required || 0);
            setProfitAmount(task.profit || 0);
            setUserBalance(res.data.balance || 0);
            setTaskCount(res.data.taskCount || 0);

            // Check if the next task is a "lucky order" requiring recharge
            if ((res.data.taskCount + 1) === LUCKY_ORDER_POSITION) {
                setRechargeRequired(true);
            } else {
                setRechargeRequired(false);
            }

        } catch (err) {
            console.error("Error fetching task:", err);
            setError(err.response?.data?.message || 'Failed to load task.');
            setProduct(null); // Clear product if fetching fails
            // Handle authentication errors by clearing token and redirecting to login
            if ([401, 403].includes(err.response?.status)) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setLoading(false); // Set loading to false regardless of success or failure
        }
    };

    // useEffect hook to handle initial product from dashboard and fetch new tasks
    useEffect(() => {
        // Check if a product was passed via navigation state from the dashboard
        if (location.state && location.state.product) {
            setInitialDashboardProduct(location.state.product);
        }
        fetchTask(); // Always fetch a new task from the backend after component mounts or location changes
    }, [location]); // Dependency array includes `location` to re-run effect if navigation state changes

    // Function to handle submitting the product rating
    const handleSubmitRating = async () => {
        setError('');
        setMessage('');

        // Prevent submission if recharge is required for a lucky order
        if (rechargeRequired) {
            // Using a simple alert for demonstration, consider a custom modal in a real app
            alert(`In order to evaluate this item, please recharge $${capitalRequired}.`);
            navigate('/recharge'); // Navigate to recharge page
            return;
        }

        // Validate product and rating before submission
        if (!product?.id || rating < 1 || rating > 5) {
            setError("Please provide a valid rating.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // Make API call to submit the rating
            const res = await axios.post(`${API_BASE_URL}/tasks/submit-rating`, {
                productId: product.id,
                rating
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setMessage(res.data.message); // Display success message

            // If the task is completed, fetch a new task after a short delay
            if (res.data.isCompleted) {
                setTimeout(fetchTask, 1500);
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit rating.');
            // Handle authentication errors
            if ([401, 403].includes(err.response?.status)) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    };

    // Handler for star click to set the rating
    const handleStarClick = (index) => setRating(index + 1);

    // Determine which product to display: the fetched task or the initial product from the dashboard
    const displayProduct = product || initialDashboardProduct;
    // Use the correct image URL property (image_url from API, image from mock data)
    const displayImage = product?.image_url || initialDashboardProduct?.image;
    const displayName = product?.name || initialDashboardProduct?.name;

    // Loading state: Show "Loading task..." if no initial product and still loading
    if (loading && !initialDashboardProduct) return <div className="rating-wrapper"><h2>Loading task...</h2></div>;

    // Error state: Show error message if no product to display and an error occurred
    if (error && !displayProduct) return (
        <div className="rating-wrapper">
            <h2>Error: {error}</h2>
            <button onClick={fetchTask}>Try Again</button>
            <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
    );

    // No task available state
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
                {displayImage && ( // Display product image if available
                    <img
                        src={displayImage}
                        alt={displayName}
                        className="rating-image"
                        // Fallback for broken images
                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/200x200/cccccc/white?text=No+Image"; }}
                    />
                )}
                <h2 className="rating-title">{displayName}</h2> {/* Display product name */}
                {/* Only show description and price if a task product is loaded (from API) */}
                {product && (
                    <>
                        <p className="rating-description">{product.description}</p>
                        <p className="rating-price">Price: ${product.price}</p>
                    </>
                )}

                {/* Financial information, only relevant if a task product is loaded */}
                {product && (
                    <div className="rating-financials">
                        <p><strong>💰 Your Balance:</strong> ${userBalance.toFixed(2)}</p>
                        <p><strong>📈 Profit if you rate:</strong> ${profitAmount.toFixed(2)}</p>
                        <p><strong>💵 Capital Required:</strong> ${capitalRequired.toFixed(2)}</p>
                    </div>
                )}

                {/* Lucky order warning message */}
                {product && rechargeRequired && (
                    <div className="lucky-order-warning">
                        ⚠️ This is a lucky order! You need to recharge ${capitalRequired} to proceed.
                        <br />
                        <button onClick={() => navigate('/recharge')}>Continue to Recharge</button>
                    </div>
                )}

                {/* Message when an initial product is shown but the task is still loading */}
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

                {/* Feedback messages (success or error) */}
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}

                {/* Conditional messages based on rating progress */}
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

                {/* Submit Rating Button - Enabled only when a product is loaded and a valid rating is given */}
                <button
                    className="submit-rating-button"
                    onClick={handleSubmitRating}
                    disabled={!product || loading || rating === 0 || message.includes("Task completed")}
                >
                    Submit Rating
                </button>

                {/* Button to go back to the dashboard */}
                <button className="back-button" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
            </div>
        </div>
    );
}

export default ProductRatingPage;
