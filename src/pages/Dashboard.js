import "../Dashboard.css";
import {
  FaUser,
} from "react-icons/fa";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import axios from "axios";
import ChatWidget from "../pages/ChatWidget"; // Import the ChatWidget

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation(); // Get the location object

  // State for ChatWidget - NEWLY ADDED
  const [isChatOpen, setIsChatOpen] = useState(false); // Default to closed
  const [initialChatMessage, setInitialChatMessage] = useState(''); // Default to empty

  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [idx, setIdx] = useState(0);
  const phones = ["+4479616687", "+1234567890", "+1987654321", "+441234567890"];
  const faqs = [
    { question: "How do I start earning?", answer: "You can start earning by clicking the “START MAKING MONEY” button and completing tasks or sharing your affiliate links." },
    { question: "How do I track my orders?", "answer": "Orders can be tracked via the “Orders” section in the sidebar. You'll see real-time updates there." },
    { question: "Where can I view my payments?", answer: "All payment history and upcoming payouts are available under the “Profile” or “Payments” tab in your account dashboard." },
  ];

  // This useEffect will run when the component mounts or when location.state changes
  // NEWLY ADDED for chat state
  useEffect(() => {
    if (location.state && location.state.openChat) {
      setIsChatOpen(true); // Open the chat widget
      if (location.state.initialChatMessage) {
        setInitialChatMessage(location.state.initialChatMessage); // Set the initial message
      }
      // Optional: Clear the state from location after it's used
      // This prevents the chat from re-opening if the user navigates back to dashboard later
      // without this specific state. Use `replace: true` to avoid adding a new history entry.
      // navigate(location.pathname, { replace: true, state: { ...location.state, openChat: false, initialChatMessage: '' } });
    }
  }, [location.state]); // Dependency array: run when location.state changes

  // Existing useEffect for fetching user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate('/login');
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  // Existing useEffect for fetching products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(response.data);
        setProductsError(null);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProductsError('Failed to load products.');
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const toggleFaq = (index) => {
    setIdx(openFaq === index ? null : index);
  };
  const [openFaq, setOpenFaq] = useState(null);


  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="user-info">
          <FaUser className="user-icon" />
          <span>{user ? user.username : 'Guest'}</span>
          <p>Balance: ${user ? user.wallet_balance.toFixed(2) : '0.00'}</p>
        </div>
      </header>

      <section className="dashboard-actions">
        <div className="balance-info">
          <h3>Your Balance</h3>
          <p>${user ? user.wallet_balance.toFixed(2) : '0.00'}</p>
          <button onClick={() => navigate("/recharge")}>Recharge</button>
          <button onClick={() => navigate("/withdraw")}>Withdraw</button>
        </div>
        <div className="user-stats">
          <p>Orders: {user ? user.completed_orders : '0'}/{user ? user.daily_orders : '0'}</p>
        </div>
      </section>

      <section className="products-section">
        <h2>Products</h2>
        {loadingProducts ? (
          <p>Loading products...</p>
        ) : productsError ? (
          <p className="error-message">{productsError}</p>
        ) : (
          <div className="product-list">
            {products.map((product) => (
              <div key={product.id} className="product-item">
                <h3>{product.name}</h3>
                <p>Price: ${product.price.toFixed(2)}</p>
                <p>Commission: {product.commission_rate}%</p>
                <button onClick={() => navigate('/ordersummary', { state: { product } })}>View Details</button>
              </div>
            ))}
          </div>
        )}
      </section>

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

      {/* Render the ChatWidget - Ensure it receives props from Dashboard's state */}
      <ChatWidget
        isOpen={isChatOpen} // Pass the state to control visibility
        setIsOpen={setIsChatOpen} // Pass the setter for ChatWidget to close itself from inside
        initialMessage={initialChatMessage} // Pass the initial message
      />
    </div>
  );
}