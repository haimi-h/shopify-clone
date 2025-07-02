// Login.jsx
import "../Auth.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import shopifyLogo from '../shopify-logo.png';
import LanguageGlobe from './LanguageGlobe';

function Login() {
  const navigate = useNavigate();

  const [phone_number, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (loggedInUser) {
      // Redirect admin to admin page, others to dashboard
      if (loggedInUser.is_admin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  const handleLogin = () => {
    setError('');
    setLoading(true);

    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.phone_number === phone_number && u.password === password);

      if (!user) {
        setError('Invalid phone number or password.');
        setLoading(false);
        return;
      }

      // Mark admin user manually (based on phone number)
      const isAdmin = phone_number === '0911223344'; // 👈 Set your admin number here
      const userWithRole = { ...user, is_admin: isAdmin };

      localStorage.setItem('loggedInUser', JSON.stringify(userWithRole));

      // Redirect based on role
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }

    } catch {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="top-right"><LanguageGlobe /></div>

        <img src={shopifyLogo} alt="Logo" className="logo" />
        <h2 className="brand-name">Shopify</h2>
        <p className="tagline">Talking</p>

        {error && <p className="error-message">{error}</p>}

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

        <button
          className="auth-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'LOG IN'}
        </button>

        <Link to="/register" className="auth-link">Create an account</Link>
        <p className="footer-text">Powered by Shopify</p>
      </div>
    </div>
  );
}

export default Login;
