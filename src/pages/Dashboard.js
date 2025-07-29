import "../Dashboard.css";
import {
  FaUser,
} from "react-icons/fa";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import ChatWidget from "../pages/ChatWidget"; // Make sure to import ChatWidget
import { LanguageContext } from '../pages/LanguageProvider';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [idx, setIdx] = useState(0);
  const phones = ["+4479616687", "+1234567890", "+1987654321", "+441234567890"];
  const faqs = [
    { question: "How do I start earning?", answer: "You can start earning by clicking the “START MAKING MONEY” button and completing tasks or sharing your affiliate links." },
    { question: "How do I track my orders?", answer: "Orders can be tracked via the “Orders” section in the sidebar. You'll see real-time updates there." },
    { question: "Where can I view my payments?", answer: "All payment history and upcoming payouts are available under the “Profile” or “Payments” tab in your account dashboard." },
  ];
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (index) => setOpenFaq((prev) => (prev === index ? null : index));

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  const [balanceInUsd, setBalanceInUsd] = useState(0);
  const [rawTrxBalance, setRawTrxBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // State to control chat widget visibility
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialChatMessage, setInitialChatMessage] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
        handleLogout();
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (location.state?.openChat) {
      setIsChatOpen(true);
      if (location.state.initialChatMessage) {
        setInitialChatMessage(location.state.initialChatMessage);
      }
    }
  }, [location.state]);

  // Dashboard.js

  const fetchLiveBalance = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoadingBalance(true);
    try {
      // These API calls are correct and efficient
      const userProfilePromise = axios.get(`${API_BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pricePromise = axios.get('https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd');
      
      const [userResponse, priceResponse] = await Promise.all([userProfilePromise, pricePromise]);
      
      const userData = userResponse.data.user;
      const trxPrice = priceResponse.data.tron.usd; // This is the price of 1 TRX in USD

      // --- CORRECTED LOGIC STARTS HERE ---

      // Get the user's balance from the database, which we know is in USD.
      // Default to 0 if it's not available.
      const userWalletBalanceUSD = parseFloat(userData.wallet_balance) || 0;

      // 1. Set the main display balance directly to the USD value.
      setBalanceInUsd(userWalletBalanceUSD);

      // 2. Calculate the TRX equivalent for the small, secondary display.
      // We do this by dividing the USD balance by the price of one TRX.
      // We also check if trxPrice is valid to avoid dividing by zero.
      if (trxPrice > 0) {
        setRawTrxBalance(userWalletBalanceUSD / trxPrice);
      } else {
        setRawTrxBalance(0); // If price is unavailable, show 0 TRX
      }
      
    } catch (error) {
      console.error("Failed to fetch live balance:", error);
      // If anything fails, reset balances to 0 to avoid showing stale data.
      setBalanceInUsd(0);
      setRawTrxBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchLiveBalance();
  }, [location, fetchLiveBalance]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        setProductsError(null);
        const response = await axios.get(`${API_BASE_URL}/products`);
        setProducts(response.data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProductsError("Failed to load products.");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [API_BASE_URL]);

  useEffect(() => {
    const t = setInterval(() => setIdx((prev) => (prev + 1) % phones.length), 1000);
    return () => clearInterval(t);
  }, [phones.length]);

  return (
    <main className="main-content">
      <header className="dashboard-header">
        <div className="user-info">
          <FaUser className="icon" />
          {user && <span className="username">{user.username}</span>}
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>

        <div className="balance">
          {loadingBalance ? (
            <span className="amount">Loading...</span>
          ) : (
            <>
              <span className="amount">{balanceInUsd.toFixed(2)}</span>
              <span className="currency">$</span>
              <small className="raw-balance">{rawTrxBalance.toFixed(2)} TRX</small>
              <button onClick={() => navigate("/recharge")} className="add-balance-button" title="Add Funds">+</button>
            </>
          )}
        </div>
      </header>

      <section className="product-section">
        <h2>Top Products</h2>
        {loadingProducts ? (
          <p>Loading products... ⏳</p>
        ) : productsError ? (
          <p style={{ color: 'red' }}>Error: {productsError} 🙁</p>
        ) : products.length > 0 ? (
          <div className="product-scroll">
            {products.map((product) => (
              <div className="product-card" key={product.id} onClick={() => navigate("/product-rating", { state: { product } })}>
                <img src={product.image} alt={product.name} className="product-image" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/175x175/cccccc/white?text=No+Image"; }} />
                <div className="product-name">{product.name}</div>
                <div className="product-price">${product.price ? product.price.toFixed(2) : 'N/A'}</div>
              </div>
            ))}
          </div>
        ) : (
          <p>No products found. 😔</p>
        )}
      </section>
      <div className="congrats-text">
        <div className="slide-in">🎉 Congratulations to {phones[idx]}</div>
      </div>
      <button className="start-button" onClick={() => navigate("/order-dashboard")}>START MAKING MONEY</button>
      <section className="additional-info">
        <h2>About Us</h2>
        <p>We are committed to offering curated, trending, and premium products through our platform.</p>
        <h3>Latest Incident</h3>
        <p>No reported incidents at this time.</p>
        <h3>TRC</h3>
        <p>Transparency Reporting Center - All transactions and activity are monitored for your security.</p>
        <h3>FAQ</h3>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div className={`faq-item ${openFaq === index ? "active" : ""}`} key={index}>
              <div className="faq-question" onClick={() => toggleFaq(index)}>{faq.question}</div>
              <div className="faq-answer">{faq.answer}</div>
            </div>
          ))}
        </div>
        <section className="partnered-section">
          <h2>Partnered With</h2>
          <div className="partners-logos">
            {/* <div className="partner-logo-placeholder">Partner 1</div> */}
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" />
            <img src="https://img.icons8.com/?size=160&id=pfLFk3O4JqAB&format=png" alt="Etsy" />
            <img src="data:image/png;base64,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" alt="Alibaba" />
            
            {/* <div className="partner-logo-placeholder">Partner 2</div>
            <div className="partner-logo-placeholder">Partner 3</div> */}
          </div>
        </section>
      </section>
      <ChatWidget
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialMessage={initialChatMessage}
      />
    </main>
  );
}