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
        d="M4 5h16l-6 7v7l-4-2v-5L4 5z"
      />
    </svg>
  )
}
