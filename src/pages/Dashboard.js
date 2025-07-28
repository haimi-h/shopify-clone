import "../Dashboard.css";
import {
  FaUser,
} from "react-icons/fa";
import { useEffect, useState, useCallback, useContext } from "react"; // Import useContext
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import ChatWidget from "../pages/ChatWidget"; // Make sure to import ChatWidget
import { LanguageContext } from './LanguageGlobe'; // Import LanguageContext

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useContext(LanguageContext); // Consume the translation function from context

  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [idx, setIdx] = useState(0);
  const phones = ["+4479616687", "+1234567890", "+1987654321", "+441234567890"];
  // Use translation keys for FAQ questions and answers
  const faqs = [
    { question: t('faq1Question'), answer: t('faq1Answer') },
    { question: t('faq2Question'), answer: t('faq2Answer') },
    { question: t('faq3Question'), answer: t('faq3Answer') },
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
        setProductsError(t('errorLoadingProducts')); // Translated
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [API_BASE_URL, t]); // Add t to dependency array

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
          <button onClick={handleLogout} className="logout-button">{t('logoutButton')}</button> 
        </div>

        <div className="balance">
          {loadingBalance ? (
            <span className="amount">{t('loadingText')}</span> 
          ) : (
            <>
              <span className="amount">{balanceInUsd.toFixed(2)}</span>
              <span className="currency">{t('currencySymbol')}</span> 
              <small className="raw-balance">{rawTrxBalance.toFixed(2)} TRX</small>
              <button onClick={() => navigate("/recharge")} className="add-balance-button" title={t('addFundsButton')}>+</button> {/* Translated title */}
            </>
          )}
        </div>
      </header>

      <section className="product-section">
        <h2>{t('topProductsHeading')}</h2> 
        {loadingProducts ? (
          <p>{t('loadingProductsText')}</p> 
        ) : productsError ? (
          <p style={{ color: 'red' }}>{productsError} 🙁</p>
        ) : products.length > 0 ? (
          <div className="product-scroll">
            {products.map((product) => (
              <div className="product-card" key={product.id} onClick={() => navigate("/product-rating", { state: { product } })}>
                <img src={product.image} alt={product.name} className="product-image" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/175x175/cccccc/white?text=No+Image"; }} />
                <div className="product-name">{product.name}</div>
                <div className="product-price">{t('currencySymbol')}{product.price ? product.price.toFixed(2) : 'N/A'}</div> {/* Translated currency symbol */}
              </div>
            ))}
          </div>
        ) : (
          <p>{t('noProductsFound')}</p> 
        )}
      </section>
      <div className="congrats-text">
        <div className="slide-in">{t('congratulationsPrefix')} {phones[idx]}</div> 
      </div>
      <button className="start-button" onClick={() => navigate("/order-dashboard")}>{t('startMakingMoneyButton')}</button> 
      <section className="additional-info">
        <h2>{t('aboutUsHeading')}</h2> 
        <p>{t('aboutUsText')}</p> 
        <h3>{t('latestIncidentHeading')}</h3> 
        <p>{t('noReportedIncidents')}</p> 
        <h3>{t('trcHeading')}</h3> 
        <p>{t('trcText')}</p> 
        <h3>{t('faqHeading')}</h3> 
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div className={`faq-item ${openFaq === index ? "active" : ""}`} key={index}>
              <div className="faq-question" onClick={() => toggleFaq(index)}>{faq.question}</div>
              <div className="faq-answer">{faq.answer}</div>
            </div>
          ))}
        </div>
        <section className="partnered-section">
          <h2>{t('partneredWithHeading')}</h2> 
          <div className="partners-logos">
            <div className="partner-logo-placeholder">{t('partnerPlaceholder')} 1</div> 
            <div className="partner-logo-placeholder">{t('partnerPlaceholder')} 2</div> 
            <div className="partner-logo-placeholder">{t('partnerPlaceholder')} 3</div> 
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
