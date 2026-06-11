'use client'
import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSpeech } from '@/hooks/useSpeech'
import type { Language, DailyText } from '@/types'

interface PopupMotProps {
  word: string
  language: Language
  nativeLang: Language
  contextSentence: string
  textId: string
  dailyText: DailyText
  userId: string
  onClose: () => void
}

const LANG_FLAGS: Record<Language, string> = { fr: '🇫🇷', en: '🇬🇧', es: '🇪🇸' }

export default function PopupMot({
  word,
  language,
  nativeLang,
  contextSentence,
  textId,
  dailyText,
  userId,
  onClose,
}: PopupMotProps) {
  const { speak } = useSpeech()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  // Drag state
  const [dragging, setDragging] = useState(false)
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 })
  const [overBox, setOverBox] = useState(false)
  const startRef = useRef({ x: 0, y: 0 })
  const boxRef = useRef<HTMLDivElement>(null)

  const handleSave = async () => {
    if (saved || saving) return
    setSaving(true)
    setSaveError(false)

    // Fetch definition + translation (3 s timeout)
    let combined: string | null = null
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 3000)
      const res = await fetch('/api/define', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, language, nativeLang }),
        signal: controller.signal,
      })
      clearTimeout(timer)
      const data = await res.json()
      combined = data.combined ?? null
    } catch {}

    const { error } = await supabase.from('vocabulary_box').insert({
      user_id: userId,
      text_id: textId,
      word,
      language,
      context_sentence: contextSentence,
      translation_fr: nativeLang === 'fr' ? combined : null,
      translation_en: nativeLang === 'en' ? combined : null,
      translation_es: nativeLang === 'es' ? combined : null,
    })

    if (error) {
      setSaveError(true)
    } else {
      setSaved(true)
    }
    setSaving(false)
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (saved) return
    e.currentTarget.setPointerCapture(e.pointerId)
    startRef.current = { x: e.clientX, y: e.clientY }
    setDragging(true)
  }

  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    setDragDelta({ x: dx, y: dy })

    if (boxRef.current) {
      const r = boxRef.current.getBoundingClientRect()
      setOverBox(
        e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top  && e.clientY <= r.bottom,
      )
    }
  }

  const onDragEnd = async () => {
    if (overBox) await handleSave()
    setDragging(false)
    setDragDelta({ x: 0, y: 0 })
    setOverBox(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md bg-surface rounded-t-3xl p-6 pb-safe slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Draggable word chip */}
        <div className="flex items-center justify-between mb-2">
          <div
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl cursor-grab active:cursor-grabbing
                        select-none transition-shadow ${
              saved
                ? 'bg-success/20 border border-success/40'
                : dragging
                ? 'bg-accent/20 shadow-lg shadow-accent/20 scale-105'
                : 'bg-surface-raised'
            }`}
            style={{
              transform: dragging
                ? `translate(${dragDelta.x}px, ${dragDelta.y}px) scale(1.05)`
                : 'translate(0,0) scale(1)',
              transition: dragging ? 'none' : 'transform 0.25s ease',
              zIndex: dragging ? 60 : 'auto',
              position: 'relative',
              touchAction: 'none',
            }}
          >
            <span className="text-sm">{LANG_FLAGS[language]}</span>
            <span
              className="text-2xl font-light text-text-primary"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {word}
            </span>
            {!saved && <span className="text-text-secondary text-xs ml-1">↕</span>}
            {saved && <span className="text-success text-sm">✓</span>}
          </div>

          <button
            onClick={() => speak(word, language)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-raised
                       text-accent hover:bg-accent/20 transition-colors text-lg"
          >
            🔊
          </button>
        </div>

        {!saved && !saving && !dragging && (
          <p className="text-xs text-text-secondary mb-4">
            Glisse le mot vers la box ci-dessous pour l&apos;ajouter
          </p>
        )}
        {saving && (
          <p className="text-xs text-accent mb-4">Recherche de la définition…</p>
        )}
        {dragging && (
          <p className="text-xs text-accent mb-4">
            {overBox ? '✓ Relâche pour ajouter !' : 'Glisse vers la box…'}
          </p>
        )}
        {saved && (
          <p className="text-xs text-success mb-4">Mot ajouté avec sa définition !</p>
        )}
        {saveError && (
          <p className="text-xs text-red-400 mb-4">Erreur — réessaie</p>
        )}

        {/* Context */}
        <p className="text-text-secondary italic text-sm mb-4 leading-relaxed">
          &ldquo;{contextSentence}&rdquo;
        </p>

        {/* Drop zone */}
        <div
          ref={boxRef}
          className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl
                      border-2 border-dashed transition-all mb-4 ${
            saved
              ? 'border-success/40 bg-success/10'
              : overBox
              ? 'border-accent bg-accent/15 scale-[1.02]'
              : 'border-surface-raised'
          }`}
        >
          <span className="text-xl">{saved ? '✅' : '🗃️'}</span>
          <span className={`text-sm font-medium ${overBox ? 'text-accent' : 'text-text-secondary'}`}>
            {saved ? 'Ajouté !' : `Vocabulary Box ${LANG_FLAGS[language]}`}
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-surface-raised text-text-secondary
                     text-sm hover:text-text-primary transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}
