import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import "../ProductRating.css"; // Ensure this CSS file is updated if needed

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

function ProductRatingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); // For true API/logic errors (full page takeover)
  const [infoMessage, setInfoMessage] = useState(""); // For general, full-page informative messages (e.g., general min balance)
  const [message, setMessage] = useState(""); // For success messages (e.g., "Rating submitted")

  // States specific to the lucky order on-card warning
  const [luckyOrderRechargePrompt, setLuckyOrderRechargePrompt] = useState(""); // Holds the specific message
  const [luckyOrderRechargeDetails, setLuckyOrderRechargeDetails] = useState(null); // Holds required amount, injectionPlanId

  const [userBalance, setUserBalance] = useState(0);
  const [isLuckyOrder, setIsLuckyOrder] = useState(false);
  const [luckyOrderCapital, setLuckyOrderCapital] = useState(0); // Capital *required* for the lucky order

  const MIN_BALANCE_REQUIRED = 2; // General minimum balance to even start seeing tasks

  const fetchTask = async () => {
    setLoading(true);
    setError("");
    setInfoMessage("");
    setMessage("");
    setLuckyOrderRechargePrompt(""); // Clear previous lucky order prompts
    setLuckyOrderRechargeDetails(null); // Clear details

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/tasks/task`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { balance, isLuckyOrder, luckyOrderCapitalRequired, task, message: apiMessage, luckyOrderRequiresRecharge, injectionPlanId, product_profit } = res.data;

      setUserBalance(balance || 0);

      // 1. GENERAL MINIMUM BALANCE CHECK (takes over full page)
      if (balance < MIN_BALANCE_REQUIRED) {
        setInfoMessage(`Your balance of $${balance.toFixed(2)} is insufficient. A minimum balance of $${MIN_BALANCE_REQUIRED.toFixed(2)} is required to start tasks.`);
        setProduct(null);
        setLoading(false);
        return;
      }

      // 2. LUCKY ORDER SPECIFIC RECHARGE CHECK (shows warning on the card)
      if (isLuckyOrder && luckyOrderRequiresRecharge) {
        // The message structure from the backend should ideally be like "A recharge of $X.XX is required..."
        // If the backend sends "A recharge of $500.00 is required for this lucky order. Please recharge and wait for admin approval.",
        // we might need to parse it or have the backend send a more direct "required amount".
        // For now, let's craft the message to match your screenshot format.
        setLuckyOrderRechargePrompt(`Lucky order with a profit of $${parseFloat(product_profit || task?.profit).toFixed(2)}. You need to recharge $${luckyOrderCapitalRequired.toFixed(2)} to proceed.`);
        setLuckyOrderRechargeDetails({
            requiredAmount: luckyOrderCapitalRequired,
            injectionPlanId: injectionPlanId,
        });
      }

      // 3. Set the product/task details if available
      if (task === null) {
        setMessage(apiMessage || "No new tasks available.");
        setProduct(null);
      } else {
        setProduct(task);
        setIsLuckyOrder(isLuckyOrder);
        setLuckyOrderCapital(luckyOrderCapitalRequired || 0); // Ensure it's always set
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
    setInfoMessage("");

    if (!product?.id || rating !== 5) {
      setError("Please provide a 5-star rating to complete the task.");
      return;
    }

    // This block should ideally be covered by the disabled button due to luckyOrderRechargePrompt.
    // It's a fallback if direct submission is attempted when a recharge is pending.
    if (luckyOrderRechargePrompt) {
        setError("Please complete the required recharge before submitting the rating.");
        // Optionally, you could try to re-trigger the on-card prompt here if needed.
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
      navigate(location.pathname, { replace: true, state: {} });
    }
    fetchTask();
  }, [location.state?.message]);


  // --- Render Logic ---

  if (loading) {
    return <div className="rating-wrapper"><h2>Loading task...</h2></div>;
  }

  // Full-page error or info message (like general low balance)
  if (error || infoMessage) {
    return (
      <div className="rating-wrapper-no">
        {error && <h2>Error: {error}</h2>}
        {infoMessage && <h2>{infoMessage}</h2>}
        {infoMessage.includes("insufficient") && (
            <button onClick={() => navigate("/recharge", { state: { requiredAmount: MIN_BALANCE_REQUIRED } })}>
                Recharge Now
            </button>
        )}
        <button onClick={fetchTask}>Try Again</button>
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  // No product available
  if (!product) {
    return <div className="rating-wrapper-no"><h2>{message || "No new tasks available."}</h2><button onClick={() => navigate("/dashboard")}>Back to Dashboard</button></div>;
  }

  // Product is available (main display)
  return (
    <div className="rating-wrapper">
      <div className="rating-card">
        <img src={product.image_url} alt={product.name} className="rating-image" />
        <h2 className="rating-title">{product.name}</h2>
        <p className="rating-price">Price: ${parseFloat(product.price).toFixed(2)}</p>
        <div className="rating-financials">
          <p><strong>💰 Your Balance:</strong> ${userBalance.toFixed(2)}</p>
        </div>

        {/* Lucky Order Message as per image_86f7ff.png */}
        {/* Render this ONLY if a lucky order recharge is required (based on luckyOrderRechargePrompt) */}
        {luckyOrderRechargePrompt && luckyOrderRechargeDetails && (
        <div className="lucky-order-recharge-inline-warning">
          <p>⚠️ {luckyOrderRechargePrompt}</p>
          <button
            onClick={() => navigate("/recharge", { state: { ...luckyOrderRechargeDetails } })}
            className="continue-recharge-button"
          >
            Continue to Recharge
          </button>
        </div>
      )}

      {/* Scenario 2: Lucky Order is ACTIVE and READY (NO PENDING RECHARGE) */}
      {/* This div should ONLY show if it's a lucky order AND there's NO pending recharge prompt */}
      {isLuckyOrder && !luckyOrderRechargePrompt && (
        <div className="lucky-order-warning">
          ✅ Lucky Order available! with a Profit: <strong>${parseFloat(product.profit).toFixed(2)}</strong>.
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
          // Disable if loading, if a lucky order recharge is required, or if a success message is showing.
          disabled={loading || !!luckyOrderRechargePrompt || (message && message.includes("completed"))}
        >
          Submit 5-Star Rating
        </button>

        <button className="back-button" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    </div>
  );
}

export default ProductRatingPage;