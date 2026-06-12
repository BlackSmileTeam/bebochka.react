import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import RouteFallback from './components/RouteFallback'
import AppErrorBoundary from './components/AppErrorBoundary'
import './App.css'

const AdminApp = lazy(() => import('./AdminApp.jsx'))

const Home = lazy(() => import('./pages/Home'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const ShopAuth = lazy(() => import('./pages/ShopAuth'))
const Profile = lazy(() => import('./pages/Profile'))
const Contacts = lazy(() => import('./pages/Contacts'))
const About = lazy(() => import('./pages/About'))
const Delivery = lazy(() => import('./pages/Delivery'))
const Faq = lazy(() => import('./pages/Faq'))
const UserAgreement = lazy(() => import('./pages/UserAgreement'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const Landing = lazy(() => import('./pages/draft/Landing'))
const AdminReviews = lazy(() => import('./pages/AdminReviews'))
const NotFound = lazy(() => import('./pages/NotFound'))
const ServerError = lazy(() => import('./pages/ServerError'))

function LazyPage({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

/** / — welcome для гостей, каталог для авторизованных */
function RootRedirect() {
  const token = localStorage.getItem('authToken')
  if (!token) {
    return <Navigate to="/welcome" replace />
  }
  return (
    <PrivateRoute>
      <LazyPage>
        <Home />
      </LazyPage>
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
              <Route path="welcome" element={<LazyPage><Landing /></LazyPage>} />
              <Route index element={<RootRedirect />} />
              <Route path="contacts" element={<LazyPage><Contacts /></LazyPage>} />
              <Route path="about" element={<LazyPage><About /></LazyPage>} />
              <Route path="delivery" element={<LazyPage><Delivery /></LazyPage>} />
              <Route path="faq" element={<LazyPage><Faq /></LazyPage>} />
              <Route path="terms" element={<LazyPage><UserAgreement /></LazyPage>} />
              <Route path="product/:productIdSlug" element={<LazyPage><ProductPage /></LazyPage>} />
              <Route path="account" element={<LazyPage><ShopAuth /></LazyPage>} />
              <Route
                path="cart"
                element={
                  <PrivateRoute>
                    <LazyPage>
                      <Cart />
                    </LazyPage>
                  </PrivateRoute>
                }
              />
              <Route
                path="checkout"
                element={
                  <PrivateRoute>
                    <LazyPage>
                      <Checkout />
                    </LazyPage>
                  </PrivateRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <PrivateRoute>
                    <LazyPage>
                      <Profile />
                    </LazyPage>
                  </PrivateRoute>
                }
              />
              <Route path="error" element={<LazyPage><ServerError /></LazyPage>} />
              <Route
                path="admin/*"
                element={(
                  <AdminRoute>
                    <LazyPage>
                      <AdminApp />
                    </LazyPage>
                  </AdminRoute>
                )}
              />
              <Route path="reviews" element={<LazyPage><AdminReviews /></LazyPage>} />
              <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
            </Route>
          </Routes>
        </CartProvider>
      </AppErrorBoundary>
    </Router>
  )
}

export default App
