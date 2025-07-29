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
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQUAAACUCAMAAACtBczxAAABAlBMVEXmLQT/////mQDm5ubl5eXk5OTy8vL7+/vu7u7p6en4+Pj19fX/ngDkAADmHgDnMwT0cwPrZ1nmX1Dm9fb98O//lQCxHwDpWFjrb2/vwL/3ysP75+btra3+9/f/r1mpAADnQjLx19bscWf3fgHpPwPQJwP639zy3t741dP75t/oT0LuhYb/jQD2///se3TnOCftc2D0tKzmLy76vYvvXQTsTAPDJAKxHR7ujIHulo7yoZjoYWLmMRX307r3t3f7lDf9mCn4qF/r3ND9s3D+4szv1cP8o1P8n0bzxaP/yJ36qXD1lVLLbmfjn5zUhYC2NjXrc1Dgrqi7NiLCXVG8ST7nPT/CFhSRAAAWJklEQVR4nO1de3vaONa3RjbypVYLMdMAcUJIh1ISoKSXAUpnu9O57e50dmf37ff/Kq+utnyXbSDZ51n90bhIGJ2fj3SuOjYAabYJoUMvIIRmh/xFFvkAkYuOBU1HDOE9ZIjjkguP9NiI91isxyF3cQF69fHND3/59M1x2qe/vnnz8UcHyh80PXLhklmzOdHZ2nS2jpiTSy8YHTCmg/UAQiHrIXRAaNRHwSxCAVo/fvz86e6u3z8SBqT1+/27u0+fP74Kq1DwjotCES8QJujfHREAFYu7/pufAhselhcs02JjTNPkFJEPIEdB9NAhHAXSw1FI9qCPn785JhNkgOj/8BE6/ImTOTlythwFcsF7yEUuHcASPYQO0zRs0joeafSC/u2oF4keT36Q6emc/fT50wkh4Dh8+vyz20nPKX/60ZCIQlftMejj9/jjNy2gwkYANSPGyHv8ZGVaJutZ/HByDBgOf3njmfzxI/XxwwxjcDaOGcOEsocNMciqECiQC44ChHJxQbFJxMsusbhcB1KxAMJfHgIDCkP/F/OMo2BHGyKZE6PVTG0SZPsWmwQhjKMAxZBcFASGpuQFaEK5IQpeiIQj7fnpQRhB4PDpo5NCwZS8IOmQs4VmhILgBVMMMRzSPISQSy9c8rdD/tr0A5v87Ygemw5hPS7vcTpyiPfxAUFgMHTUOXk2nySbLe1BtrhgQ1x1iPwOEjLCEjKCXPDHb3EZ4ckeW/aQIYIxRM9vp5QM+TBAS0o0Sz5+S24SliV7HNkjZIRlSQqtKn3BrNIXHpYTBAyOvr4Ay7QmU6JgRRuilu74kHuCCsMhdEfJSYSBTE9dEZKTULQiyBAnXhHhIwCBwmDZrlwRSBCUXBFmekXQHvodl60IKNVQM5YwfHlEkjJaBCbnECQZwz3762MAgcDwmTErpcNzxGzp42eQOJJCeiEYA8rlUSIpTU19Abx5HCAQGP7WURaBtr5gNkDBS6Pw6tdHg8KvP8JqFMwyFCBDgXSZQPAL/zYUKJjxiog4ifagR8MKBIYfFL6HbooOM8kLyorgQwxmXtCWuajq8fLkw5PTtCwKn35yC2bbqaYwqTXBtNbUyWhNsYyAaVYgk+vf3Nw8O3Yjv9H/Jo1E/01YpjVlZMSBtCb4c4IVnjzp37x99+JpTjOKPzOKR5QOffHu7U0/AQRhhrZaE7E3OAqRlwWaQoOGVtKAIkMEL/zWVzG4effUOG17+u5GxeHut6QBJfwvckM0k4YgsEyoeFlc0pjbAZEL5qFwxUWih3koyIUnh3hQERBPbp7iE2NAG356E8PQ/zVgjhUyNyQvPEEH6sgLWw6J6KAXhiWWEN0KhKQke4K6hNgmkTCgmGr26i5+DO8eAgOGwztlFj/LrcDMNa2QalqZsqedl8WL9sb+2weCgLWnz6J5vHFBgZfFLNCaIt0xz+NmSk+VQCHaClSPm/Qv3T0oCKS9FezQ/4WjIL0sZtrjRnpSHjc5hHpZiNaECCeRK0QumC8FSB8E+QDRHpd84kHqf6F2BB0if/vdA4NgGO/k82B0OHy2nA5KkM39SKwHyh6H0MN6GKkGEvRS9xJypBNJOJ6QdDxFbpmoZ8RR6L94aAxIe8FhuHtpxz4w5kDzMnRkKGRDpKQ0M5JS+heshOkQScrfGApPHgMIBIYnXFY6hZISCknpmBlJSboyXhbdCB1D4cmpdYSi9pTC0P+bc5wIHR3DvSxpZ8PfCRc+eeiNMW5vCQz9v5+ZkUshcstnUDCliWi5EQrcvOikmic/8+JOz4s7O4tLgsLNY2EFwgw3BIVLVDR9z0vQpl7Qf0tjU1ZhbMo6IyjcPbx4iBtRn/qXQmuqjE1FWlPL2BRF4dlDU55ozwQKjbQmRYM2Iw1aap5moQZNULh7HPJBtnd3AoWi4ERCg45sBI4CWRXCquhIA6pDJCq3qBzW43S44dFRhniX/WcPZTzkN/ysf7lg1hEjiKgI8WyZAUUI6jjCgOo4zMYitDNSK7wsxbGpy0ehL6ntRf/yrDI2JSms52UpzGW5vHlcrECY4ebyrJ2XxUzrjqYZZYekc1n4Vnn5thqF796/f//dd63J+07vPvjt5Vk6lyUyoGLdUeaymGouCyrSsm2pZWfsCBrABpeVusJ3779l7X1bEPhtvq2E4enlWdqOsCvtIW5HpCP3+V+wpW1ii+D+2WUVK9DJX11dtYbhvfZ98CVQ4vMyzwBJSBI9jkohyvcvSOaRWpOZyeg5+4evAcLvX/74viUM8j5X1dzg/wMksjhq+BcaRugqUSCP8GqAUPjyn2T6++YokPv88zpE4eiqEk2BQpOMnlxekEgV+5rO/lW+IsgjvPqDjgXX1dOvuM+f7D6DqypmwP/K5wVJYcQLZoYXGsamQLcahRGbPfi+DQqEFb5H/D7VKHQXqelrxdgysSmNjB4otCYNFKZ89v9uyQvf89ugahR6xVrTkWJTFSiQhyh54d8aQu5QKLTUmqR+WZ0BrMcLFIVrPv3/tJIR7xUUKu6j8kI6AzjmhVytiSwNnkbryovcXF/1QmdfIA9RovB7S0n5f/w2o2oUuou8aasfuLlpzXac0WPJfJcooyeTv2DFGT1nvSqt6f3VgE//j6sWIBjGt78DIWsqtaYuSEtKNaMnm79QnvtarS+Y1SgYQlKCQYVmUdH8PyQKVSMFCk0yemJ9AWZ1R5jSHWGsL1SjgF8LVm6JwpDfZlN5G4lCpC+YkVs+ldGTF5uK7QhpWjkgbXh4KdNKAwXD59MHLVEI+V00YO+CInsoYyklKERJm9J2bEG4LW1KmydFdxzbjlOfkVu5O9L5C3XndRtPBN5rY4l7iyjj2U7ZlLYtTStJIbkQNiXZHQWHZ/0LhWdlTC19wYh5ed2GGfCG3yTQQSHjX4Cxf8Eq8y/w3e7wWpNKQBte8KfaULbWmurnxGugYHxdMALCSXMY8Fx7WyjVoCv8jonMFk/k7nTUDzI99GKhMStjNeMUtJCV/oXgp/vqsWR3TM82Q1CUpiTzlhhBqmVtRbGpVDwiLzalg0K0JBozA54LY2St4aIQkjIbjzBlPMJMxyPaxqa0UHgeCBqaouB/EXLmg87PZXVHQUedjB5L/wydHi8Y+zWnYdSQGfBc7I3Dsc7oLtCMU5ppXlDdDnaxQyLtmVjo7I4GXoq9baBDRbbtxa4Q3mr9Wm9R6VjJTwc2hPjISQBnO6jJe5BIAGcMpyspKRnCokKNmAF3A8kKeiickdkizvslRyKkxDdlijtMZfTE+kLhiSF9rYlObCPoGH1tAMO9kDHhVkvIKFpTsxNDJShYaa2pDgqR/ghm9aUlXsvvao7vnZkNM3oQzXiDDqQZb4DmwnV42h+UyX2QGx5Q9Di8RxcF3BOiDuzqwuAvxTeDid5XxYpAdEU4kCf3wSi5j/YQCgUd5GnyHpq+qMSmoGJTqvmOiOY78nOasJ5NyWnZClrAsh4MfnchvqirdCVsSqCGHaG0jSFCufmOuRk91bmv2igYvljcANWCwV964nujveZPpfwLdXJftbQm2Exr4nOTlgAINvo7pL8MJA990AWvhdaUmxOfcN3nZ/RooxCvbxDusO5jjUHQkw8xCo1y4l3VTMoYUAkLRO3R3R3Z7KKtAa19LcHv75D8yq7G7/TOYnOv2BCMSXWj8xH82cqzMrDwrEwzfUFMbydpAiMN/QfvZ9H49arGz5ToC5GfJHtWpk11mjooxJKfcvh96bLA+H6ziAavdXdGgcIJY1MNUDC+uBFl0+W4EAeMx8uYEQgn1PqVstiUWRqbclWHhC0uvISHgn7QSfR4rp41FU/Q36KYuOG2h/P2PIznt0PQFARqTamzFX/t9PQTPiQ+JDpbS2NTTHxkY1NWHJviMrSWpBTN3wQxeWi6Xq58X2EJjH1/tbyYhQoIW12JIu+RlJSKiZiKykBBany2ttk56xpaUwTDB4XVifIwHe7I0vB5w+PubjgL1AGjZd1fqIxNlZ6zbpTRUxsFA4/XINHCMAiueQuCACU7h8/r/0Ch1lSZ0VN6krAkD7o+CmSakxHQa0TNrH9/hoJXWKSlLA9aUBX5qfNrcWTPWdfbHeU8/a0ODqNd7uZZefc6uSzJWhyMREVf0K3L0ggFsjvsL6YhKG3Twb6Z5z6pLxyypl+b2FT+VP3xdljMEMFwN9fSsitROGBsKrsi6sSmCiaL95PtOr0bcgi256umGOjFpgqyu9JqRNLeyPTYQvXQik2VALF6TpCYBnJxuMF0sF0+L1Yqte7aXejTkTCtyk4Yl2YAt0KBAYFXX7/Oe7zNv35d4VYQGDlZHOl4hFwerTKAvXb6wtFbC32hJBvcymT0HJAXjtCqeaHstLnDVg1LpKeLRV6wmn6yx0sNeZwoLOhaF7NlF4IOcVxKXCR6+L5wehlxtNZCRoh1flwvy2laW33hfyiUroh2GT0nbjkrwtTM6JE2pZvniT+wTXnkVmVTOsU25fEygE/e6mcAN8mD/i/RmpqgUBqnbJvRI1qLw2N1mszualAVu2byiyxIUccHvapO5D5Iw71FcpKpizw6mtf0q5IROLaL6KXfna58diXa8VB4ROemcG804iFW/Hw6nRiTEAx7/nokW8vzEqUotKzpJzN6UnHKjlLTTzdO6Q9k/g7Nd5y8pg74wUqkeYHWp0ZKUagRp0ygwKoxsLQPl58298iFSAhRevhRAleeQy+JWeN9ABDPdiUooHPf34UTn0DzsveataNJF4ICS19xE7NV6Ih6xAUtVsFPm5d64pvkL/hbNFqDC1+igI37tU8Z5KUf7QvKviH+RNuF0p3aX3DmMo0CkxHmCWv6FaOAh2DTAzMaoRcoPF+OOQpyyLzLv43H3e6e0tW93dxOWHh6POnh8flmjknn8nazZJFKjHvL7e2EAbQ/J5/mh/9b5LIoKJjaWlOJl4VGXvD9iGWrchT84XTnqyjg5WzK0tZWg9F6b+D5jub5BsMlkSSTV8PtMEQbH29ozDIY0qW12k4RjVKMCRyDAIBwlpsiVaQ1Zc5NWZkIHa/pR+0ImgHGtlPHEVFOmuNGUXAcgYIj3tUAi70s/hcwxHjLktgFCgFZHwwFHpKk1IOAPHma1TDHeD4E4HpIaA6WGC9RGILFcEI2ExAOZ4jl029CNNySwWvDmIFgt5sBNM/5eYGCpIMl91E6HEfwguNYkkIeraVDGAoi39Hh2YDywBiUlSpgQQ2Lot0Rj4eAsO6HcPQcp1AId2vatuTz/YhIEX8TAsISK0Le5H417g0B4onTw/k9Jn3rr+PxfAZC/+sMbPd4PxnM/WXYuTfIRrPNU0dZvqM83AULa/rRfEee9icpzNT0K8l91To3hW/RdMye9jKNgmhUiOIxAhdEjO7ImCVasCw2bEzBkJAJZveYYrljm+lqCjb3U/ec/segPDby6d/8fSErKWG92FTtmn4FKOzXNO0A+7dkf0zzwow1Jj38CZGmYHjPviByl/wNQhQFcmd8DkbP72nbXxDYyALaze/pGpoHYDaZ3xuFKLSJ0Mm9MlvTL1UUvUp3pHRvP5B2OwXPsUBhlNgXfFbWxifrYEqD82RBiDRIPA7R/By9ovJhCcJXvAXkez26UY4Gk3vD39Hg3nSXG9ZXdMecmn4w8TRBVNPPjGr6KS1T3i/bVXI+At+CqO0yKCgDaWIwk6aE98XhB7wKw/E5ms7ZbcJgFNA2CoY+Xm3XQyIbdnvD732he+Yod3dk1lQFEbmtPOuztq/pfghC0ci2VowCXxGDFUNBnInylwiRXYKhcB4GtxPRKN6+v5oMGPNgH883L3PV8PRZGUVrkobgSbQmPAfT5Ydz2j5MwdJPScpYdxyPwHo5onmtBIVwzlWjIdkCBApENmzZcCZa2Wboz4PgnAla7F8QiItQOFgl5MZeFkxVZ04qWfjXKRRWc9p68xUleLT3dwD0fIIC4W9KLNkpxgIFmi4b7ugmspx28X633vvYn4PgfDVd0k8HuUfY02foUgdty85NFVatchNVq9Q6UG7hyQAfRRnfdDs3ngcLRVKKWH2woYckyTbvD8GCohAgMFtTnZBojEvAUGAaVbgejKhknZDvrDfkBkN6l+F2c51/dpudDPDk4fKoalWm7G9O1SrxbA/iiSc0xMda/Blaz0cBRQFRFOR+EQbLWyIOmYowQ9P9EJxvaXIbGvWIBr10Z3P+9Q3LcAiJJYZ7LP0lnM0xVSlB0RGiFmdrxTo/iJeFGD3x3o3nk8l+MiFaQ5dYSPR/so17y66wpiYToj/f+vvdxcUSc2uqK9RCH28vLrZjhpb/+uLiy2u6J/grMnSbn/LTPgNYo6afhpclodRxbU9+qnrcVCuZS0puX/CP4huQT5VLHF0VpLvknLnP1PSzi8/c80NCAHA7gnGSNKCgNKBkjyN6DhWbivWF1k14WfhsuYnIrAVJISXadsRLb6HoUc9NudLwiN1LbsK9JIdENf1anKNPtEOiMAGufNWeK3dHN13TL6IwckkVZfQU1WVRsjhq5+cWtAOiwA7lNMviaJoBXPtgYEE7JApr0DY25dJdQvKCzO7KnKGLfE1OqzIjSlttBzrn6XWaRCF9hk6jpl+p3VRslrgt6w8pc2+e4Ji+00t1ulkavPQHsTUlVSLdjB4Zm0KnibrVaf7p39KJHl3QGvfclu+bKjo3lX15c8QL+uccT9T8rVf8Vu+Kmn6ZQ4aZyjSJc4hRj3v96FC4lrP1is9T5lJoG1C66FQZIfWFdAaw8iIyL8hz9zxgw/PMm5zjeISQEdk6bq3f0nnxuJjB39V/S6dOBnBZDWBy32m9c35Hbnh1DVO8UHjmvnFNv0S5dPbCbKRZJ+REDW/LapxX1fTjkXv+zj3+rjpmQNETBPTle6ymH0sZtrlpRYvjcdOqo1cz5jSNWuiUDp7XzGr6ucy0srkBxWr6cQq5AeXQt2MwOuwWNf3IVunUqKdw7IY3KMfVmHPC+LA1/SgK149GTPDyVm3f0tnsPffe9tGgsOUbe2V2V4HfkZkXesXEvcwHi0P5Wlo2PFlkJpmdbTGFTWNTnOFsnaISx294HCYef/2ztU3f0smX3dnw/uFhwPdDVqM6CtAeKDZVWdNP6iHW2Z8PrjthmkWIYrdzkwzg3Do0dq4B1VGNFdnTqVU05Bgg7NfpOZXU+iw4TynER9FL3aF8J2G6ph/tYV7vzp8PuijweBDNqQPjmn4wuTycdGkNWolC0tGgpp+S8CY8/IMHXBR0ObhQme0havrp5zXFKFhno+7xUrzLMcDdkFd9jmbbLK9J2hvFOW6J8G5skkAlkr3YNCnf2B6Er5sFSM9JzDbKcYOqaRVRiJI5brk2ZfTqqopXcMkC5N5itjz5ssCr5QwkZptN7nNzZ6uSahe/b6q6pl9ksQsZajt/LhsWj2iIwX45CGN5iNQAbUFNv5qxKX2tSW60dGgw2xoHiy1UQOAbmwEEyobYUmtqmBMfOaTNqAeBcDqYrGhg/YjnYWjkfrUcXFuOk6snH6imX64POuvV9TJKCX3jjBsSJLab+bHMi1Vvsx1cO+zdmknlLbdyX2LaCQqT5Qv/H7+arQVrHn+tAAAAAElFTkSuQmCC" alt="Aliexpress" />
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