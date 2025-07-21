import "../Dashboard.css";
import {
  FaUser,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Mock product data
const products = [
  {
    id: "prod001",
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
  // ... other products
];

function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (index) => setOpenFaq(prev => (prev === index ? null : index));
  const [idx, setIdx] = useState(0);
  const phones = ["+4479616687", "+1234567890", "+1987654321"];
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const t = setInterval(() => setIdx(prev => (prev + 1) % phones.length), 1000);
    return () => clearInterval(t);
  }, [phones.length]);

  const faqs = [
    {
      question: "How do I start earning?",
      answer: "You can start earning by clicking the “START MAKING MONEY” button and completing tasks.",
    },
    {
      question: "How do I track my orders?",
      answer: "Orders can be tracked via the “Orders” section.",
    },
  ];

  return (
    <main className="main-content">
      <header className="dashboard-header">
        <div className="user-info">
          <FaUser className="icon" />
          <button onClick={handleLogout} className="username">
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
        <div className="product-scroll">
          {products.map((product, index) => (
            <div
              className="product-card"
              key={product.id || index}
              // ✅ CORRECT: This navigates to the rating page and passes the product data in the state.
              onClick={() => navigate("/product-rating", { state: { product } })}
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
        onClick={() => navigate("/order-dashboard")}
      >
        START MAKING MONEY
      </button>

      {/* Other sections like FAQ, etc. */}
    </main>
  );
}

export default Dashboard;