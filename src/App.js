// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './pages/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

import OrdersPage from './pages/OrdersPage';
import VIPPage from './pages/VIPPage';
import OrderSummary from './pages/OrderSummary';
import RechargePage from './pages/RechargePage';
import RecordsPage from './pages/RecordsPage';
import OrderDashboard from './pages/OrderDashboard';
import LanguageSelector from './pages/LanguageGlobe';
import LanguageGlobe from './pages/LanguageGlobe';
import AccountPage from './pages/AccountPage';
import ReferralCode from './pages/ReferralCode';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>
           
           
           <Route path="/orders" element={<OrdersPage />} />
           <Route path="/account" element={<AccountPage />} />
           <Route path="/dashboard" element={<Dashboard />} />
           <Route path="/selector" element={<LanguageSelector />} />
           <Route path="/order-dashboard" element={<OrderDashboard />} />
           <Route path="/vip" element={<VIPPage />} />
           <Route path="/ordersummary" element={<OrderSummary />} />
           <Route path="/recharge" element={<RechargePage />} />
           <Route path="/referral" element={<ReferralCode />} />
           <Route path="/records" element={<RecordsPage />} />
           
           
        </Route>
      </Routes>
      <LanguageGlobe />
    </Router>
  );
}

export default App;

// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import HomePage from './pages/HomePage';
// import OrdersPage from './pages/OrdersPage';
// import VIPPage from './pages/VIPPage';

// export default function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<HomePage />} />
//         <Route path="/orders" element={<OrdersPage />} />
//         <Route path="/vip" element={<VIPPage />} />
//       </Routes>
//     </Router>
//   );
