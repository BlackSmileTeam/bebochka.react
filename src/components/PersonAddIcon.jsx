/** Иконка «добавить пользователя» (силуэт + плюс). */
export default function PersonAddIcon({ className = '', width = 18, height = 18 }) {
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
        d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H5V5h2V3h2v2h2v2h-2v2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
      />
    </svg>
  )
}
