import CartCountdown, { useCartCountdown } from './CartCountdown'
import './CartCountdown.css'

export function CartButtonIcon() {
  return (
    <svg className="btn-buy__icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45a1 1 0 0 0 .9 1.46h9.72v-2H9.42l1.1-2h7.45a1 1 0 0 0 .95-.68L21.64 6H7.21l-.94-2zm-1 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 .001 3.999A2 2 0 0 0 16 20z"
      />
    </svg>
  )
}

export default function CatalogBuyButton({
  product,
  available,
  inCart,
  isAdding,
  isJoiningQueue,
  isInQueue,
  onAddToCart,
  onJoinQueue
}) {
  const isInMyCart = inCart > 0
  const cartUnlockedApi = product.cartUnlocked !== false && product.CartUnlocked !== false
  const cartAvailableRaw = product.cartAvailableAt ?? product.CartAvailableAt
  const { isExpired } = useCartCountdown(cartAvailableRaw)
  const cartUnlocked = cartUnlockedApi || isExpired

  const cartAvailableAt = cartAvailableRaw ? new Date(cartAvailableRaw) : null
  const cartAvailableLabel =
    cartAvailableAt && !Number.isNaN(cartAvailableAt.getTime())
      ? cartAvailableAt.toLocaleString('ru-RU')
      : null

  const canAdd = available > 0 && !isInMyCart && cartUnlocked
  const quantityInStock = product.quantityInStock ?? product.QuantityInStock ?? 0
  const isReservedByAnotherUser = available <= 0 && quantityInStock > 0 && !isInMyCart

  if (isReservedByAnotherUser) {
    return (
      <button
        className="btn-buy"
        onClick={async (e) => {
          e.stopPropagation()
          if (!isJoiningQueue && !isInQueue) {
            await onJoinQueue(product.id)
          }
        }}
        disabled={isJoiningQueue || isInQueue}
        title={isInQueue ? 'Вы уже стоите в очереди за этим товаром' : 'Встать в очередь за этим товаром'}
        style={isInQueue ? { background: '#a0aec0' } : undefined}
      >
        {isInQueue ? 'В очереди' : (isJoiningQueue ? '...' : 'В очередь')}
      </button>
    )
  }

  return (
    <button
      className={`btn-buy${!cartUnlocked ? ' btn-buy--locked' : ''}`}
      onClick={async (e) => {
        e.stopPropagation()
        if (canAdd && !isAdding) {
          await onAddToCart(product)
        }
      }}
      disabled={!canAdd || isAdding}
      title={
        !cartUnlocked
          ? (cartAvailableLabel
            ? `В корзину с ${cartAvailableLabel}`
            : 'Корзина откроется позже')
          : !canAdd
            ? (isInMyCart
              ? 'Товар уже в вашей корзине'
              : (available <= 0 ? 'Товар закончился' : 'Достигнуто максимальное количество'))
            : (isAdding ? 'Добавление...' : 'Добавить в корзину')
      }
    >
      {isAdding ? (
        'Добавление...'
      ) : !cartUnlocked ? (
        <CartCountdown cartAvailableRaw={cartAvailableRaw} />
      ) : !canAdd ? (
        isInMyCart ? 'В корзине' : (available <= 0 ? 'Нет в наличии' : 'В корзине')
      ) : (
        <>
          <CartButtonIcon />
          В корзину
        </>
      )}
    </button>
  )
}
