import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import "../ProductRating.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

function ProductRatingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  const [isLuckyOrder, setIsLuckyOrder] = useState(false);
  const [luckyOrderCapital, setLuckyOrderCapital] = useState(0);

  const MIN_BALANCE_REQUIRED = 2; // Define your minimum required balance here

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

      const { balance, isLuckyOrder, luckyOrderCapitalRequired, task, message: apiMessage } = res.data;

      setUserBalance(balance || 0); // Always update balance first

      // --- RE-INTRODUCING THE GENERAL MINIMUM BALANCE CHECK ---
      if (balance < MIN_BALANCE_REQUIRED) {
        alert(`Your balance of $${balance.toFixed(2)} is insufficient. A minimum balance of $${MIN_BALANCE_REQUIRED.toFixed(2)} is required to start tasks. Please recharge.`);
        navigate("/recharge", { state: { requiredAmount: MIN_BALANCE_REQUIRED } });
        return; // Stop further processing if balance is too low
      }

      // --- EXISTING NEW LOGIC TO HANDLE REQUIRED RECHARGE FOR LUCKY ORDER ---
      if (isLuckyOrder && res.data.luckyOrderRequiresRecharge) {
        alert(apiMessage);
        navigate("/recharge", {
          state: {
            requiredAmount: luckyOrderCapitalRequired,
            injectionPlanId: res.data.injectionPlanId,
          },
        });
        return;
      }

      if (task === null) {
        setMessage(apiMessage || "No new tasks available.");
        setProduct(null);
      } else {
        setProduct(task);
        setIsLuckyOrder(isLuckyOrder);
        setLuckyOrderCapital(luckyOrderCapitalRequired);
      }

    } catch (err) {
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

    if (!product?.id || rating !== 5) {
      setError("Please provide a 5-star rating to complete the task.");
      return;
    }

    // This check is still valid for lucky orders, but the primary guard
    // is now at the start of fetchTask and the luckyOrderRequiresRecharge from API.
    if (isLuckyOrder && userBalance < luckyOrderCapital) {
      alert(`Your balance of $${userBalance.toFixed(2)} is insufficient for this lucky order, which requires $${luckyOrderCapital.toFixed(2)}. Please recharge.`);
      navigate("/recharge", { state: { requiredAmount: luckyOrderCapital } });
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
        setTimeout(fetchTask, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit rating.");
    }
  };

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
    fetchTask();
  }, [location.state?.message]); // Add location.state.message to dependency array for re-fetch after recharge

  if (loading) return <div className="rating-wrapper"><h2>Loading task...</h2></div>;
  if (error) return <div className="rating-wrapper-no"><h2>Error: {error}</h2><button onClick={fetchTask}>Try Again</button></div>;
  if (!product) return <div className="rating-wrapper-no"><h2>{message || "No new tasks available."}</h2><button onClick={() => navigate("/dashboard")}>Back to Dashboard</button></div>;

  return (
    <div className="rating-wrapper">
      <div className="rating-card">
        <img src={product.image_url} alt={product.name} className="rating-image" />
        <h2 className="rating-title">{product.name}</h2>
        <p className="rating-price">Price: ${parseFloat(product.price).toFixed(2)}</p>

        <div className="rating-financials">
          <p><strong>💰 Your Balance:</strong> ${userBalance.toFixed(2)}</p>
        </div>

        {isLuckyOrder && (
          <div className="lucky-order-warning">
            ✅ Lucky Order! Profit: <strong>${parseFloat(product.profit).toFixed(2)}</strong>. Capital of <strong>${luckyOrderCapital.toFixed(2)}</strong> required.
          </div>
        )}

        <div className="rating-instruction">Rate this product (5 stars to complete task)</div>
        <div className="stars">
          {[...Array(5)].map((_, index) => (
            <FaStar
              key={index} className="star"
              color={(hover || rating) > index ? "#ffc107" : "#e4e5e9"}
              size={40}
              onClick={() => setRating(index + 1)}
              onMouseEnter={() => setHover(index + 1)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </div>

        {message && <p className="success-message">{message}</p>}

        <button
          className="submit-rating-button"
          onClick={handleSubmitRating}
          disabled={loading || (message && message.includes("completed"))}
        >
          Submit 5-Star Rating
        </button>
        <button className="back-button" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    </div>
  );
}

export default ProductRatingPage;