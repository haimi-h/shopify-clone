import React, { useState } from 'react';
import { FaHome, FaBell } from 'react-icons/fa';
import '../OrdersPage.css';
import OrderSummary from './OrderSummary'; // ✅ Import the popup component

const dummyOrders = [
  {
    id: 'UB2410151325426805',
    brand: 'BLACKYAK',
    logo: 'https://pimg.mk.co.kr/meet/neds/2022/04/image_readtop_2022_347932_16503445185014335.jpg',
    total: 3711.0,
    profit: 1669.95,
    time: '2024/10/16 02:25',
    status: 'Pending',
  },
  {
    id: '1',
    brand: 'Ted Baker',
    logo: 'https://1000logos.net/wp-content/uploads/2020/10/Ted-Baker-logo.png',
    total: 1671.0,
    profit: 9.52,
    time: '2024/10/16 02:25',
    status: 'Completed',
  },
  {
    id: '2',
    brand: 'BIKER STARLET',
    logo: 'https://seeklogo.com/images/B/biker-starlet-logo-E01AB79C64-seeklogo.com.png',
    total: 2080.0,
    profit: 11.86,
    time: '2024/10/16 02:24',
    status: 'Completed',
  },
  {
    id: '3',
    brand: 'LOVCAT',
    logo: 'https://cdn.worldvectorlogo.com/logos/lovcat-logo.svg',
    total: 1691.0,
    profit: 9.64,
    time: '2024/10/16 02:24',
    status: 'Completed',
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState(dummyOrders);
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null); // ✅ state for popup

  const filteredOrders = filter === 'All' ? orders : orders.filter(order => order.status === filter);

  const handleSubmitOrder = id => {
    setOrders(orders.map(order => order.id === id ? { ...order, status: 'Completed' } : order));
  };

  const handleSubmitAll = () => {
    setOrders(orders.map(order => order.status === 'Pending' ? { ...order, status: 'Completed' } : order));
  };

  const totalPendingAmount = orders
    .filter(order => order.status === 'Pending')
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="orders-container">
      <div className="top-bar">
        <FaHome size={24} />
        <div className="dots">
          <div></div>
          <div></div>
        </div>
        <FaBell size={24} />
      </div>

      <div className="filters">
        {['All', 'Pending', 'Completed', 'Freezing'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="order-list">
        {filteredOrders.map(order => (
          <div
            className="order-card"
            key={order.id}
            onClick={() => setSelectedOrder(order)} // ✅ open popup on click
          >
            <img src={order.logo} alt={order.brand} className="brand-logo" />
            <div className="order-info">
              <div className="brand-name">{order.brand}</div>
              <div className="order-time">{order.time}</div>
              <div className="order-details">
                <div>
                  <div className="label">Total order</div>
                  <div className="value">${order.total.toFixed(2)}</div>
                </div>
                <div>
                  <div className="label">Profit</div>
                  <div className="value">${order.profit.toFixed(2)}</div>
                </div>
              </div>
            </div>
            {order.status === 'Pending' ? (
              <button className="submit-btn" onClick={(e) => {
                e.stopPropagation(); // prevent popup
                handleSubmitOrder(order.id);
              }}>
                SUBMIT
              </button>
            ) : (
              <span className="completed-badge">Completed</span>
            )}
          </div>
        ))}
      </div>

      <div className="footer">
        <div>Amount: ${totalPendingAmount.toFixed(0)}</div>
        <button className="submit-all-btn" onClick={handleSubmitAll}>
          SUBMIT ALL ORDERS
        </button>
      </div>

      {/* ✅ Order Summary Modal */}
      {selectedOrder && (
        <OrderSummary
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
