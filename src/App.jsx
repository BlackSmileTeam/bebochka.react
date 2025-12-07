import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Admin from './pages/Admin'
import AdminProducts from './pages/AdminProducts'
import PrivateRoute from './components/PrivateRoute'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
          <Route path="admin/products" element={<PrivateRoute><AdminProducts /></PrivateRoute>} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

