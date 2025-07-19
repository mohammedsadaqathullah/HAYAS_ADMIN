import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import FoodPage from './pages/FoodPage';
import GroceryPage from './pages/GroceryPage';
import ToyboxzPage from './pages/ToyboxzPage';
import VegetablesAndFruitsPage from './pages/VegetablesAndFruitsPage';
import DeliveryPartnersPage from './pages/DeliveryPartnersPage';
import UsersPage from './pages/UsersPage';
import OrdersPage from './pages/OrdersPage';
import UserOrderLookupPage from './pages/UserOrderLookupPage';
import WithdrawalsPage from './pages/WithdrawalsPage';
import Layout from './components/Layout';
import './styles.css';

const ProtectedRoutes = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/food" element={<FoodPage />} />
        <Route path="/grocery" element={<GroceryPage />} />
        <Route path="/toyboxz" element={<ToyboxzPage />} />
        <Route path="/vegetables-and-fruits" element={<VegetablesAndFruitsPage />} />
        <Route path="/delivery-partners" element={<DeliveryPartnersPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/user-order-lookup" element={<UserOrderLookupPage />} />
        <Route path="/withdrawals" element={<WithdrawalsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

const AppRoutes = () => {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      {!isLoggedIn ? (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </>
      ) : (
        <>
          <Route path="/*" element={<ProtectedRoutes />} />
        </>
      )}
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  );
};

export default App;
