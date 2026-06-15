import { useLocation } from 'react-router-dom'
import { usePrivateRouteSeo } from '../utils/seo'

/** Закрывает служебные страницы от индексации (корзина, профиль, админка). */
export default function SeoRouteGuard() {
  const { pathname } = useLocation()
  usePrivateRouteSeo(pathname)
  return null
}
