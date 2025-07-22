import "../Dashboard.css";
import {
  FaUser,
} from "react-icons/fa";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = true);
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

  const fetchLiveBalance = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoadingBalance(true);
    try {
      const userProfilePromise = axios.get(`${API_BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pricePromise = axios.get('https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd');
      
      const [userResponse, priceResponse] = await Promise.all([userProfilePromise, pricePromise]);
      
      const userData = userResponse.data.user;
      const trxPrice = priceResponse.data.tron.usd;

      if (userData.wallet_balance && trxPrice) {
        setRawTrxBalance(parseFloat(userData.wallet_balance));
        setBalanceInUsd(parseFloat(userData.wallet_balance) * trxPrice);
      } else {
        setRawTrxBalance(0);
        setBalanceInUsd(0);
      }
    } catch (error) {
      console.error("Failed to fetch live balance:", error);
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
          {/* Settings button removed from here */}
        </div>

        <div className="balance">
          {loadingBalance ? (
            <span className="amount">Loading...</span>
          ) : (
            <>
              <span className="amount">{balanceInUsd.toFixed(2)}</span>
              <span className="currency">$</span>
              <small className="raw-balance">{rawTrxBalance.toFixed(2)} TRX</small>
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
            <div className="partner-logo-placeholder">Partner 1</div>
            <div className="partner-logo-placeholder">Partner 2</div>
            <div className="partner-logo-placeholder">Partner 3</div>
          </div>
        </section>
      </section>
    </main>
  );
}