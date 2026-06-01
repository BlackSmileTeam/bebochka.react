import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import RouteFallback from './components/RouteFallback'

const Admin = lazy(() => import('./pages/Admin'))
const AdminProducts = lazy(() => import('./pages/AdminProducts'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const AdminAnnouncements = lazy(() => import('./pages/AdminAnnouncements'))
const AdminOrders = lazy(() => import('./pages/AdminOrders'))
const AdminUserOrders = lazy(() => import('./pages/AdminUserOrders'))
const AdminTelegramErrors = lazy(() => import('./pages/AdminTelegramErrors'))
const AdminReviews = lazy(() => import('./pages/AdminReviews'))
const AdminIncomingShipments = lazy(() => import('./pages/AdminIncomingShipments'))
const AdminBackup = lazy(() => import('./pages/AdminBackup'))
const AdminReferrals = lazy(() => import('./pages/AdminReferrals'))
const AdminBrands = lazy(() => import('./pages/AdminBrands'))

function LazyAdminPage({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

/** Админ-маршруты — отдельный chunk, не грузится на публичных страницах. */
export default function AdminApp() {
  return (
    <Routes>
      <Route index element={<LazyAdminPage><Admin /></LazyAdminPage>} />
      <Route path="products" element={<LazyAdminPage><AdminProducts /></LazyAdminPage>} />
      <Route path="users" element={<LazyAdminPage><AdminUsers /></LazyAdminPage>} />
      <Route path="announcements" element={<LazyAdminPage><AdminAnnouncements /></LazyAdminPage>} />
      <Route path="orders" element={<LazyAdminPage><AdminOrders /></LazyAdminPage>} />
      <Route path="users/:userId/orders" element={<LazyAdminPage><AdminUserOrders /></LazyAdminPage>} />
      <Route path="reviews" element={<LazyAdminPage><AdminReviews /></LazyAdminPage>} />
      <Route path="incoming-shipments" element={<LazyAdminPage><AdminIncomingShipments /></LazyAdminPage>} />
      <Route path="backup" element={<LazyAdminPage><AdminBackup /></LazyAdminPage>} />
      <Route path="referrals" element={<LazyAdminPage><AdminReferrals /></LazyAdminPage>} />
      <Route path="brands" element={<LazyAdminPage><AdminBrands /></LazyAdminPage>} />
      <Route path="telegram-errors" element={<LazyAdminPage><AdminTelegramErrors /></LazyAdminPage>} />
    </Routes>
  )
}
