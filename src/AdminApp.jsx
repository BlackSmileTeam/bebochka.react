import { Route, Routes } from 'react-router-dom'
import Admin from './pages/Admin'
import AdminProducts from './pages/AdminProducts'
import AdminUsers from './pages/AdminUsers'
import AdminAnnouncements from './pages/AdminAnnouncements'
import AdminOrders from './pages/AdminOrders'
import AdminUserOrders from './pages/AdminUserOrders'
import AdminTelegramErrors from './pages/AdminTelegramErrors'
import AdminReviews from './pages/AdminReviews'
import AdminIncomingShipments from './pages/AdminIncomingShipments'
import AdminBackup from './pages/AdminBackup'
import AdminReferrals from './pages/AdminReferrals'
import AdminHelpers from './pages/AdminHelpers'
import AdminBrands from './pages/AdminHelpers'

export default function AdminApp() {
  return (
    <Routes>
      <Route index element={<Admin />} />
      <Route path="products" element={<AdminProducts />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="announcements" element={<AdminAnnouncements />} />
      <Route path="orders" element={<AdminOrders />} />
      <Route path="users/:userId/orders" element={<AdminUserOrders />} />
      <Route path="reviews" element={<AdminReviews />} />
      <Route path="incoming-shipments" element={<AdminIncomingShipments />} />
      <Route path="backup" element={<AdminBackup />} />
      <Route path="referrals" element={<AdminReferrals />} />
      <Route path="helpers" element={<AdminHelpers />} />
      <Route path="brands" element={<AdminBrands />} />
      <Route path="telegram-errors" element={<AdminTelegramErrors />} />
    </Routes>
  )
}
