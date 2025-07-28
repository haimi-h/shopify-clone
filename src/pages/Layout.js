import '../Dashboard.css';
import {
    FaHome,
    FaClipboardList,
    FaUserCircle,
    FaCog,
    FaUsers,
} from 'react-icons/fa';
import { GiCutDiamond } from 'react-icons/gi';
import shopifyLogo from '../shopify-logo.png';
import { Outlet, useNavigate } from 'react-router-dom';
import ChatWidget from '../pages/ChatWidget'; // <-- 1. Import the new widget

function Layout() {
    const navigate = useNavigate();

    return (
        <div className="dashboard-layout">
            {/* The Chat Widget now lives here, outside the main content */}
            <ChatWidget /> {/* <-- 2. Render the widget */}

            <aside className="sidebar">
                <img src={shopifyLogo} alt="Shopify Logo" className="shopify-logo" />
                <nav className="nav-links">
                    <FaHome title="Home" onClick={() => navigate('/dashboard')} />
                    <FaClipboardList title="Orders" onClick={() => navigate('/order-dashboard')} />
                    <GiCutDiamond onClick={() => navigate('/vip')} />
                    <FaUsers title="Referral" onClick={() => navigate('/referral')} />
                    <FaUserCircle title="Profile" onClick={() => navigate('/account')} />
                    {/* 3. Remove the headset icon since the widget has its own button */}
                    {/* <FaCog title="Settings" /> */}
                    <FaCog title="Settings" onClick={() => navigate('/settings')} />
                    {/* <FaCog title="Settings" onClick={() => navigate('/withdraw')} /> */}
                </nav>
            </aside>

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