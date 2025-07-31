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
  const [insufficientBalanceForTasks, setInsufficientBalanceForTasks] = useState(false);

  const fetchTask = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    setInsufficientBalanceForTasks(false);
    setIsLuckyOrder(false); // Reset lucky order state on each fetch
    setProduct(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/tasks/task`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // These checks handle non-error responses that still mean "no task"
      if (res.data.errorCode === 'INSUFFICIENT_BALANCE_FOR_TASKS') {
        setError(res.data.message);
        setInsufficientBalanceForTasks(true);
        setUserBalance(res.data.balance || 0);
        return;
      }

      setProduct(res.data.task);
      setRating(0);
      setUserBalance(res.data.balance || 0);
      setIsLuckyOrder(res.data.isLuckyOrder || false);
      setLuckyOrderCapital(res.data.luckyOrderCapitalRequired || 0);

    } catch (err) {
      console.error("Full error object fetching task:", err);
      console.error("Error response data:", err.response?.data);
      console.error("Error response status:", err.response?.status);

      if (err.response?.data?.errorCode === 'LUCKY_ORDER_RECHARGE_REQUIRED') {
        // This is the key fix: Handle the "locked" account state
        setError(err.response.data.message || "A special recharge is required to continue.");
        setIsLuckyOrder(true);
        // The backend doesn't send the capital on this specific error, so we need to handle it gracefully
        // Or, ideally, the backend *should* send it. Let's assume it might not for robustness.
        setLuckyOrderCapital(err.response.data.luckyOrderCapitalRequired || 0); // Default to 0 if not provided
        setProduct(null);
      } else if (err.response?.data?.errorCode === 'INSUFFICIENT_BALANCE_FOR_TASKS') {
        setError(err.response.data.message);
        setInsufficientBalanceForTasks(true);
        setUserBalance(err.response.data.balance || 0);
        setProduct(null);
      } else if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError(err.response?.data?.message || "An unexpected error occurred while fetching your task.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    setError("");
    setMessage("");

    if (!product?.id || rating !== 5) {
      setError("Please provide a 5-star rating to complete the task.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axios.post(
        `${API_BASE_URL}/tasks/submit-rating`,
        { productId: product.id, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      if (res.data.isCompleted) {
        setTimeout(fetchTask, 1500);
      }
    } catch (err) {
      if (err.response?.data?.errorCode === 'LUCKY_ORDER_RECHARGE_REQUIRED') {
        // This is triggered when submitting the rating for a lucky order
        alert(err.response.data.message);
        // We can get the required amount from the error response here
        const requiredAmount = err.response.data.luckyOrderCapitalRequired || luckyOrderCapital;
        navigate("/recharge", { state: { requiredAmount } });
      } else if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError(err.response?.data?.message || "Failed to submit rating.");
      }
    }
  };


  useEffect(() => {
    fetchTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="rating-wrapper"><h2>Loading task...</h2></div>;

  // This block now correctly catches the "locked" account state from the initial fetch
  if (isLuckyOrder && !product) {
    return (
      <div className="rating-wrapper">
        <div className="lucky-order-warning-full-page">
          <h2 className="error-message">{error}</h2>
          <p>
            To unlock your account and continue with your tasks, you must complete the required recharge.
          </p>
          <button className="recharge-button" onClick={() => navigate("/recharge", { state: { requiredAmount: luckyOrderCapital } })}>
            Recharge Now
          </button>
          <button className="back-button" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (insufficientBalanceForTasks) {
    return (
      <div className="rating-wrapper">
        <div className="insufficient-balance-container">
          <h2 className="error-message">{error}</h2>
          <p>Your current balance is ${userBalance.toFixed(2)}. Please recharge to continue with tasks.</p>
          <button className="recharge-button" onClick={() => navigate("/recharge")}>Recharge Now</button>
          <button className="back-button" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (error && !isLuckyOrder) {
    return (
      <div className="rating-wrapper-no">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchTask}>Try Again</button>
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rating-wrapper-no">
        <h2>No new tasks available.</h2>
        <p>You may have completed all your tasks for today.</p>
        <button onClick={fetchTask}>Refresh</button>
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="rating-wrapper">
      <div className="rating-card">
        <img src={product.image_url} alt={product.name} className="rating-image" />
        <h2 className="rating-title">{product.name}</h2>
        <p className="rating-price">Price: ${product.price}</p>

        <div className="rating-financials">
          <p><strong>💰 Your Balance:</strong> ${userBalance.toFixed(2)} </p>
        </div>

        {/* This warning is for when a lucky order is presented but not yet submitted */}
        {isLuckyOrder && (
          <div className="lucky-order-warning">
            <p>
              ⚠️ This is a lucky order! Complete this task to see your high-commission reward. You will be required to recharge <strong>${luckyOrderCapital.toFixed(2)}</strong> to claim it.
            </p>
          </div>
        )}

        <div className="rating-instruction">Rate this product (5 stars to complete task)</div>
        <div className="stars">
          {[...Array(5)].map((_, index) => (
            <FaStar
              key={index} className="star"
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
          disabled={loading || !!message}
        >
          Submit Rating
        </button>
        <button className="back-button" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    </div>
  );
}

export default ProductRatingPage;