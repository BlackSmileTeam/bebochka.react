import { useEffect, useMemo, useState } from 'react'
import {
  formatCartCountdown,
  getCartUnlockRemainingMs,
  parseCartAvailableAt
} from '../utils/cartCountdown'
import './CartCountdown.css'

export function useCartCountdown(cartAvailableRaw) {
  const target = useMemo(() => parseCartAvailableAt(cartAvailableRaw), [cartAvailableRaw])
  const [remainingMs, setRemainingMs] = useState(() =>
    target ? getCartUnlockRemainingMs(target) : null
  )

  useEffect(() => {
    if (!target) {
      setRemainingMs(null)
      return undefined
    }

    const tick = () => setRemainingMs(getCartUnlockRemainingMs(target))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [target])

  const isExpired = remainingMs !== null && remainingMs <= 0

  return { target, remainingMs, isExpired }
}

export default function CartCountdown({ cartAvailableRaw, className = '' }) {
  const { remainingMs } = useCartCountdown(cartAvailableRaw)
  const label = formatCartCountdown(remainingMs)

  return (
    <span className={`cart-countdown ${className}`.trim()} aria-live="polite" aria-label={`До открытия корзины: ${label}`}>
      {label}
    </span>
  )
}
