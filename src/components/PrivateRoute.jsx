import { Navigate, useLocation } from 'react-router-dom'

/**
 * Защита страниц покупателя: без токена — на витрину с общей шапкой (/account), с возвратом после входа.
 */
function PrivateRoute({ children }) {
  const token = localStorage.getItem('authToken')
  const location = useLocation()

  if (!token) {
    const returnUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/account?returnUrl=${returnUrl}`} replace />
  }

  return children
}

export default PrivateRoute
