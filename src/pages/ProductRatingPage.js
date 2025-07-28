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
  const [insufficientBalanceForTasks, setInsufficientBalanceForTasks] = useState(false); // New state

  const fetchTask = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    setInsufficientBalanceForTasks(false); // Reset this state on new fetch
    try {
      const token = localStorage.getItem("token");
      if (!token) { navigate("/login"); return; }

      const res = await axios.get(`${API_BASE_URL}/tasks/task`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Check for the specific error code from the backend
      if (res.data.errorCode === 'INSUFFICIENT_BALANCE_FOR_TASKS') {
        setError(res.data.message);
        setInsufficientBalanceForTasks(true);
        setProduct(null); // Ensure no product is displayed
        setUserBalance(res.data.balance || 0); // Update balance even if task is null
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

    if (isLuckyOrder && userBalance < luckyOrderCapital) {
      const shortfall = luckyOrderCapital - userBalance;
      alert(
        `This is a lucky order! Your current balance is $${userBalance.toFixed(2)}. Please recharge the remaining $${shortfall.toFixed(2)} to proceed.`
      );
      navigate("/recharge", { state: { requiredAmount: shortfall } });
      return; 
    }

    if (!product?.id || rating !== 5) {
      setError("Please provide a 5-star rating to complete the task.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      // Simplified body, as server now determines profit/capital
      const res = await axios.post(
        `${API_BASE_URL}/tasks/submit-rating`,
        { productId: product.id, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      if (res.data.isCompleted) {
        setTimeout(fetchTask, 1500); // Fetch a new task after success
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit rating.");
    }
  };

  useEffect(() => {
    fetchTask();
  }, []);

  if (loading) return <div className="rating-wrapper"><h2>Loading task...</h2></div>;
  
  // Display specific message for insufficient balance
  if (insufficientBalanceForTasks) {
    return (
      <div className="rating-wrapper">
        <h2 className="error-message">{error}</h2>
        <p>Your current balance is ${userBalance.toFixed(2)}. Please recharge to continue with tasks.</p>
        <button onClick={() => navigate("/recharge", { state: { requiredAmount: 2.00 - userBalance } })}>Recharge Now</button> {/* Suggest recharge for the minimum amount */}
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  // Existing error display for other errors
  if (error) return <div className="rating-wrapper"><h2>Error: {error}</h2><button onClick={fetchTask}>Try Again</button><button onClick={() => navigate("/dashboard")}>Back to Dashboard</button></div>;
  if (!product) return <div className="rating-wrapper"><h2>No new tasks available.</h2><button onClick={fetchTask}>Refresh Tasks</button><button onClick={() => navigate("/dashboard")}>Back to Dashboard</button></div>;

  const shortfall = isLuckyOrder && userBalance < luckyOrderCapital ? luckyOrderCapital - userBalance : 0;
  
  return (
    <div className="rating-wrapper">
      <div className="rating-card">
        <img src={product.image_url} alt={product.name} className="rating-image" />
        <h2 className="rating-title">{product.name}</h2>
        <p className="rating-price">Price: ${product.price}</p>

        <div className="rating-financials">
          <p><strong>💰 Your Balance:</strong> ${userBalance.toFixed(2)} </p>
          <p><strong>📈 Profit if you rate:</strong> ${product.profit?.toFixed(2)}</p>
        </div>

        {isLuckyOrder && (
          <div className="lucky-order-warning">
            {userBalance < luckyOrderCapital ? (
              <>
                ⚠️ Lucky Order! You need to recharge <strong>${shortfall.toFixed(2)}</strong> to proceed.
                <button onClick={() => navigate("/recharge", { state: { requiredAmount: shortfall } })}>
                  Continue to Recharge
                </button>
              </>
            ) : (
              <>✅ Lucky Order! Your balance is sufficient.</>
            )}
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