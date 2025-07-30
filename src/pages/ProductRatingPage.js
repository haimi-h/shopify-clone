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
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/tasks/task`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.errorCode === 'INSUFFICIENT_BALANCE_FOR_TASKS') {
        setError(res.data.message);
        setInsufficientBalanceForTasks(true);
        setProduct(null);
        setUserBalance(res.data.balance || 0);
        return;
      }
      // If the backend indicates a lucky order recharge is required upon fetching the task
      // This happens if user.required_recharge_amount is set on the backend
      if (res.data.errorCode === 'LUCKY_ORDER_RECHARGE_REQUIRED') {
        setError(res.data.message); // The message from the backend
        setIsLuckyOrder(true); // Still mark as a lucky order
        setLuckyOrderCapital(res.data.luckyOrderCapitalRequired || 0); // Get the required capital
        setProduct(null); // No product to display yet, user needs to recharge first
        return;
      }


      setProduct(res.data.task);
      setRating(0);
      setUserBalance(res.data.balance || 0);

      const isLucky = res.data.isLuckyOrder || false;
      const luckyCapital = res.data.luckyOrderCapitalRequired || 0;
      setIsLuckyOrder(isLucky);
      setLuckyOrderCapital(luckyCapital);

    } catch (err) {
      console.error("Error fetching task:", err);
      setError(err.response?.data?.message || "Failed to load task.");
      setProduct(null);
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

    // Removed the client-side check for isLuckyOrder and userBalance < luckyOrderCapital.
    // The backend's submitTaskRating will now handle the check for required_recharge_amount
    // and return the 'LUCKY_ORDER_RECHARGE_REQUIRED' error code if a recharge is needed.

    if (!product?.id || rating !== 5) {
      setError("Please provide a 5-star rating to complete the task.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/tasks/submit-rating`,
        { productId: product.id, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      if (res.data.isCompleted) {
        // If the task is completed (including lucky order after recharge)
        // or if it's an ordinary task completed, fetch a new task.
        setTimeout(fetchTask, 1500);
      }
    } catch (err) {
      // Handle the specific LUCKY_ORDER_RECHARGE_REQUIRED error from backend
      if (err.response?.data?.errorCode === 'LUCKY_ORDER_RECHARGE_REQUIRED') {
        alert(err.response.data.message); // Display the message from the backend
        // Use luckyOrderCapital from state to navigate to recharge, as it was fetched with the task
        navigate("/recharge", { state: { requiredAmount: luckyOrderCapital } });
      } else {
        setError(err.response?.data?.message || "Failed to submit rating.");
      }
    }
  };

  useEffect(() => {
    fetchTask();
  }, []);

  if (loading) return <div className="rating-wrapper"><h2>Loading task...</h2></div>;

  if (insufficientBalanceForTasks) {
    return (
      <div className="rating-wrapper">
        <div className="insufficient-balance-container">
          <h2 className="error-message">{error}</h2>
          <p>Your current balance is ${userBalance.toFixed(2)}. Please recharge to continue with tasks.</p>
          <button className="recharge-button" onClick={() => navigate("/recharge", { state: { requiredAmount: 2.00 - userBalance } })}>Recharge Now</button>
          <button className="back-button" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // If a lucky order recharge is required from the initial fetchTask, display this.
  // This case handles when required_recharge_amount is set on the user in the backend.
  if (isLuckyOrder && luckyOrderCapital > 0 && product === null) {
      return (
          <div className="rating-wrapper">
              <div className="lucky-order-warning-full-page">
                  <h2 className="error-message">{error || "A lucky order requires a specific recharge."}</h2>
                  <p>
                      To proceed with your lucky order, you need to recharge <strong>${luckyOrderCapital.toFixed(2)}</strong>.
                  </p>
                  <button className="recharge-button" onClick={() => navigate("/recharge", { state: { requiredAmount: luckyOrderCapital } })}>
                      Recharge Now
                  </button>
                  <button className="back-button" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
              </div>
          </div>
      );
  }

  if (error && !insufficientBalanceForTasks) return <div className="rating-wrapper-no"><h2>Error: {error}</h2><button onClick={fetchTask}>Try Again</button><button onClick={() => navigate("/dashboard")}>Back to Dashboard</button></div>;
  if (!product) return <div className="rating-wrapper-no"><h2>No new tasks available.</h2><button onClick={fetchTask}>Refresh Tasks</button><button onClick={() => navigate("/dashboard")}>Back to Dashboard</button></div>;

  return (
    <div className="rating-wrapper">
      <div className="rating-card">
        <img src={product.image_url} alt={product.name} className="rating-image" />
        <h2 className="rating-title">{product.name}</h2>
        <p className="rating-price">Price: ${product.price}</p>

        <div className="rating-financials">
          <p><strong>💰 Your Balance:</strong> ${userBalance.toFixed(2)} </p>
        </div>

        {/* MODIFICATION START: Removed the balance check to always show this message for lucky orders */}
        {isLuckyOrder && (
          <div className="lucky-order-warning">
            <>
              ⚠️ Lucky order with a profit of <strong>${product.profit ? parseFloat(product.profit).toFixed(2) : 'N/A'}</strong>. You need to recharge <strong>${luckyOrderCapital.toFixed(2)}</strong> to proceed.
              <button onClick={() => navigate("/recharge", { state: { requiredAmount: luckyOrderCapital } })}>
                Continue to Recharge
              </button>
            </>
          </div>
        )}
        {/* MODIFICATION END */}

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
          disabled={loading || message.includes("completed")}
        >
          Submit Rating
        </button>
        <button className="back-button" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    </div>
  );
}

export default ProductRatingPage;