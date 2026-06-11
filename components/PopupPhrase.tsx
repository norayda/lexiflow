'use client'
import { useRef, useState } from 'react'
import { useSpeech } from '@/hooks/useSpeech'
import PopupMot from './PopupMot'
import type { Language, DailyText } from '@/types'

interface PopupPhraseProps {
  phrase: string
  language: Language
  nativeLang: Language
  textId: string
  dailyText: DailyText
  userId: string
  onClose: () => void
}

const LANG_LABELS: Record<Language, string> = { fr: '🇫🇷', en: '🇬🇧', es: '🇪🇸' }

function splitSentences(text: string): string[] {
  return text.split(/\.\s+/).map(s => s.trim()).filter(Boolean)
}

function findTranslation(phrase: string, dailyText: DailyText, srcLang: Language, nativeLang: Language): string | null {
  const srcText  = dailyText[`content_${srcLang}`    as keyof DailyText] as string
  const natText  = dailyText[`content_${nativeLang}` as keyof DailyText] as string
  if (!srcText || !natText) return null

  const srcSentences = splitSentences(srcText)
  const natSentences = splitSentences(natText)
  const idx = srcSentences.findIndex(s => phrase.trim().startsWith(s.substring(0, 30)))
  if (idx === -1 || idx >= natSentences.length) return null
  return natSentences[idx]
}

export default function PopupPhrase({
  phrase,
  language,
  nativeLang,
  textId,
  dailyText,
  userId,
  onClose,
}: PopupPhraseProps) {
  const { speak } = useSpeech()
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const words = phrase.split(/\s+/).filter(Boolean)
  const translation = findTranslation(phrase, dailyText, language, nativeLang)

  const handleWordPressStart = (word: string) => {
    longPressRef.current = setTimeout(() => {
      const clean = word.replace(/[^a-zA-ZÀ-ÿ'-]/g, '')
      if (clean.length > 1) setSelectedWord(clean)
    }, 500)
  }

  const handleWordPressEnd = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current)
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-end justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div
          className="relative w-full max-w-md bg-surface rounded-t-3xl p-6 pb-safe slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Listen phrase */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <p
              className="flex-1 text-text-primary leading-relaxed"
              style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem' }}
            >
              {phrase}
            </p>
            <button
              onClick={() => speak(phrase, language)}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full
                         bg-surface-raised text-accent hover:bg-accent/20 transition-colors"
            >
              🔊
            </button>
          </div>

          {translation && (
            <div className="flex items-start gap-2 bg-surface-raised rounded-xl px-3 py-2 mb-3">
              <span className="text-sm shrink-0">{LANG_LABELS[nativeLang]}</span>
              <p className="text-text-secondary text-sm leading-relaxed italic">{translation}</p>
              <button
                onClick={() => speak(translation, nativeLang)}
                className="shrink-0 text-accent hover:text-accent-light text-sm transition-colors"
              >
                🔊
              </button>
            </div>
          )}

          <p className="text-xs text-text-secondary mb-3">
            Maintien long sur un mot pour l&apos;explorer
          </p>

          {/* Words */}
          <div className="flex flex-wrap gap-1.5 pb-2">
            {words.map((word, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-lg bg-surface-raised text-text-primary
                           cursor-pointer select-none active:bg-accent/30 transition-colors"
                style={{ fontFamily: 'Georgia, serif', fontSize: '1rem' }}
                onPointerDown={() => handleWordPressStart(word)}
                onPointerUp={handleWordPressEnd}
                onPointerLeave={handleWordPressEnd}
                onPointerCancel={handleWordPressEnd}
              >
                {word}
              </span>
            ))}
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full py-2.5 rounded-xl bg-surface-raised
                       text-text-secondary text-sm hover:text-text-primary transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>

      {selectedWord && (
        <PopupMot
          word={selectedWord}
          language={language}
          contextSentence={phrase}
          textId={textId}
          dailyText={dailyText}
          userId={userId}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </>
  )
}
