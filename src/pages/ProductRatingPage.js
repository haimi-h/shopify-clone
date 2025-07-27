import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import "../ProductRating.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";
const MIN_REQUIRED_BALANCE_FOR_TASK = 2; // Define the minimum balance

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

  const fetchTask = async () => {
    setLoading(true); // Always set loading to true at the start
    setError("");
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return; // Exit if no token
      }

      const res = await axios.get(`${API_BASE_URL}/tasks/task`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserBalance(res.data.balance || 0);
      const isLucky = res.data.isLuckyOrder || false;
      const luckyCapital = res.data.luckyOrderCapitalRequired || 0;
      setIsLuckyOrder(isLucky);
      setLuckyOrderCapital(luckyCapital);

      // NEW LOGIC: Check for minimum balance for regular tasks
      // If it's not a lucky order AND balance is below minimum
      if (!isLucky && (res.data.balance || 0) < MIN_REQUIRED_BALANCE_FOR_TASK) {
        setError(
          `You can't evaluate products with your current balance. Please recharge at least $${MIN_REQUIRED_BALANCE_FOR_TASK.toFixed(2)} to start tasks.`
        );
        setProduct(null); // Ensure no product is displayed if balance is too low
        // setLoading(false); // REMOVE THIS LINE: setLoading(false) should be in finally
        return; // Stop further execution of fetchTask
      }

      // If checks pass or it's a lucky order, set the product
      setProduct(res.data.task);
      setRating(0); // Reset rating for new task

    } catch (err) {
      console.error("Error fetching task:", err);
      setError(err.response?.data?.message || "Failed to load task.");
      setProduct(null); // Clear product on error
      if ([401, 403].includes(err.response?.status)) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false); // Ensure loading is set to false in all cases (success, error, or early exit due to balance)
    }
  };

  useEffect(() => {
    fetchTask();
  }, []); // Empty dependency array means this runs once on component mount

  // ... (rest of your handleSubmitRating function and JSX)

  const handleSubmitRating = async () => {
    if (rating === 0) {
      setError("Please select a star rating before submitting.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) { navigate("/login"); return; }

      const payload = {
        productId: product.id,
        rating: rating,
        isLuckyOrder: isLuckyOrder,
        luckyOrderCapital: luckyOrderCapital,
      };

      const res = await axios.post(
        `${API_BASE_URL}/tasks/submit-rating`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.isCompleted) {
        setMessage(res.data.message || "Task completed successfully!");
        setProduct(null); // Clear product after successful completion
        // After completing a task, fetch a new one
        fetchTask(); // This will reset loading state correctly
      } else {
        setMessage(res.data.message || "Rating submitted. Try for 5 stars!");
        // If not completed (e.g., less than 5 stars), might stay on same task or get new.
        // For now, let's refetch a new task if not 5 stars or keep the current one
        fetchTask(); // Fetch a new task even if not completed with 5 stars
      }
      setUserBalance(res.data.newBalance); // Update balance after submission

    } catch (err) {
      console.error("Error submitting rating:", err);
      setError(err.response?.data?.message || "Failed to submit rating.");
      if ([401, 403].includes(err.response?.status)) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false); // Ensure loading is turned off after submission attempt
    }
  };

  return (
    <div className="rating-wrapper">
      {loading && <div className="loading-spinner">Loading...</div>} {/* Display loading spinner */}

      {!loading && error && ( // Only show error if not loading
        <div className="rating-wrapper">
          <h2>Error: {error}</h2>
          {error.includes("recharge at least") && (
            <button
              onClick={() =>
                navigate("/recharge", { state: { requiredAmount: MIN_REQUIRED_BALANCE_FOR_TASK } })
              }
            >
              Recharge Now
            </button>
          )}
          <button onClick={fetchTask}>Try Again</button>
          <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      )}

      {!loading && !error && !product && ( // Only show "No new tasks" if not loading, no error, and no product
        <div className="rating-wrapper">
          <h2>No new tasks available.</h2>
          <button onClick={fetchTask}>Refresh Tasks</button>
          <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      )}

      {!loading && !error && product && ( // Only show product if not loading, no error, and product exists
        <div className="rating-card">
          <h3 className="product-name">{product.name}</h3>
          <img
            src={`${API_BASE_URL}${product.image_url}`}
            alt={product.name}
            className="product-image"
          />
          <p className="product-description">{product.description}</p>
          <p className="product-profit">Expected Profit: ${product.profit.toFixed(2)}</p>
          <p className="current-balance">Current Balance: ${userBalance.toFixed(2)}</p>

          {isLuckyOrder && (
            <div className="lucky-order-info">
              {userBalance < luckyOrderCapital ? (
                <>
                  ⚠️ Lucky Order! You need to recharge{" "}
                  <strong>
                    ${(luckyOrderCapital - userBalance).toFixed(2)}
                  </strong>{" "}
                  to proceed.
                  <button onClick={() => navigate("/recharge", { state: { requiredAmount: luckyOrderCapital - userBalance } })}>
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
          {error && !message && <p className="error-message">{error}</p>} {/* This error is now for form submission issues mostly */}

          <button
            className="submit-rating-button"
            onClick={handleSubmitRating}
            disabled={loading || message.includes("completed")} // Disable if loading or task already completed
          >
            Submit Rating
          </button>
          <button className="back-button" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      )}
    </div>
  );
}

export default ProductRatingPage;