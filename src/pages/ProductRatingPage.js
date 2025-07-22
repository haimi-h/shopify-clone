import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import "../ProductRating.css";

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
  const [isLuckyOrder, setIsLuckyOrder] = useState(false);
  const [luckyOrderCapital, setLuckyOrderCapital] = useState(0);
  const [userDefaultProfit, setUserDefaultProfit] = useState(0); // ADDED: State to store default task profit

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

      // Fetch the task details
      const taskRes = await axios.get(`${API_BASE_URL}/tasks/task`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProduct(taskRes.data.task);

      // Fetch the current user's profile to get default_task_profit and latest balance
      // Assuming '/api/users/me' endpoint returns the logged-in user's profile
      // which should now include 'default_task_profit' from your backend changes.
      const userRes = await axios.get(`${API_BASE_URL}/users/me`, { //
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserBalance(userRes.data.user.wallet_balance);
      setUserDefaultProfit(userRes.data.user.default_task_profit || 0); // ADDED: Set default profit

      setRating(0);
      setIsLuckyOrder(taskRes.data.task.is_lucky_order);
      setLuckyOrderCapital(taskRes.data.task.lucky_order_capital || 0);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching task or user data:", err);
      setError(
        err.response?.data?.message || "Failed to load task or user data."
      );
      setLoading(false);
      // If the error is 401 or 403, redirect to login
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    fetchTask();
  }, []);

  // Calculate shortfall for lucky orders
  const shortfall = isLuckyOrder ? luckyOrderCapital - userBalance : 0;

  const handleSubmitRating = async () => {
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (!product) {
      setError("No task available to rate.");
      return;
    }
    if (isLuckyOrder && userBalance < luckyOrderCapital) {
      setError("Insufficient balance for lucky order. Please recharge.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/tasks/complete`,
        {
          taskId: product.id,
          rating: rating,
          isLuckyOrder: isLuckyOrder,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(res.data.message || "Task completed successfully!");
      // Optionally, re-fetch task to get a new one or update UI
      fetchTask();
    } catch (err) {
      console.error("Error completing task:", err);
      setError(err.response?.data?.message || "Failed to complete task.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading task...</div>;
  }

  return (
    <div className="product-rating-page">
      <div className="rating-container">
        {product ? (
          <>
            <img
              src={product.image_url || "placeholder.jpg"}
              alt={product.name}
              className="product-image"
            />
            <h2>{product.name}</h2>
            <p className="product-description">{product.description}</p>
            <p className="product-price">Price: ${product.price}</p>
          </>
        ) : (
          <p>No task available. Please check back later.</p>
        )}

        {/* ADDED: Display Default Task Profit */}
        <div className="profit-info">
          {isLuckyOrder ? (
            <p>
              **Lucky Order!** Potential profit for this task:{" "}
              <strong>${product.profit_rate.toFixed(2)}</strong>
            </p>
          ) : (
            <p>
              Expected profit for this task:{" "}
              <strong>
                ${product.profit_rate !== undefined && product.profit_rate !== null
                  ? product.profit_rate.toFixed(2)
                  : userDefaultProfit.toFixed(2)} {/* Use task profit if available, else user default */}
              </strong>
            </p>
          )}
        </div>
        {/* END ADDED SECTION */}

        <div className="user-balance-info">
          Your current balance: ${userBalance.toFixed(2)}
        </div>

        {isLuckyOrder && (
          <div className={`lucky-order-info ${shortfall > 0 ? "recharge-needed" : "sufficient-balance"}`}>
            {shortfall > 0 ? (
              <>
                ⚠️ Lucky Order! You need to recharge{" "}
                <strong>${shortfall.toFixed(2)}</strong> to proceed.
                <button
                  onClick={() =>
                    navigate("/recharge", { state: { requiredAmount: shortfall } })
                  }
                >
                  Continue to Recharge
                </button>
              </>
            ) : (
              <>✅ Lucky Order! Your balance is sufficient.</>
            )}
          </div>
        )}

        <div className="rating-instruction">
          Rate this product (5 stars to complete task)
        </div>
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

        {message && <p className="success-message">{message}</p>}
        {error && !message && <p className="error-message">{error}</p>}

        <button
          className="submit-rating-button"
          onClick={handleSubmitRating}
          disabled={loading || message.includes("completed")}
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