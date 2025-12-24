import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Admin from './pages/Admin'
import AdminProducts from './pages/AdminProducts'
import AdminUsers from './pages/AdminUsers'
import AdminAnnouncements from './pages/AdminAnnouncements'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import PrivateRoute from './components/PrivateRoute'
import './App.css'

function App() {
  return (
    <Router>
      <CartProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
            <Route path="admin/products" element={<PrivateRoute><AdminProducts /></PrivateRoute>} />
            <Route path="admin/users" element={<PrivateRoute><AdminUsers /></PrivateRoute>} />
            <Route path="admin/announcements" element={<PrivateRoute><AdminAnnouncements /></PrivateRoute>} />
          </Route>
        </Routes>
      </CartProvider>
    </Router>
  )
}

export default App

