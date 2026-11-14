import {Navigate, Route, Routes, useLocation} from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import {useAuth} from '@/context/AuthContext';
import AccountLayout from '@/pages/account/AccountLayout';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminCoupons from '@/pages/admin/AdminCoupons';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminProducts from '@/pages/admin/AdminProducts';
import CartPage from '@/pages/CartPage';
import CatalogPage from '@/pages/CatalogPage';
import CheckoutPage from '@/pages/CheckoutPage';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import OrderDetailsPage from '@/pages/account/OrderDetailsPage';
import OrdersPage from '@/pages/account/OrdersPage';
import ProductPage from '@/pages/ProductPage';
import ProfilePage from '@/pages/account/ProfilePage';
import RegisterPage from '@/pages/RegisterPage';
import WishlistPage from '@/pages/account/WishlistPage';
import type {ReactNode} from 'react';

function RequireAuth({children}: {children: ReactNode}) {
  const {user, initializing} = useAuth();
  const location = useLocation();
  if (initializing) return null;
  if (!user) return <Navigate to="/login" state={{from: location.pathname}} replace />;
  return children;
}

function RequireAdmin({children}: {children: ReactNode}) {
  const {user, initializing} = useAuth();
  if (initializing) return null;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<CatalogPage />} />
        <Route path="products/:slug" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route
          path="checkout"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="account"
          element={
            <RequireAuth>
              <AccountLayout />
            </RequireAuth>
          }
        >
          <Route index element={<ProfilePage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderNumber" element={<OrderDetailsPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
        </Route>
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="coupons" element={<AdminCoupons />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
