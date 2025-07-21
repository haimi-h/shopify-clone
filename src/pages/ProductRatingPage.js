// Updated ProductRatingPage.jsx to dynamically handle lucky orders from backend
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import "../ProductRating.css"; // Ensure you have styling for .lucky-order-warning

// Define your API base URL. It's crucial this matches your backend server.js.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

function ProductRatingPage() {
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [capitalRequired, setCapitalRequired] = useState(0);
  const [profitAmount, setProfitAmount] = useState(0);
  // This state will now be set by the backend response
  const [rechargeRequired, setRechargeRequired] = useState(false);
  // State to hold the specific capital required for a lucky order, if applicable
  const [luckyOrderCapital, setLuckyOrderCapital] = useState(0);


  const fetchTask = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/tasks/task`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const task = res.data.task;
      setProduct(task);
      setRating(0); // Reset rating for new task
      setProfitAmount(task.profit || 0);
      setUserBalance(res.data.balance || 0);
      setTaskCount(res.data.taskCount || 0); // Current task count from backend

      // --- NEW LOGIC FOR LUCKY ORDER ---
      // The backend should now tell us if this is a lucky order and its capital
      const isLuckyOrder = res.data.isLuckyOrder || false;
      const requiredCapitalForLuckyOrder = res.data.luckyOrderCapitalRequired || 0;

      setRechargeRequired(isLuckyOrder);
      setLuckyOrderCapital(requiredCapitalForLuckyOrder);

      // Set capitalRequired based on whether it's a lucky order or a regular task
      if (isLuckyOrder) {
        setCapitalRequired(requiredCapitalForLuckyOrder);
      } else {
        setCapitalRequired(task.capital_required || 0);
      }

      // --- DEBUGGING: Log received data ---
      console.log("Current taskCount from backend:", res.data.taskCount);
      console.log("Is this a lucky order?", isLuckyOrder);
      console.log("Lucky order capital required:", requiredCapitalForLuckyOrder);
      console.log("Final capitalRequired set:", capitalRequired); // Note: This might log the previous state's value due to async setState
      // --- END DEBUGGING ---

    } catch (err) {
      console.error("Error fetching task:", err);
      setError(err.response?.data?.message || "Failed to load task.");
      setProduct(null); // Clear product if there's an error
      if ([401, 403].includes(err.response?.status)) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    setError("");
    setMessage("");

    // If it's a lucky order and recharge is required, enforce recharge before submission
    // Use the luckyOrderCapital state for the alert
    if (rechargeRequired) {
      // Using a custom modal/message box is recommended instead of alert()
      // For now, keeping alert as per original code, but note this limitation in Canvas
      alert(
        `In order to evaluate this item, please recharge $${luckyOrderCapital.toFixed(2)}.`
      );
      navigate("/recharge");
      return; // Stop submission
    }

    if (!product?.id || rating < 1 || rating > 5) {
      setError("Please provide a valid rating.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/tasks/submit-rating`,
        {
          productId: product.id,
          rating,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessage(res.data.message);

      // If the task is completed, fetch a new task after a short delay
      if (res.data.isCompleted) {
        setTimeout(fetchTask, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit rating.");
      if ([401, 403].includes(err.response?.status)) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  };

  // Fetch task on component mount
  useEffect(() => {
    fetchTask();
  }, []); // Empty dependency array means this runs once on mount

  const handleStarClick = (index) => setRating(index + 1);

  // --- Conditional rendering based on loading/error states ---
  if (loading)
    return (
      <div className="rating-wrapper">
        <h2>Loading task...</h2>
      </div>
    );

  if (error)
    return (
      <div className="rating-wrapper">
        <h2>Error: {error}</h2>
        <button onClick={fetchTask}>Try Again</button>
        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );

  if (!product)
    return (
      <div className="rating-wrapper">
        <h2>No new tasks available.</h2>
        <button onClick={fetchTask}>Refresh Tasks</button>
        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );

  return (
    <div className="rating-wrapper">
      <div className="rating-card">
        <img
          src={product.image_url}
          alt={product.name}
          className="rating-image"
        />
        <h2 className="rating-title">{product.name}</h2>
        <p className="rating-description">{product.description}</p>
        <p className="rating-price">Price: ${product.price}</p>

        {/* Dollar Info */}
        <div className="rating-financials">
          <p>
            <strong>💰 Your Balance:</strong> ${userBalance.toFixed(2)}
            {/* Add this button/icon */}
            <button
              onClick={() => navigate("/recharge")}
              className="add-balance-button"
              title="Add Funds"
            >
              +
            </button>
          </p>
          <p>
            <strong>📈 Profit if you rate:</strong> ${profitAmount.toFixed(2)}
          </p>
          <p>
            <strong>💵 Capital Required:</strong> ${capitalRequired.toFixed(2)}
          </p>
        </div>

        {/* --- LUCKY ORDER DISPLAY --- */}
        {/* This div will appear if the current task is identified as a lucky order. */}
        {rechargeRequired && (
          <div className="lucky-order-warning">
            ⚠️ This is a lucky order! You need to recharge ${luckyOrderCapital.toFixed(2)} to
            proceed.
            <br />
            <button onClick={() => navigate("/recharge")}>
              Continue to Recharge
            </button>
          </div>
        )}
        {/* --- END LUCKY ORDER DISPLAY --- */}

        {/* Rating Stars */}
        <div className="rating-instruction">
          Rate this product (5 stars to complete task)
        </div>
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

        {/* Feedback Messages */}
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        {/* Task completion status messages */}
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

        <button
          className="submit-rating-button"
          onClick={handleSubmitRating}
          disabled={
            loading || rating === 0 || message.includes("Task completed")
          }
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
