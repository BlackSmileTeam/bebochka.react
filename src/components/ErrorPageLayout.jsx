import PageShell from './PageShell'
import '../pages/ErrorPages.css'

export function getErrorPageCatalogPath() {
  try {
    return localStorage.getItem('authToken') ? '/' : '/welcome'
  } catch {
    return '/welcome'
  }
}

export default function ErrorPageLayout({ title, code, text, actions, className = '' }) {
  return (
    <PageShell className={`page-shell--error ${className}`.trim()}>
      <div className="error-page">
        {title ? <h1 className="error-page__title">{title}</h1> : null}
        {code ? (
          <p className="error-page__code" aria-hidden="true">
            {code}
          </p>
        ) : null}
        {text ? <p className="error-page__text">{text}</p> : null}
        {actions ? <div className="error-page__actions">{actions}</div> : null}
      </div>
    </PageShell>
  )
}
