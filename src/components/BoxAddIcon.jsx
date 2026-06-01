/** Иконка «добавить товар» — коробка с плюсом (assets/icons8). */
export default function BoxAddIcon({ className = '', width = 18, height = 18 }) {
  return (
    <img
      src="/icons/box-plus.png"
      alt=""
      width={width}
      height={height}
      className={`box-add-icon ${className}`.trim()}
      aria-hidden="true"
      decoding="async"
      draggable={false}
    />
  )
}
