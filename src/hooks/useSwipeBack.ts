import { useEffect, useRef } from 'react'

export function useSwipeBack(onBack: () => void) {
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const callbackRef = useRef(onBack)
  callbackRef.current = onBack

  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      const touch = e.touches[0]
      if (touch.clientX < 30) {
        startX.current = touch.clientX
        startY.current = touch.clientY
      } else {
        startX.current = null
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      if (startX.current === null || startY.current === null) return
      const touch = e.changedTouches[0]
      const dx = touch.clientX - startX.current
      const dy = Math.abs(touch.clientY - (startY.current ?? 0))
      if (dx > 60 && dy < 80) {
        callbackRef.current()
      }
      startX.current = null
      startY.current = null
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])
}
