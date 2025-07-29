import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Core pages (no layout)
import Login from './pages/Login';
import Register from './pages/Register';

// Layout component
import Layout from './pages/Layout';

// User-facing pages (will be inside Layout)
import Dashboard from './pages/Dashboard';
import OrdersPage from './pages/OrdersPage';
import VIPPage from './pages/VIPPage';
import OrderSummary from './pages/OrderSummary';
import RechargePage from './pages/RechargePage';
import RecordsPage from './pages/RecordsPage';
import OrderDashboard from './pages/OrderDashboard';
import AccountPage from './pages/AccountPage';
import ReferralCode from './pages/ReferralCode';
import ProductRatingPage from './pages/ProductRatingPage';
import ManualPayment from './pages/ManualPayment';
import UserSettingsPage from './pages/UserSettingsPage';
import WithdrawalPage from './pages/WithdrawalPage';

// Admin pages (will be inside Layout)
import AdminDashboard from './pages/admin/AdminDashboard';
import UserTable from './pages/UserTable';
import InjectionPlan from './pages/InjectionPlan';

// Import LanguageProvider and LanguageSelector from the updated file
import { LanguageProvider } from './pages/LanguageProvider'; // <--- ADJUST PATH AS NEEDED
import LanguageSelector from './pages/LanguageProvider'; // <--- LanguageSelector is now the default export from that file

function App() {
  return (
    <Router>
      <LanguageProvider> {/* <--- Wrap your entire application with LanguageProvider */}
        <Routes>
          {/* Routes without the main layout (e.g., login, register) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Login />} /> {/* Default landing page */}

          {/* All routes that should use the shared Layout (with responsive sidebar/bottom navbar) */}
          <Route element={<Layout />}>
            {/* User Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/order-dashboard" element={<OrderDashboard />} />
            <Route path="/vip" element={<VIPPage />} />
            <Route path="/ordersummary" element={<OrderSummary />} />
            <Route path="/recharge" element={<RechargePage />} />
            <Route path="/referral" element={<ReferralCode />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/product-rating" element={<ProductRatingPage />} />
            {/* Use the LanguageSelector component directly if needed on a page */}
            <Route path="/selector" element={<LanguageSelector />} />
            <Route path="/payment" element={<ManualPayment />} />
            <Route path="/settings" element={<UserSettingsPage />} />
            <Route path="/withdraw" element={<WithdrawalPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} /> {/* The new page */}

            {/* Admin Routes - NOW NESTED INSIDE LAYOUT */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/usertable" element={<UserTable />} />
            <Route path="/admin/injection" element={<InjectionPlan />} />
          </Route>

          {/* Catch-all for any unmatched routes, redirects to login */}
          <Route path="*" element={<Login />} />
        </Routes>
      </LanguageProvider>
    </Router>
  );
}

export default App;