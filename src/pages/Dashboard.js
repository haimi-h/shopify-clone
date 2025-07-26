import "../Dashboard.css";
import {
  FaUser,
} from "react-icons/fa";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import ChatWidget from "../components/ChatWidget"; // Import the ChatWidget

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
    { question: "How do I track my orders?","answer": "Orders can be tracked via the “Orders” section in the sidebar. You'll see real-time updates there." },
    { question: "Where can I view my payments?", answer: "All payment history and upcoming payouts are available under the “Profile” or “Payments” tab in your account dashboard." },
  ];
  const [openFaq, setOpenFaq] = useState(null);

  // State for ChatWidget control
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialChatMessage, setInitialChatMessage] = useState('');

  useEffect(() => {
    // Check for state from navigation, e.g., from RechargePage
    if (location.state?.openChat) {
      setIsChatOpen(true);
      if (location.state?.initialChatMessage) {
        setInitialChatMessage(location.state.initialChatMessage);
      }
      // Clear the state so chat doesn't auto-open on subsequent visits
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const fetchUserProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(res.data.user);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Handle error, e.g., redirect to login if token is invalid
      if (err.response && err.response.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  }, [navigate]);

  // Fetch products (unchanged from your original code)
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductsError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProductsError("Failed to load products. Please try again later.");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
    fetchProducts();

    const interval = setInterval(() => {
      setIdx((prevIdx) => (prevIdx + 1) % phones.length);
    }, 5000); // Change phone number every 5 seconds
    return () => clearInterval(interval);
  }, [fetchUserProfile, fetchProducts, phones.length]);


  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>Dashboard</h1>
        <div className="header-icons">
          <FaUser className="icon" />
          {/* Chat icon to manually open/close widget */}
          <span className="icon chat-icon" onClick={() => setIsChatOpen(!isChatOpen)}>💬</span>
        </div>
      </header>

      {user && (
        <section className="user-info">
          <div className="info-box">
            <span>Welcome, {user.username}!</span>
          </div>
          <div className="wallet-balance">
            Wallet Balance: ${parseFloat(user.wallet_balance || 0).toFixed(2)}
          </div>
        </section>
      )}

      <section className="product-display">
        <h2>Featured Products</h2>
        {loadingProducts ? (
          <p>Loading products...</p>
        ) : productsError ? (
          <p className="error-message">{productsError}</p>
        ) : products.length > 0 ? (
          <div className="product-list">
            {products.map((product) => (
              <div key={product.id} className="product-item">
                <img src={product.image_url} alt={product.name} />
                <p>{product.name}</p>
                <p>Profit: ${product.profit}</p>
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

      {/* Render the ChatWidget */}
      <ChatWidget
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        initialMessage={initialChatMessage}
      />
    </div>
  );
}