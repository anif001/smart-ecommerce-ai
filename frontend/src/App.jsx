import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import MainLayout from './layouts/MainLayout';
import FloatingCart from './components/FloatingCart';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <MainLayout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                    <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                    <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                    <Route path="/orders/track/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </MainLayout>
              <FloatingCart />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
