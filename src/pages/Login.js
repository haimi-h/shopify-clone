// Login.jsx
import "../Auth.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
// import shopifyLogo from '../shopify-logo.png';
import LanguageGlobe from './LanguageGlobe'; // Language switcher component

function Login() {
  const API_URL = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const [phone_number, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Get CSRF cookie (only needed for Sanctum)
      // await axios.get(`${API_URL}/sanctum/csrf-cookie`, { withCredentials: true });
      await axios.get(`${API_URL}`, { withCredentials: true });

      // Step 2: Send login credentials
      const response = await axios.post(
        `${API_URL}/api/login`,
        {
          phone_number,
          password,
        },
        { withCredentials: true }
      );
      localStorage.setItem('token', response.data.access_token);

      // Step 3: Redirect or store user info
      console.log('Login success:', response.data);
      navigate('/dashboard');

    } catch (err) {
      console.error('Login failed:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Top Right Language Selector */}
        <div className="top-right">
          <LanguageGlobe />
        </div>

        {/* Logo */}
        {/* <img src={shopifyLogo} alt="Logo" className="logo" /> */}
        <h2 className="brand-name">Shopify</h2>
        <p className="tagline">Talking</p>

        {/* Error Message */}
        {error && <p className="error-message">{error}</p>}

        {/* Inputs */}
        <input
          type="text"
          placeholder="Phone Number"
          className="auth-input"
          value={phone_number}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Login Button */}
        <button
          className="auth-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'LOG IN'}
        </button>

        {/* Register Link */}
        <Link to="/register" className="auth-link">Create an account</Link>

        {/* Footer */}
        <p className="footer-text">Powered by Shopify</p>
      </div>
    </div>
  );
}

export default Login;
