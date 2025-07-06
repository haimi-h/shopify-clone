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
// import LanguageGlobe from './pages/LanguageGlobe';
import AccountPage from './pages/AccountPage';
import ReferralCode from './pages/ReferralCode';
import AdminPage from './pages/admin/AdminPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import VIPSettings from './pages/admin/VIPSettings';
import ReferralManagement from './pages/admin/ReferralManagement';
import TransactionManagement from './pages/admin/TransactionManagement';
import UserTable from './pages/UserTable';
import InjectionPlan from './pages/InjectionPlan';
import ProductRatingPage from './pages/ProductRatingPage';
// import RequireAdmin from './pages/admin/RequireAdmin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>
           
           {/* <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
            */}
           <Route path="/orders" element={<OrdersPage />} />
           <Route path="/account" element={<AccountPage />} />
           <Route path="/dashboard" element={<Dashboard />} />
           <Route path="/selector" element={<LanguageSelector />} />
           <Route path="/order-dashboard" element={<OrderDashboard />} />
           <Route path="/vip" element={<VIPPage />} />
           <Route path="/ordersummary" element={<OrderSummary />} />
           <Route path="/recharge" element={<RechargePage />} />
           <Route path="/referral" element={<ReferralCode />} />
           {/* <Route path="/admin" element={<AdminPage />} /> */}
           <Route path="/admin" element={<AdminDashboard />} />
           <Route path="/records" element={<RecordsPage />} />
           <Route path="/admin/users" element={<UserManagement />} />
           <Route path="/admin/vip" element={<VIPSettings />} />
           <Route path="/admin/referrals" element={<ReferralManagement />} />
           <Route path="/admin/transactions" element={<TransactionManagement />} />
           <Route path="/admin/usertable" element={<UserTable />} />
           <Route path="/admin/injection" element={<InjectionPlan />} />
           {/* <Route path="/ratingPage" element={<ProductRatingPage/>} /> */}
           <Route path="/product-rating" element={<ProductRatingPage />} />
           
           
           
           
           
        </Route>
      </Routes>
      {/* <LanguageGlobe /> */}
    </Router>
  );
}

export default App;

