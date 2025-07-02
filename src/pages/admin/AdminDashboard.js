// AdminDashboard.jsx
import { Link } from 'react-router-dom';
import '../../AdminDashboard.css';
export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <ul>
        <li><Link to="/admin/users">Manage Users</Link></li>
        <li><Link to="/admin/vip">VIP Settings</Link></li>
        <li><Link to="/admin/referrals">Referral Codes</Link></li>
        <li><Link to="/admin/transactions">Transactions</Link></li>
      </ul>
    </div>
  );
}
