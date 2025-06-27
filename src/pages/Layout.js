import '../Dashboard.css';
import { FaUser, FaHome, FaClipboardList, FaDownload, FaHandPointer, FaUserCircle, FaCog } from 'react-icons/fa';
import shopifyLogo from '../shopify-logo.png';
import { Outlet } from 'react-router-dom'; // if you're using React Router
import { useNavigate } from 'react-router-dom';

function Layout() {
  const navigate = useNavigate();
  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <img src={shopifyLogo} alt="Shopify Logo" className="shopify-logo" />
        <nav className="nav-links">
          <FaHome title="Home" />
          <FaClipboardList title="Orders" onClick={() => navigate('/order-dashboard')} />
          <FaDownload title="Downloads" />
          <FaHandPointer title="Clicks" />
          <FaUserCircle title="Profile" onClick={() => navigate('/account')} />
          <FaCog title="Settings" />
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <main className="main-content">
          <Outlet /> {/* If using React Router */}
        </main>

        {/* Footer */}
        <footer className="dashboard-footer">
          &copy; {new Date().getFullYear()} All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default Layout;
