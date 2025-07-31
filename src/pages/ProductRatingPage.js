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
  const [error, setError] = useState(""); // For true API/logic errors (full page takeover)
  const [infoMessage, setInfoMessage] = useState(""); // For general, full-page informative messages (e.g., general min balance)
  const [message, setMessage] = useState(""); // For success messages (e.g., "Rating submitted")

  // States specific to the lucky order on-card warning
  const [luckyOrderRechargePrompt, setLuckyOrderRechargePrompt] = useState(""); // For the yellow on-card message
  const [luckyOrderRechargeDetails, setLuckyOrderRechargeDetails] = useState(null); // To store required amount, injectionPlanId

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

      const { balance, isLuckyOrder, luckyOrderCapitalRequired, task, message: apiMessage, luckyOrderRequiresRecharge, injectionPlanId } = res.data;

      setUserBalance(balance || 0);

      // 1. GENERAL MINIMUM BALANCE CHECK (takes over full page)
      // If user balance is below general min, display infoMessage and stop here.
      if (balance < MIN_BALANCE_REQUIRED) {
        setInfoMessage(`Your balance of $${balance.toFixed(2)} is insufficient. A minimum balance of $${MIN_BALANCE_REQUIRED.toFixed(2)} is required to start tasks.`);
        setProduct(null); // Ensure no product is displayed if this message is showing
        setLoading(false);
        return;
      }

      // 2. LUCKY ORDER SPECIFIC RECHARGE CHECK (shows warning on the card)
      // If it's a lucky order and requires recharge, set the prompt for display on the card.
      // Do NOT set product to null or return. We want to show the card.
      if (isLuckyOrder && luckyOrderRequiresRecharge) {
        setLuckyOrderRechargePrompt(apiMessage || `A recharge of $${luckyOrderCapitalRequired.toFixed(2)} is required to proceed with this lucky order.`);
        setLuckyOrderRechargeDetails({
            requiredAmount: luckyOrderCapitalRequired,
            injectionPlanId: injectionPlanId,
        });
        // We still set product, isLuckyOrder, luckyOrderCapital below because the card needs them.
      }

      // 3. Set the product/task details if available
      if (task === null) {
        setMessage(apiMessage || "No new tasks available.");
        setProduct(null);
      } else {
        setProduct(task);
        setIsLuckyOrder(isLuckyOrder); // Keep this to show the general lucky order info
        setLuckyOrderCapital(luckyOrderCapitalRequired || 0);
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
    // We don't clear luckyOrderRechargePrompt here because if it's present,
    // the submit button will be disabled, preventing submission until recharge.

    // Frontend validation: Must rate 5 stars
    if (!product?.id || rating !== 5) {
      setError("Please provide a 5-star rating to complete the task.");
      return;
    }

    // Secondary check for lucky order capital right before submission (should be disabled by UI)
    // This is a safeguard if the button isn't disabled for some reason.
    if (isLuckyOrder && userBalance < luckyOrderCapital) {
      setLuckyOrderRechargePrompt(`Your balance of $${userBalance.toFixed(2)} is insufficient for this lucky order, which requires $${luckyOrderCapital.toFixed(2)}. Please recharge.`);
      setLuckyOrderRechargeDetails({ requiredAmount: luckyOrderCapital, injectionPlanId: location.state?.injectionPlanId }); // Try to get injectionId
      return;
    }

    // Also block if the specific lucky order recharge prompt is active (meaning a recharge is pending)
    if (luckyOrderRechargePrompt) {
        setError("Please complete the required recharge before submitting the rating.");
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
        setTimeout(fetchTask, 2000); // Fetch next task after a delay
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
  }, [location.state?.message]); // Re-run if a message comes via location state


  // --- Render Logic ---

  // 1. Loading state
  if (loading) {
    return <div className="rating-wrapper"><h2>Loading task...</h2></div>;
  }

  // 2. Full-page error or info message (like general low balance)
  // This takes precedence over showing any product.
  if (error || infoMessage) {
    return (
      <div className="rating-wrapper-no">
        {error && <h2>Error: {error}</h2>}
        {infoMessage && <h2>{infoMessage}</h2>}

        {/* Recharge button for general insufficient balance */}
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

  // 3. No product available (after successful fetch, but backend sent no task)
  if (!product) {
    return <div className="rating-wrapper-no"><h2>{message || "No new tasks available."}</h2><button onClick={() => navigate("/dashboard")}>Back to Dashboard</button></div>;
  }

  // 4. Product is available (main display)
  return (
    <div className="rating-wrapper">
      <div className="rating-card">
        <img src={product.image_url} alt={product.name} className="rating-image" />
        <h2 className="rating-title">{product.name}</h2>
        <p className="rating-price">Price: ${parseFloat(product.price).toFixed(2)}</p>
        <div className="rating-financials">
          <p><strong>💰 Your Balance:</strong> ${userBalance.toFixed(2)}</p>
        </div>

        {/* Normal Lucky Order Info (ONLY if no special recharge is required) */}
        {isLuckyOrder && !luckyOrderRechargePrompt && (
          <div className="lucky-order-warning">
            ✅ Lucky Order! Profit: <strong>${parseFloat(product.profit).toFixed(2)}</strong>. Capital of <strong>${luckyOrderCapital.toFixed(2)}</strong> required.
          </div>
        )}

        {/* Special Lucky Order Recharge Warning (ON THE CARD) */}
        {luckyOrderRechargePrompt && luckyOrderRechargeDetails && (
          <div className="recharge-required-warning" style={{ margin: '15px 0', padding: '10px', border: '2px solid #ffc107', borderRadius: '8px', backgroundColor: '#fff3cd' }}>
            <p style={{ color: '#856404', fontWeight: 'bold', margin: 0 }}>⚠️ {luckyOrderRechargePrompt}</p>
            <button
              style={{ width: '100%', padding: '10px', marginTop: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              onClick={() => navigate("/recharge", { state: { ...luckyOrderRechargeDetails } })}
            >
              Continue to Recharge ($ {luckyOrderRechargeDetails.requiredAmount.toFixed(2)})
            </button>
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