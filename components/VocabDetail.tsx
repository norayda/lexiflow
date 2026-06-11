'use client'
import { useEffect, useState } from 'react'
import { useSpeech } from '@/hooks/useSpeech'
import type { Language, VocabularyWord } from '@/types'

interface VocabDetailProps {
  word: VocabularyWord
  nativeLang: Language
  onClose: () => void
}

const LANG_FLAGS: Record<Language, string> = { fr: '🇫🇷', en: '🇬🇧', es: '🇪🇸' }

export default function VocabDetail({ word, nativeLang, onClose }: VocabDetailProps) {
  const { speak } = useSpeech()
  const [sentenceTranslation, setSentenceTranslation] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)

  const lang = word.language as Language
  const combined = word[`translation_${nativeLang}` as keyof VocabularyWord] as string | null

  // Split stored "translation — definition" field
  const dashIdx = combined?.indexOf(' — ') ?? -1
  const wordTranslation = dashIdx > -1 ? combined!.substring(0, dashIdx) : combined
  const definition = dashIdx > -1 ? combined!.substring(dashIdx + 3) : null

  useEffect(() => {
    if (!word.context_sentence || lang === nativeLang) return
    setTranslating(true)
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: word.context_sentence, from: lang, to: nativeLang }),
    })
      .then((r) => r.json())
      .then((d) => setSentenceTranslation(d.translation ?? null))
      .catch(() => {})
      .finally(() => setTranslating(false))
  }, [word.context_sentence, lang, nativeLang])

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
        {/* Word + audio */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{LANG_FLAGS[lang]}</span>
            <span
              className="text-3xl font-light text-text-primary"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {word.word}
            </span>
          </div>
          <button
            onClick={() => speak(word.word, lang)}
            className="w-10 h-10 flex items-center justify-center rounded-full
                       bg-surface-raised text-accent hover:bg-accent/20 transition-colors text-lg"
          >
            🔊
          </button>
        </div>

        {/* Translation + definition */}
        {wordTranslation && (
          <div className="mt-3 mb-4 px-4 py-3 bg-surface-raised rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{LANG_FLAGS[nativeLang]}</span>
              <span className="text-base font-medium text-text-primary">{wordTranslation}</span>
            </div>
            {definition && (
              <p className="text-text-secondary text-sm italic leading-relaxed">{definition}</p>
            )}
          </div>
        )}

        {/* Example sentence */}
        {word.context_sentence && (
          <>
            <p className="text-text-secondary text-xs uppercase tracking-wider mb-2">
              Phrase d&apos;exemple
            </p>
            <div className="flex items-start gap-2 bg-surface-raised rounded-xl px-3 py-2.5 mb-2">
              <p className="flex-1 text-text-primary text-sm italic leading-relaxed">
                &ldquo;{word.context_sentence}&rdquo;
              </p>
              <button
                onClick={() => speak(word.context_sentence!, lang)}
                className="shrink-0 text-accent hover:text-accent-light transition-colors"
              >
                🔊
              </button>
            </div>

            {/* Sentence translation */}
            {lang !== nativeLang && (
              <div className="flex items-start gap-2 bg-surface-raised rounded-xl px-3 py-2.5 mb-4">
                <span className="text-sm shrink-0">{LANG_FLAGS[nativeLang]}</span>
                {translating ? (
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-text-secondary text-xs">Traduction…</span>
                  </div>
                ) : sentenceTranslation ? (
                  <>
                    <p className="flex-1 text-text-secondary text-sm italic leading-relaxed">
                      {sentenceTranslation}
                    </p>
                    <button
                      onClick={() => speak(sentenceTranslation, nativeLang)}
                      className="shrink-0 text-accent hover:text-accent-light transition-colors"
                    >
                      🔊
                    </button>
                  </>
                ) : (
                  <p className="text-text-secondary text-xs italic">Traduction indisponible</p>
                )}
              </div>
            )}
          </>
        )}

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
