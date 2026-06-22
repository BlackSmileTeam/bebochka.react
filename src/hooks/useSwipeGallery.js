import { useCallback, useRef } from 'react'

const SWIPE_THRESHOLD_PX = 48

/**
 * Свайп влево/вправо для перелистывания фото (touch и мышь).
 */
export function useSwipeGallery({ onPrev, onNext, enabled = true }) {
  const pointerStart = useRef(null)

  const resetPointer = useCallback(() => {
    pointerStart.current = null
  }, [])

  const handlePointerDown = useCallback((event) => {
    if (!enabled) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pointerStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }, [enabled])

  const handlePointerUp = useCallback((event) => {
    if (!enabled || !pointerStart.current) return
    if (pointerStart.current.id !== event.pointerId) return

    const dx = event.clientX - pointerStart.current.x
    const dy = event.clientY - pointerStart.current.y
    resetPointer()

    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return
    if (Math.abs(dx) < Math.abs(dy)) return

    if (dx < 0) onNext?.()
    else onPrev?.()
  }, [enabled, onNext, onPrev, resetPointer])

  const handlePointerCancel = useCallback(() => {
    resetPointer()
  }, [resetPointer])

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onPointerLeave: handlePointerCancel,
  }
}
