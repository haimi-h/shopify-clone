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
import shopifyLogo from "../shopify-logo.png"; // Assuming this path is correct
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Mock product data - in a real app, this would likely come from an API
const products = [
  {
    id: "prod001", // Added unique ID for better identification
    name: "No Ball Pen 50PCS",
    image:
      "https://www.penstore.nl/image/cache/wp/gj/j/jherbin/jherbin_stylo_roller_white-175x175h.webp",
    description: "A pack of 50 high-quality no-ball pens for smooth writing.",
    price: 15.99,
  },
  {
    id: "prod002",
    name: "Gucci Mini Skirt",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThCsIiMiPHjbv9UB_-c1VKdc3-LLpBUaRPeA&s",
    description: "Stylish mini skirt from Gucci, perfect for any occasion.",
    price: 499.00,
  },
  {
    id: "prod003",
    name: "Swim Suit",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHn2y2L-QAcuyWPD1wbaSJ9yEywZvMn6wIag&s",
    description: "Comfortable and fashionable swimsuit for your beach days.",
    price: 35.50,
  },
  {
    id: "prod004",
    name: "Balenciaga T-shirt",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyeN1m42JPG3L5-iYtStU9m5gsKIYLtFpnyg&s",
    description: "Premium Balenciaga t-shirt, a must-have for your wardrobe.",
    price: 250.00,
  },
  {
    id: "prod005",
    name: "All-Star Sneakers",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTa2IyGZoq_6mPJHvxqlzuD9id32GAbj4mKCw&s",
    description: "Classic All-Star sneakers for everyday comfort and style.",
    price: 75.00,
  },
  {
    id: "prod006",
    name: "Champions Hoodie",
    image:
      "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQLyXrBuNSBLOwevSw07U89CPKb3fdz2pygY9SN1rXKFgEjjir97Hv2w4iRG5giQCxIuCsMMxQI_l4nHVpzAfAmQCFQXlNcqRfTH7PO5L6OFW-0UHKa_Xo68BdJtZ4rxsgwabdF9Vo&usqp=CAc",
    description: "Warm and cozy Champions hoodie for your casual days.",
    price: 60.00,
  },
  {
    id: "prod007",
    name: "Calvin Klein Shoulder bag",
    image:
      "https://www.bagage24.nl/out/pictures/generated/product/1/768_768_85/a6/96/c0/a9838d04aca905a3b00a7480ec17a40d_a696c0c57da9ab14d11218b414a950d3.jpg",
    description: "Elegant Calvin Klein shoulder bag for your essentials.",
    price: 120.00,
  },
];

function Dashboard() {
  const [user, setUser] = useState(null); // State for user information (not fully implemented in this snippet)
  const [error, setError] = useState(""); // State for error messages
  const [openFaq, setOpenFaq] = useState(null); // State to manage open/closed FAQ items
  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };
  const [idx, setIdx] = useState(0); // Index for rotating phone numbers in the "Congratulations" message
  const phones = ["+4479616687", "+1234567890", "+1987654321", "+441234567890"];

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
  const API_URL = process.env.REACT_APP_API_URL; // Assuming API_URL is set in .env
  const navigate = useNavigate(); // Hook for programmatic navigation

  // Handles user logout
  const handleLogout = () => {
    localStorage.removeItem("loggedInUser"); // Remove user session data
    localStorage.removeItem("token"); // Also remove the token if stored
    navigate("/login"); // Redirect to login page
  };

  // Effect to rotate phone numbers in the "Congratulations" message
  useEffect(() => {
    const t = setInterval(() => {
      setIdx((prev) => (prev + 1) % phones.length);
    }, 1000);
    return () => clearInterval(t); // Cleanup interval on component unmount
  }, [phones.length]);

  return (
    <main className="main-content">
      <header className="dashboard-header">
        <div className="user-info">
          <FaUser className="icon" />
          {/* This button is specifically for logging out */}
          <button onClick={handleLogout} className="username">
            Logout
          </button>
        </div>

        <div className="balance">
          <span className="amount">0.00</span> {/* Placeholder for user balance */}
          <span className="currency">$</span>
        </div>
      </header>

      <section className="product-section">
        <h2>Top Products</h2>
        <div className="product-scroll">
          {products.map((product, index) => (
            <div
              className="product-card"
              key={product.id || index} // Use product.id if available, fallback to index
              // When a product card is clicked, navigate to the rating page
              // and pass the entire product object as state
              onClick={() => navigate("/ratingPage", { state: { product } })}
            >
              <img
                src={product.image}
                alt={product.name}
                className="product-image"
              />
              <div className="product-name">{product.name}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="congrats-text">
        <div className="slide-in">🎉 Congratulations to {phones[idx]}</div>
      </div>

      <button
        className="start-button"
        onClick={() => navigate("/order-dashboard")} // Navigates to order dashboard
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
            {/* Partner logos - using base64 for one, and external URLs for others */}
            <img
              src="data:image/jpeg;base64,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"
              alt="Google"
              onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/64x64/cccccc/white?text=Google"; }}
            />
            <img
              src="https://static.vecteezy.com/system/resources/previews/019/766/240/non_2x/amazon-logo-amazon-icon-transparent-free-png.png"
              alt="Amazon"
              onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/64x64/cccccc/white?text=Amazon"; }}
            />
            <img
              src="https://img.icons8.com/?size=160&id=pfLFk3O4JqAB&format=png"
              alt="Etsy"
              onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/64x64/cccccc/white?text=Etsy"; }}
            />
            <img
              src="data:image/png;base64,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"
              alt="Alibaba"
              onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/64x64/cccccc/white?text=Alibaba"; }}
            />
          </div>
        </section>
      </section>
    </main>
  );
}

export default Dashboard;
