import { Link } from 'react-router-dom'
import ErrorPageLayout, { getErrorPageCatalogPath } from '../components/ErrorPageLayout'
import { usePageSeo } from '../utils/seo'

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

  const catalogPath = getErrorPageCatalogPath()

  return (
    <ErrorPageLayout
      title="Ошибка сервера"
      code="500"
      text="Что-то пошло не так на нашей стороне. Попробуйте обновить страницу или зайти позже."
      actions={(
        <>
          <button type="button" className="error-page__btn error-page__btn--primary" onClick={handleRetry}>
            Попробовать снова
          </button>
          <Link to={catalogPath} className="error-page__btn error-page__btn--secondary">
            В каталог
          </Link>
        </>
      )}
    />
  )
}
