/** Иконка статистики (столбчатая диаграмма). */
export default function StatsIcon({ className = '', width = 18, height = 18 }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={width}
      height={height}
      aria-hidden="true"
      focusable="false"
    >
      <path fill="currentColor" d="M5 9h2v10H5V9zm4-4h2v14H9V5zm4 6h2v8h-2v-8zm4-3h2v11h-2V8z" />
    </svg>
  )
}
