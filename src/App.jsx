import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Admin from './pages/Admin'
import AdminProducts from './pages/AdminProducts'
import AdminUsers from './pages/AdminUsers'
import AdminAnnouncements from './pages/AdminAnnouncements'
import AdminOrders from './pages/AdminOrders'
import AdminUserOrders from './pages/AdminUserOrders'
import AdminTelegramErrors from './pages/AdminTelegramErrors'
import AdminReviews from './pages/AdminReviews'
import AdminIncomingShipments from './pages/AdminIncomingShipments'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import ShopAuth from './pages/ShopAuth'
import Profile from './pages/Profile'
import Contacts from './pages/Contacts'
import './App.css'

function App() {
  return (
    <Router>
      <CartProvider>
        <Routes>
          <Route path="/login" element={<Navigate to="/account" replace />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="account" element={<ShopAuth />} />
            <Route path="cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
            <Route path="checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
            <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
            <Route path="admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="admin/users/:userId/orders" element={<AdminRoute><AdminUserOrders /></AdminRoute>} />
            <Route path="admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="admin/incoming-shipments" element={<AdminRoute><AdminIncomingShipments /></AdminRoute>} />
            <Route path="admin/telegram-errors" element={<AdminRoute><AdminTelegramErrors /></AdminRoute>} />
          </Route>
        </Routes>
      </CartProvider>
    </Router>
  )
}

export default App

