/** Иконка «добавить пользователя»: силуэт слева, плюс справа. */
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
        d="M10 12c2.21 0 4-1.79 4-4S12.21 4 10 4 6 5.79 6 8s1.79 4 4 4zm-6 6v-1.5c0-2.21 3.58-4 6-4s6 1.79 6 4V18H4z"
      />
      <path
        fill="currentColor"
        d="M20 10h-2V8h-2v2h-2v2h2v2h2v-2h2v-2z"
      />
    </svg>
  )
}
