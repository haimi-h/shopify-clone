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
import ChatWidget from '../pages/ChatWidget';
import LanguageSelector from '../pages/LanguageProvider'; // Import LanguageSelector

function Layout() {
    const navigate = useNavigate();

    return (
        <div className="dashboard-layout">
            <ChatWidget />

            <aside className="sidebar">
                <img src={shopifyLogo} alt="Shopify Logo" className="shopify-logo" />
                <nav className="nav-links">
                    <FaHome title="Home" onClick={() => navigate('/dashboard')} />
                    <FaClipboardList title="Orders" onClick={() => navigate('/order-dashboard')} />
                    <GiCutDiamond onClick={() => navigate('/vip')} />
                    <FaUsers title="Referral" onClick={() => navigate('/referral')} />
                    <FaUserCircle title="Profile" onClick={() => navigate('/account')} />
                    <FaCog title="Settings" onClick={() => navigate('/settings')} />
                </nav>
            </aside>

            <div className="main-wrapper">
                {/* Position the LanguageSelector within the layout */}
                <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1001 }}>
                    <LanguageSelector />
                </div>

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