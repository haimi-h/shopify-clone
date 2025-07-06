import React, { useState, useEffect } from "react"; // Add useEffect
import { useLocation, useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import axios from "axios"; // Import axios
import "../ProductRating.css";

const API_BASE_URL = 'http://localhost:5000/api/tasks'; // Base URL for task APIs

function ProductRatingPage() {
    const navigate = useNavigate();
    // const location = useLocation(); // We will no longer rely on location.state for product

    const [product, setProduct] = useState(null); // State to hold the fetched product (task)
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(null);
    const [loading, setLoading] = useState(true); // Loading state for fetching task
    const [error, setError] = useState(''); // Error state for API calls
    const [message, setMessage] = useState(''); // Success/info message for rating submission

    // --- Function to fetch a new task ---
    const fetchTask = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // If no token, redirect to login
                navigate('/login');
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/task`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // The backend returns { task: {...} }
            setProduct(response.data.task);
            setRating(0); // Reset rating for new task
        } catch (err) {
            console.error("Error fetching task:", err);
            setError(err.response?.data?.message || 'Failed to load task. Please try again.');
            setProduct(null); // Clear product on error
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

    // --- Function to submit the rating ---
    const handleSubmitRating = async () => {
        setError('');
        setMessage('');
        if (!product || !product.id) {
            setError("No product to rate.");
            return;
        }
        if (rating < 1 || rating > 5) {
            setError("Please provide a rating between 1 and 5 stars.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const res = await axios.post(`${API_BASE_URL}/submit-rating`,
                {
                    productId: product.id,
                    rating: rating
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setMessage(res.data.message); // "Task completed successfully!" or "Rating submitted."
            // If task completed, you might want to automatically fetch the next task
            if (res.data.isCompleted) {
                // Optionally wait a bit before fetching next task or navigate back
                setTimeout(() => {
                    fetchTask(); // Fetch the next task automatically
                }, 1500); // Wait 1.5 seconds to show success message
            }

        } catch (err) {
            console.error("Error submitting rating:", err);
            setError(err.response?.data?.message || 'Failed to submit rating.');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        }
    };

    // --- useEffect to fetch task on component mount ---
    useEffect(() => {
        fetchTask();
    }, []); // Empty dependency array means this runs once on mount

    const handleStarClick = (index) => {
        setRating(index + 1);
    };

    const isTaskCompleted = rating === 5; // This is now a local UI state, not backend driven directly

    if (loading) {
        return (
            <div className="rating-wrapper">
                <h2>Loading task...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rating-wrapper">
                <h2>Error: {error}</h2>
                <button onClick={fetchTask}>Try Again</button>
                <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="rating-wrapper">
                <h2>No new tasks available.</h2>
                <p>Please check back later or try refreshing.</p>
                <button onClick={fetchTask}>Refresh Tasks</button>
                <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="rating-wrapper">
            <div className="rating-card">
                {/* Use product.image_url from backend instead of product.image */}
                <img src={product.image_url} alt={product.name} className="rating-image" />
                <h2 className="rating-title">{product.name}</h2>
                <p className="rating-description">{product.description}</p>
                <p className="rating-price">Price: ₹{product.price}</p>
                {/* Removed product.category as it's not in your backend product schema */}

                <p className="rating-instruction">Rate this product (5 stars to complete task)</p>
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

                {/* Display messages */}
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}


                {/* Dynamically show messages based on rating */}
                {!message && rating > 0 && rating < 5 && (
                    <div className="incomplete-message">
                        ⭐ Task not complete – Please give 5 stars to finish.
                    </div>
                )}
                {!message && rating === 5 && (
                     <div className="success-message">
                        ✅ Ready to complete – Submit your 5-star rating!
                    </div>
                )}

                {/* Submit Button */}
                <button
                    className="submit-rating-button" // Add a class for styling if needed
                    onClick={handleSubmitRating}
                    disabled={loading || rating === 0 || message.includes("Task completed")} // Disable if loading, no rating, or already completed
                >
                    Submit Rating
                </button>

                <button className="back-button" onClick={() => navigate("/dashboard")}>
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}

export default ProductRatingPage;