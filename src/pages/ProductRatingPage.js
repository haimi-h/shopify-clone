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
  const [error, setError] = useState(""); // This will now hold the insufficient balance message
  const [message, setMessage] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  const [isLuckyOrder, setIsLuckyOrder] = useState(false);
  const [luckyOrderCapital, setLuckyOrderCapital] = useState(0);

  const MIN_BALANCE_REQUIRED = 2; // Define your minimum required balance here

  const fetchTask = async () => {
    setLoading(true);
    setError(""); // Clear previous errors/messages
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
        // Set the error state instead of an alert
        setError(`Your balance of $${balance.toFixed(2)} is insufficient. A minimum balance of $${MIN_BALANCE_REQUIRED.toFixed(2)} is required to start tasks. Please recharge.`);
        // Don't navigate immediately here unless you want to force navigation.
        // The user will see the message and then decide to click the recharge button.
        setProduct(null); // Ensure no product is displayed
        setLoading(false); // Stop loading to show the message
        return; // Stop further processing
      }

      // --- EXISTING NEW LOGIC TO HANDLE REQUIRED RECHARGE FOR LUCKY ORDER ---
      // This part still uses navigation because it's a specific requirement from the backend
      // for a lucky order that needs a specific capital injection.
      if (isLuckyOrder && res.data.luckyOrderRequiresRecharge) {
        alert(apiMessage); // Keep alert for this specific scenario as per original code
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
      // setLoading(false) is moved into the specific branches where we stop processing,
      // or at the end for successful cases.
    }
  };

  const handleSubmitRating = async () => {
    setError("");
    setMessage("");

    if (!product?.id || rating !== 5) {
      setError("Please provide a 5-star rating to complete the task.");
      return;
    }

    if (isLuckyOrder && userBalance < luckyOrderCapital) {
      // This specific alert is fine to keep as it's a condition *during* submission
      // and directly leads to a recharge action for that specific lucky order.
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
  }, [location.state?.message]);

  // Render logic based on states
  if (loading && !error) return <div className="rating-wrapper"><h2>Loading task...</h2></div>; // Only show loading if no error
  
  // If there's an error (including the balance message)
  if (error) {
    return (
      <div className="rating-wrapper-no">
        <h2>Error: {error}</h2>
        {/* Only show recharge button if the error is due to insufficient balance */}
        {error.includes("insufficient") && (
            <button onClick={() => navigate("/recharge", { state: { requiredAmount: MIN_BALANCE_REQUIRED } })}>
                Recharge Now
            </button>
        )}
        <button onClick={fetchTask}>Try Again</button> {/* This is for other errors */}
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }
  
  // If no product is available (after successful fetch but no task)
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