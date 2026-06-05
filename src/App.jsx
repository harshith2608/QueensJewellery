import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext'
import { CartProvider } from './contexts/CartContext'
import { TestModeProvider } from './contexts/TestModeContext'
import TestModeBanner from './components/store/TestModeBanner'
import Toast from './components/ui/Toast'
import Spinner from './components/ui/Spinner'
import ScrollToTop from './components/ScrollToTop'

// ─── Store pages (lazy) ───────────────────────────────────────────────────────
const Home = lazy(() => import('./pages/store/Home'))
const Shop = lazy(() => import('./pages/store/Shop'))
const Category = lazy(() => import('./pages/store/Category'))
const Product = lazy(() => import('./pages/store/Product'))
const Categories = lazy(() => import('./pages/store/Categories'))
const Cart = lazy(() => import('./pages/store/Cart'))
const Checkout = lazy(() => import('./pages/store/Checkout'))
const OrderConfirmation = lazy(() => import('./pages/store/OrderConfirmation'))
const OrderTracking = lazy(() => import('./pages/store/OrderTracking'))
const Search = lazy(() => import('./pages/store/Search'))
const NotFound = lazy(() => import('./pages/store/NotFound'))
const About = lazy(() => import('./pages/store/About'))
const Contact = lazy(() => import('./pages/store/Contact'))
const RefundPolicy = lazy(() => import('./pages/store/RefundPolicy'))
const ShippingPolicy = lazy(() => import('./pages/store/ShippingPolicy'))
const PrivacyPolicy = lazy(() => import('./pages/store/PrivacyPolicy'))
const Terms = lazy(() => import('./pages/store/Terms'))

// ─── Admin pages (lazy) ───────────────────────────────────────────────────────
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminProducts = lazy(() => import('./pages/admin/Products'))
const AdminCategories = lazy(() => import('./pages/admin/Categories'))
const AdminOrders = lazy(() => import('./pages/admin/Orders'))
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'))
const AdminReviews = lazy(() => import('./pages/admin/Reviews'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const AdminNotifyRequests = lazy(() => import('./pages/admin/NotifyRequests'))
const AdminRefunds = lazy(() => import('./pages/admin/Refunds'))

// ─── Fallback ─────────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory">
      <Spinner size="lg" />
    </div>
  )
}

// ─── Protected route for customers ───────────────────────────────────────────
function CustomerProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/" replace />
  return children
}

// ─── Protected route for admin ────────────────────────────────────────────────
function AdminProtectedRoute({ children }) {
  const { isAdmin, loading } = useAdminAuth()

  if (loading) return <PageLoader />
  if (!isAdmin) return <Navigate to="/admin/login" replace />
  return children
}

// ─── Route tree ───────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Store – public */}
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/search" element={<Search />} />

        {/* Store – auth handled inside Checkout */}
        <Route path="/checkout" element={<Checkout />} />
        <Route
          path="/order-confirmation"
          element={
            <CustomerProtectedRoute>
              <OrderConfirmation />
            </CustomerProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <CustomerProtectedRoute>
              <OrderTracking />
            </CustomerProtectedRoute>
          }
        />

        {/* Admin – public login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin – protected layout shell */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="refunds" element={<AdminRefunds />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="notify-requests" element={<AdminNotifyRequests />} />
        </Route>

        {/* Policy pages */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />

        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <CartProvider>
            <TestModeProvider>
              <ScrollToTop />
              <Toast />
              <TestModeBanner />
              <AppRoutes />
            </TestModeProvider>
          </CartProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
