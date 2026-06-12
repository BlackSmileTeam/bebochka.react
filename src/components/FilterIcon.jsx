/** Иконка воронки фильтра (как в каталоге). */
export default function FilterIcon({ className = '', width = 18, height = 18 }) {
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
        d="M4 6h16l-6.2 7.4V19l-3.8-1.9v-5.7L4 6z"
      />
    </svg>
  )
}
