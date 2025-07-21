import "../Dashboard.css";
import {
  FaUser,
  FaHome,
  FaClipboardList,
  FaDiamond,
  FaHandPointer,
  FaUserCircle,
  FaCog,
} from "react-icons/fa";
import shopifyLogo from "../shopify-logo.png";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Dashboard() {
  const navigate = useNavigate();

  // State to store user information (for displaying username)
  const [user, setUser] = useState(null);

  // State to store fetched products
  const [products, setProducts] = useState([]);

  // Loading state for products fetch
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Error state for product fetch
  const [productsError, setProductsError] = useState(null);

  // State for the animated phone numbers banner
  const [idx, setIdx] = useState(0);
  const phones = ["+4479616687", "+1234567890", "+1987654321", "+441234567890"];

  // FAQ data
  const faqs = [
    {
      question: "How do I start earning?",
      answer:
        "You can start earning by clicking the “START MAKING MONEY” button and completing tasks or sharing your affiliate links.",
    },
    {
      question: "How do I track my orders?",
      answer:
        "Orders can be tracked via the “Orders” section in the sidebar. You'll see real-time updates there.",
    },
    {
      question: "Where can I view my payments?",
      answer:
        "All payment history and upcoming payouts are available under the “Profile” or “Payments” tab in your account dashboard.",
    },
  ];

  // State for FAQ accordion
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  // Define your API base URL. It's crucial this matches your backend server.js.
  // This typically comes from a .env file (e.g., REACT_APP_API_BASE_URL=http://localhost:5000/api)
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  // --- Effect to load user data from localStorage ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
        // If data is broken, log out the user
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
      }
    } else {
      // If no user is stored, redirect to login
      navigate('/login');
    }
  }, [navigate]); // Add navigate to dependency array

  // --- Effect to fetch product data from the backend API ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true); // Set loading to true before fetching
        setProductsError(null);   // Clear any previous errors

        // Make the GET request to your backend product endpoint
        // This assumes your backend has an endpoint like /api/products that returns a list of products
        const response = await axios.get(`${API_BASE_URL}/products`);
        setProducts(response.data); // Update state with fetched products
      } catch (err) {
        console.error("Error fetching products:", err);
        // Set an error message to display to the user
        setProductsError("Failed to load products. Please check your backend server and network connection.");
      } finally {
        setLoadingProducts(false); // Set loading to false once fetching is complete (success or error)
      }
    };

    fetchProducts(); // Call the fetch function when the component mounts
  }, [API_BASE_URL]); // Dependency array: re-run effect if API_BASE_URL changes

  // --- Effect for the animated phone number banner ---
  useEffect(() => {
    const t = setInterval(() => {
      setIdx((prev) => (prev + 1) % phones.length);
    }, 1000);
    return () => clearInterval(t);
  }, [phones.length]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user"); // Ensure all user-related items are removed
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <main className="main-content">
      <header className="dashboard-header">
        <div className="user-info">
          <FaUser className="icon" />
          {/* Display username if available */}
          {user && <span className="username">{user.username}</span>}
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>

        <div className="balance">
          <span className="amount">0.00</span>
          <span className="currency">$</span>
        </div>
      </header>

      <section className="product-section">
        <h2>Top Products</h2>
        {/* Conditional rendering for loading, error, or products */}
        {loadingProducts ? (
          <p>Loading products... ⏳</p>
        ) : productsError ? (
          <p style={{ color: 'red' }}>Error: {productsError} 🙁</p>
        ) : products.length > 0 ? (
          <div className="product-scroll">
            {products.map((product) => (
              <div
                className="product-card"
                key={product.id} // Use product.id as key for better performance and stability
                onClick={() => navigate("/product-rating", { state: { product } })}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-image"
                  // Add an onError fallback for images
                  onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/175x175/cccccc/white?text=No+Image"; }}
                />
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

      <button
        className="start-button"
        onClick={() => navigate("/order-dashboard")}
      >
        START MAKING MONEY
      </button>

      <section className="additional-info">
        <h2>About Us</h2>
        <p>
          We are committed to offering curated, trending, and premium products
          through our platform.
        </p>

        <h3>Latest Incident</h3>
        <p>No reported incidents at this time.</p>

        <h3>TRC</h3>
        <p>
          Transparency Reporting Center - All transactions and activity are
          monitored for your security.
        </p>

        <h3>FAQ</h3>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div
              className={`faq-item ${openFaq === index ? "active" : ""}`}
              key={index}
            >
              <div className="faq-question" onClick={() => toggleFaq(index)}>
                {faq.question}
              </div>
              <div className="faq-answer">{faq.answer}</div>
            </div>
          ))}
        </div>

        <section className="partnered-section">
          <h2>Partnered With</h2>
          <div className="partners-logos">
            {/* Removed specific image URLs as requested */}
            <div className="partner-logo-placeholder">Partner 1</div>
            <div className="partner-logo-placeholder">Partner 2</div>
            <div className="partner-logo-placeholder">Partner 3</div>
            {/* You can replace these with actual SVG icons or other placeholders */}
          </div>
        </section>
      </section>
    </main>
  );
}
