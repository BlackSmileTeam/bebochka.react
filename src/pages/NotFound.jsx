import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { usePageSeo } from '../utils/seo'
import './ErrorPages.css'

function readIsLoggedIn() {
  try {
    return !!localStorage.getItem('authToken')
  } catch {
    return false
  }
}

export default function NotFound() {
  const isLoggedIn = readIsLoggedIn()
  const catalogTo = isLoggedIn ? '/' : '/welcome#catalog'
  const catalogLabel = isLoggedIn ? 'В каталог' : 'На главную'

  usePageSeo({
    title: 'Страница не найдена — bebochka',
    description: 'Запрошенная страница не существует.',
  })

  return (
    <PageShell title="Страница не найдена">
      <div className="error-page">
        <p className="error-page__code" aria-hidden="true">
          404
        </p>
        <p className="error-page__text">
          Такой страницы нет или она была перемещена. Проверьте адрес или вернитесь на главную.
        </p>
        <nav className="error-page__actions" aria-label="Полезные ссылки">
          <Link to={catalogTo} className="error-page__link error-page__link--primary">
            {catalogLabel}
          </Link>
          <Link to="/about" className="error-page__link">
            О нас
          </Link>
          <Link to="/contacts" className="error-page__link">
            Контакты
          </Link>
        </nav>
      </div>
    </PageShell>
  )
}
