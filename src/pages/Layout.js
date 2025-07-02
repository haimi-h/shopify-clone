import '../Dashboard.css';
import {
  FaUser, FaHome, FaClipboardList,  
  FaHandPointer, FaUserCircle, FaCog,
} from 'react-icons/fa';
import { FaDiamond } from 'react-icons/fa';
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
          {/* <FaDownload title="Downloads" /> */}
          {/* <FaDiamond onClick={() => navigate('/vip')} /> */}
          <GiCutDiamond onClick={() => navigate('/vip')} />
          <FaHandPointer title="Clicks" />
          <FaUserCircle title="Profile" onClick={() => navigate('/account')} />
          <FaCog title="Settings" />
          
          {/* <FaDiamond
  className="icon clickable"
  onClick={() => navigate('/vip')}
  title="Go to VIP"
/> */}
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
