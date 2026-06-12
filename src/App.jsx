import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import AppErrorBoundary from './components/AppErrorBoundary'
import AdminApp from './AdminApp.jsx'
import Home from './pages/Home'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import ShopAuth from './pages/ShopAuth'
import Profile from './pages/Profile'
import Contacts from './pages/Contacts'
import About from './pages/About'
import Delivery from './pages/Delivery'
import Faq from './pages/Faq'
import UserAgreement from './pages/UserAgreement'
import ProductPage from './pages/ProductPage'
import Landing from './pages/draft/Landing'
import AdminReviews from './pages/AdminReviews'
import NotFound from './pages/NotFound'
import ServerError from './pages/ServerError'
import './App.css'

/** / — welcome для гостей, каталог для авторизованных */
function RootRedirect() {
  const token = localStorage.getItem('authToken')
  if (!token) {
    return <Navigate to="/welcome" replace />
  }
  return (
    <PrivateRoute>
      <Home />
    </PrivateRoute>
  )
}

function App() {
  return (
    <Router>
      <AppErrorBoundary>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<Navigate to="/account" replace />} />
            <Route path="/" element={<Layout />}>
              <Route path="welcome" element={<Landing />} />
              <Route index element={<RootRedirect />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="about" element={<About />} />
              <Route path="delivery" element={<Delivery />} />
              <Route path="faq" element={<Faq />} />
              <Route path="terms" element={<UserAgreement />} />
              <Route path="product/:productIdSlug" element={<ProductPage />} />
              <Route path="account" element={<ShopAuth />} />
              <Route
                path="cart"
                element={
                  <PrivateRoute>
                    <Cart />
                  </PrivateRoute>
                }
              />
              <Route
                path="checkout"
                element={
                  <PrivateRoute>
                    <Checkout />
                  </PrivateRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route path="error" element={<ServerError />} />
              <Route
                path="admin/*"
                element={(
                  <AdminRoute>
                    <AdminApp />
                  </AdminRoute>
                )}
              />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </CartProvider>
      </AppErrorBoundary>
    </Router>
  )
}

export default App
