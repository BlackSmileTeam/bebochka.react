import './PageShell.css'

/**
 * Единая обёртка страницы: ширина контента и блок заголовка (h1 + подзаголовок + действия справа).
 */
export default function PageShell({ title, subtitle, actions, children, className = '' }) {
  const showHeader = title != null || subtitle != null || actions != null

  return (
    <div className={`page-shell ${className}`.trim()}>
      <div className="page-shell__inner">
        {showHeader && (
          <header className="page-shell__header">
            <div className="page-shell__headline">
              {title != null && title !== '' && (
                <h1 className="page-shell__title">{title}</h1>
              )}
              {subtitle != null && subtitle !== '' && (
                <div className="page-shell__subtitle">{subtitle}</div>
              )}
            </div>
            {actions != null && <div className="page-shell__actions">{actions}</div>}
          </header>
        )}
        <div className="page-shell__body">{children}</div>
      </div>
    </div>
  )
}
