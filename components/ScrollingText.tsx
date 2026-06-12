'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import PopupPhrase from './PopupPhrase'
import type { Language, DailyText } from '@/types'

interface ScrollingTextProps {
  text: string
  language: Language
  nativeLang: Language
  defaultSpeed: number
  textId: string
  dailyText: DailyText
  userId: string
  onComplete: () => void
}

export default function ScrollingText({
  text,
  language,
  nativeLang,
  defaultSpeed,
  textId,
  dailyText,
  userId,
  onComplete,
}: ScrollingTextProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(defaultSpeed)
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const speedRef = useRef(speed)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollPosRef = useRef(0)   // float accumulator — avoids integer rounding on iOS

  // Keep speedRef in sync without restarting RAF
  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  // Split text into sentences
  const sentences = text
    .split(/(?<=[.!?…»])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const scrollFrame = useCallback(
    (timestamp: number) => {
      const container = containerRef.current
      if (!container) return

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp
        scrollPosRef.current = container.scrollTop  // sync float pos on first frame
      }
      const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = timestamp

      // Speed 1 → 2 px/sec, Speed 50 → 22 px/sec, Speed 100 → 42 px/sec
      const pxPerSec = 2 + (speedRef.current - 1) * 0.4
      scrollPosRef.current += pxPerSec * delta   // accumulate as float — never read scrollTop back
      container.scrollTop = scrollPosRef.current

      const textEl = textRef.current
      if (textEl) {
        const textBottom = textEl.getBoundingClientRect().bottom
        const containerTop = container.getBoundingClientRect().top
        if (textBottom <= containerTop) {
          setIsPlaying(false)
          if (!completed) {
            setCompleted(true)
            onComplete()
          }
          return
        }
      }

      rafRef.current = requestAnimationFrame(scrollFrame)
    },
    [completed, onComplete],
  )

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0
      rafRef.current = requestAnimationFrame(scrollFrame)
    } else {
      cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = 0
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, scrollFrame])

  const handleReset = () => {
    setIsPlaying(false)
    scrollPosRef.current = 0
    if (containerRef.current) containerRef.current.scrollTop = 0
  }

  const handleLongPressStart = (sentence: string) => {
    longPressRef.current = setTimeout(() => {
      setIsPlaying(false)
      setSelectedPhrase(sentence)
    }, 800)
  }

  const handleLongPressEnd = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current)
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* Scrollable text */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-5"
        style={{ paddingBottom: '160px', scrollBehavior: 'auto' }}
      >
        {/* Spacer so first line appears at mid-screen on load */}
        <div className="h-[42vh]" aria-hidden />
        <div ref={textRef} className="reading-text max-w-2xl mx-auto text-text-primary">
          {sentences.map((sentence, i) => (
            <span
              key={i}
              className="cursor-pointer rounded px-0.5 transition-colors
                         hover:bg-surface-raised/60 active:bg-surface-raised
                         select-none"
              onPointerDown={() => handleLongPressStart(sentence)}
              onPointerUp={handleLongPressEnd}
              onPointerLeave={handleLongPressEnd}
              onPointerCancel={handleLongPressEnd}
            >
              {sentence}{' '}
            </span>
          ))}
        </div>

        {/* Spacer so the last line can fully scroll above the viewport before completion fires */}
        <div className="h-screen" aria-hidden />

        {completed && (
          <p className="text-center text-success text-sm mt-6 mb-2">
            ✓ Texte terminé
          </p>
        )}
      </div>

      {/* Fixed controls – above bottom nav (h-16 = 64px), mirrors container width */}
      <div
        className="fixed left-1/2 -translate-x-1/2 w-full max-w-md
                   flex flex-col items-center gap-3
                   px-5 pt-3 pb-2 bg-background/95 backdrop-blur-sm
                   border-t border-surface-raised"
        style={{ bottom: '64px' }}
      >
        {/* Buttons row */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="w-10 h-10 flex items-center justify-center rounded-full
                       bg-surface text-text-secondary hover:text-text-primary
                       transition-colors text-lg"
            title="Retour au début"
          >
            ⏮
          </button>

          <button
            onClick={() => setIsPlaying((p) => !p)}
            className={`w-14 h-14 flex items-center justify-center rounded-full
                        text-2xl text-white transition-all active:scale-95
                        bg-accent hover:bg-accent-light
                        ${isPlaying ? 'pulse-active' : ''}`}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Spacer to balance layout */}
          <div className="w-10" />
        </div>

        {/* Speed slider */}
        <div className="flex items-center gap-3 w-full max-w-xs">
          <span className="text-text-secondary text-[11px] w-8 text-right">Lent</span>
          <input
            type="range"
            min={1}
            max={100}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="flex-1 h-1 accent-accent cursor-pointer"
          />
          <span className="text-text-secondary text-[11px] w-8">Vite</span>
          <span className="text-accent text-[11px] w-6 text-right font-medium">
            {speed}
          </span>
        </div>
      </div>

      {/* Phrase popup */}
      {selectedPhrase && (
        <PopupPhrase
          phrase={selectedPhrase}
          language={language}
          nativeLang={nativeLang}
          textId={textId}
          dailyText={dailyText}
          userId={userId}
          onClose={() => setSelectedPhrase(null)}
        />
      )}
    </div>
  )
}
