/** Иконка «добавить товар» (коробка + плюс). */
export default function BoxAddIcon({ className = '', width = 18, height = 18 }) {
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
        d="M20 2H4a2 2 0 0 0-2 2v3h2V4h16v16H4v-3H2v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-8 9h-2v2H8v2h2v2h2v-2h2v-2h-2v-2z"
      />
    </svg>
  )
}
