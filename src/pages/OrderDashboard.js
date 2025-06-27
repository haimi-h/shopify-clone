import React from 'react';
import '../OrderDashboard.css';
import { FaHome, FaList, FaHandPointer, FaUserCircle, FaCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const OrderDashboard = () => {
    const navigate = useNavigate();
  return (
    <div className="order-dashboard">
      {/* Stats Section */}
      <div className="stats-container">
        <div className="stat-box">
          <div className="stat-number">40</div>
          <div className="stat-label">Uncompleted Orders</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">0</div>
          <div className="stat-label">Completed Orders</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">40</div>
          <div className="stat-label">Daily Orders</div>
        </div>
      </div>

      {/* Action Button */}
      <div className="action-button">
        <button  onClick={() => navigate('/orders')}>START ORDER TASK</button>
      </div>
    </div>
  );
};

export default OrderDashboard;
