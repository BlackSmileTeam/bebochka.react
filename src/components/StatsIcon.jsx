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
      <path
        fill="currentColor"
        d="M6 20V10h3v10H6zm5-8V20h3V12h-3zm5 4v4h3v-4h-3z"
      />
    </svg>
  )
}
