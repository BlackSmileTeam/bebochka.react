import { Link } from 'react-router-dom'
import ErrorPageLayout, { getErrorPageCatalogPath } from '../components/ErrorPageLayout'

export default function NotFound() {
  const isLoggedIn = (() => {
    try {
      return !!localStorage.getItem('authToken')
    } catch {
      return false
    }
  })()
  const catalogTo = isLoggedIn ? '/' : '/welcome#catalog'
  const catalogLabel = isLoggedIn ? 'В каталог' : 'На главную'

  return (
    <ErrorPageLayout
      title="Страница не найдена"
      code="404"
      text="Такой страницы нет или она была перемещена. Проверьте адрес или вернитесь на главную."
      actions={(
        <>
          <Link to={catalogTo} className="error-page__btn error-page__btn--primary">
            {catalogLabel}
          </Link>
          <Link to="/about" className="error-page__btn error-page__btn--secondary">
            О нас
          </Link>
          <Link to="/contacts" className="error-page__btn error-page__btn--secondary">
            Контакты
          </Link>
        </>
      )}
    />
  )
}
