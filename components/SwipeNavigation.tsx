'use client'
import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const NAV_PAGES = ['/today', '/calendar', '/vocabulary', '/profile']
const SWIPE_MIN_PX = 50      // minimum horizontal distance
const HORIZ_RATIO  = 1.5     // horizontal must dominate vertical by this factor

export default function SwipeNavigation() {
  const router   = useRouter()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)

  useEffect(() => { pathnameRef.current = pathname }, [pathname])

  useEffect(() => {
    let startX = 0
    let startY = 0

    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const onEnd = (e: TouchEvent) => {
      const current = pathnameRef.current
      const idx = NAV_PAGES.indexOf(current)
      if (idx === -1) return

      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY

      if (Math.abs(dx) < SWIPE_MIN_PX) return
      if (Math.abs(dx) < Math.abs(dy) * HORIZ_RATIO) return

      if (dx < 0 && idx < NAV_PAGES.length - 1) {
        router.push(NAV_PAGES[idx + 1])
      } else if (dx > 0 && idx > 0) {
        router.push(NAV_PAGES[idx - 1])
      }
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend',   onEnd,   { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend',   onEnd)
    }
  }, [router])

  return null
}
