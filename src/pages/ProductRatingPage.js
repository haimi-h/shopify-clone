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
    // Ensure product is null at the start of fetch to prevent flashing old data
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

      // Clear any previous lucky order state if a new task is fetched successfully
      setIsLuckyOrder(false);
      setLuckyOrderCapital(0);

      if (res.data.errorCode === 'INSUFFICIENT_BALANCE_FOR_TASKS') {
        setError(res.data.message);
        setInsufficientBalanceForTasks(true);
        setProduct(null); // Explicitly ensure product is null
        setUserBalance(res.data.balance || 0);
        return;
      }
      // This check is for when the backend sends errorCode for lucky order even on initial fetchTask
      if (res.data.errorCode === 'LUCKY_ORDER_RECHARGE_REQUIRED') {
        setError(res.data.message); // The message from the backend
        setIsLuckyOrder(true); // Still mark as a lucky order
        setLuckyOrderCapital(res.data.luckyOrderCapitalRequired || 0); // Get the required capital
        setProduct(null); // Explicitly ensure product is null
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
      console.error("Full error object fetching task:", err); // Log the full error object
      console.error("Error response data:", err.response?.data); // Log the response data
      console.error("Error response status:", err.response?.status); // Log the status

      // IMPORTANT: Prioritize checking for specific error codes from the backend response data
      if (err.response && err.response.data && err.response.data.errorCode) {
          if (err.response.data.errorCode === 'LUCKY_ORDER_RECHARGE_REQUIRED') {
              setError(err.response.data.message);
              setIsLuckyOrder(true);
              setLuckyOrderCapital(err.response.data.luckyOrderCapitalRequired || 0);
              setProduct(null); // Explicitly ensure product is null
          } else if (err.response.data.errorCode === 'INSUFFICIENT_BALANCE_FOR_TASKS') {
              // This should ideally be handled by a non-error status from backend, but kept for robustness
              setError(err.response.data.message);
              setInsufficientBalanceForTasks(true);
              setProduct(null); // Explicitly ensure product is null
              setUserBalance(err.response.data.balance || 0);
          } else {
              // Handle other custom backend error codes if any
              setError(err.response.data.message || "An unexpected error occurred.");
          }
      } else if (err.response && [401, 403].includes(err.response.status)) {
          // Fallback for generic 401/403 if no specific errorCode is provided in data
          console.warn("Generic 401/403 status without specific error code. Logging out.");
          localStorage.removeItem("token");
          navigate("/login");
      } else {
          // Handle network errors or other unexpected errors (e.g., no err.response)
          setError(err.message || "Failed to load task due to network issue or unexpected error.");
      }
      setProduct(null); // Always ensure product is null on an error path
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
      if (!token) { // Double check token before submitting
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
      // Safely check for err.response before accessing its properties
      if (err.response) {
        if (err.response.data?.errorCode === 'LUCKY_ORDER_RECHARGE_REQUIRED') {
          alert(err.response.data.message);
          navigate("/recharge", { state: { requiredAmount: luckyOrderCapital } });
        } else if ([401, 403].includes(err.response.status)) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError(err.response.data?.message || "Failed to submit rating.");
        }
      } else {
        setError("Network error or server unreachable."); // Generic network error
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

  // Handle general errors that are not specific lucky order or insufficient balance
  if (error && !insufficientBalanceForTasks && !isLuckyOrder) {
    return (
      <div className="rating-wrapper-no">
        <h2>Error: {error}</h2>
        <button onClick={fetchTask}>Try Again</button>
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  // Handle case where no product is available after all other conditions (errors, lucky order) are checked
  if (!product) { // This check should now correctly capture "no tasks available"
    return (
      <div className="rating-wrapper-no">
        <h2>No new tasks available.</h2>
        <button onClick={fetchTask}>Refresh Tasks</button>
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  // Only render the product rating card if `product` is not null
  return (
    <div className="rating-wrapper">
      <div className="rating-card">
        <img src={product.image_url} alt={product.name} className="rating-image" />
        <h2 className="rating-title">{product.name}</h2>
        <p className="rating-price">Price: ${product.price}</p>

        <div className="rating-financials">
          <p><strong>💰 Your Balance:</strong> ${userBalance.toFixed(2)} </p>
        </div>

        {isLuckyOrder && (
          <div className="lucky-order-warning">
            <>
              ⚠️ Lucky order with a profit of <strong>${product?.profit ? parseFloat(product.profit).toFixed(2) : 'N/A'}</strong>. You need to recharge <strong>${luckyOrderCapital.toFixed(2)}</strong> to proceed.
              <button onClick={() => navigate("/recharge", { state: { requiredAmount: luckyOrderCapital } })}>
                Continue to Recharge
              </button>
            </>
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