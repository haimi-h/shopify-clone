import '../Dashboard.css';
import {
  FaUser,
  FaHome,
  FaClipboardList,
  FaHandPointer,
  FaUserCircle,
  FaCog,
  FaUsers, // <--- Import FaUsers here for the referral icon
} from 'react-icons/fa';
import { FaDiamond } from 'react-icons/fa'; // FaDiamond is already imported, but listed separately
import { GiCutDiamond } from 'react-icons/gi';
import shopifyLogo from '../shopify-logo.png';
import { Outlet, useNavigate } from 'react-router-dom';

function Layout() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <img src={shopifyLogo} alt="Shopify Logo" className="shopify-logo" />
        <nav className="nav-links">
          <FaHome title="Home" onClick={() => navigate('/dashboard')} />
          <FaClipboardList title="Orders" onClick={() => navigate('/order-dashboard')} />
          
          <GiCutDiamond onClick={() => navigate('/vip')} />
          {/* <FaHandPointer title="Clicks" /> */}

          {/* New Referral Icon */}
          <FaUsers title="Referral" onClick={() => navigate('/referral')} /> {/* <--- ADD THIS LINE */}

          <FaUserCircle title="Profile" onClick={() => navigate('/account')} />
          <FaCog title="Settings" />
        </nav>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <main className="main-content">
          <Outlet />
        </main>

        <footer className="dashboard-footer">
          &copy; {new Date().getFullYear()} All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default Layout;