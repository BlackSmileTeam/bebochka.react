import { Navigate } from 'react-router-dom'

function parseUser() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('authToken')
  const user = parseUser()
  if (!token) {
    return <Navigate to="/account?returnUrl=%2Fadmin" replace />
  }
  if (!user?.isAdmin) {
    return <Navigate to="/" replace />
  }
  return children
}

export default AdminRoute
