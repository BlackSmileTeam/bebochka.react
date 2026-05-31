import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { usePageSeo } from '../utils/seo'
import './ErrorPages.css'

export default function ServerError({ onRetry }) {
  usePageSeo({
    title: 'Ошибка сервера — bebochka',
    description: 'На сервере произошла ошибка.',
  })

  const handleRetry = () => {
    if (typeof onRetry === 'function') {
      onRetry()
      return
    }
    window.location.reload()
  }

  return (
    <PageShell title="Ошибка сервера">
      <div className="error-page">
        <p className="error-page__code" aria-hidden="true">
          500
        </p>
        <p className="error-page__text">
          Что-то пошло не так на нашей стороне. Попробуйте обновить страницу или зайти позже.
        </p>
        <div className="error-page__actions">
          <button type="button" className="btn btn-primary" onClick={handleRetry}>
            Попробовать снова
          </button>
          <Link to="/" className="btn btn-secondary">
            В каталог
          </Link>
        </div>
      </div>
    </PageShell>
  )
}
