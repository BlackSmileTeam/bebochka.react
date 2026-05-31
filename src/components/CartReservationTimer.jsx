import { useEffect, useMemo, useState } from 'react'
import {
  formatReservationCountdown,
  getCartReservationDeadline,
  getCartReservationRemainingMs,
} from '../utils/cartReservationCountdown'
import './CartReservationTimer.css'

export default function CartReservationTimer({ cartItems, compact = false }) {
  const deadline = useMemo(() => getCartReservationDeadline(cartItems), [cartItems])
  const [remainingMs, setRemainingMs] = useState(() =>
    deadline ? getCartReservationRemainingMs(deadline) : null
  )

  useEffect(() => {
    if (!deadline) {
      setRemainingMs(null)
      return undefined
    }
    const tick = () => setRemainingMs(getCartReservationRemainingMs(deadline))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [deadline])

  if (!deadline || remainingMs == null) return null

  const expired = remainingMs <= 0
  const label = formatReservationCountdown(remainingMs)

  if (compact) {
    return (
      <p
        className={`cart-reserve-timer${expired ? ' cart-reserve-timer--expired' : ''}`}
        role="status"
        aria-live="polite"
      >
        {expired ? (
          <>Бронь истекла — обновите корзину</>
        ) : (
          <>Бронь действует ещё <strong>{label}</strong></>
        )}
      </p>
    )
  }

  return (
    <div
      className={`checkout-reserve-timer${expired ? ' checkout-reserve-timer--expired' : ''}`}
      role="status"
      aria-live="polite"
    >
      <strong>{expired ? 'Бронь истекла' : 'Оформите заказ в течение 24 часов'}</strong>
      <span>
        {expired
          ? ' Товары могут быть сняты с резерва. Обновите корзину или оформите заказ заново.'
          : ` Осталось: ${label}. После истечения срока неоплаченные позиции освобождаются.`}
      </span>
    </div>
  )
}
