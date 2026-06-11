'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSpeech } from '@/hooks/useSpeech'
import type { Language, DailyText } from '@/types'

interface PopupMotProps {
  word: string
  language: Language
  contextSentence: string
  textId: string
  dailyText: DailyText
  userId: string
  onClose: () => void
}

const LANG_LABELS: Record<Language, string> = { fr: '🇫🇷 FR', en: '🇬🇧 EN', es: '🇪🇸 ES' }

export default function PopupMot({
  word,
  language,
  contextSentence,
  textId,
  dailyText,
  userId,
  onClose,
}: PopupMotProps) {
  const { speak } = useSpeech()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const langs: Language[] = ['fr', 'en', 'es']

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('vocabulary_box').insert({
      user_id: userId,
      text_id: textId,
      word,
      language,
      context_sentence: contextSentence,
      translation_fr: null,
      translation_en: null,
      translation_es: null,
    })
    setSaved(true)
    setSaving(false)
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
        {/* Word + listen */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-4xl font-light text-text-primary" style={{ fontFamily: 'Georgia, serif' }}>
            {word}
          </h2>
          <button
            onClick={() => speak(word, language)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-raised
                       text-accent hover:bg-accent/20 transition-colors text-lg"
          >
            🔊
          </button>
        </div>

        {/* Context */}
        <p className="text-text-secondary italic text-sm mb-5 leading-relaxed">
          &ldquo;{contextSentence}&rdquo;
        </p>

        {/* Translations section */}
        <div className="space-y-2 mb-6">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">
            Texte disponible en
          </p>
          {langs.map((l) => {
            const contentKey = `content_${l}` as keyof DailyText
            const content = dailyText[contentKey] as string
            if (l === language || !content) return null
            return (
              <div
                key={l}
                className="flex items-center justify-between gap-3 px-3 py-2
                           bg-surface-raised rounded-xl"
              >
                <span className="text-xs font-medium text-text-secondary">{LANG_LABELS[l]}</span>
                <p className="flex-1 text-xs text-text-primary truncate">{content.slice(0, 60)}…</p>
                <button
                  onClick={() => speak(content.slice(0, 200), l)}
                  className="text-accent hover:text-accent-light transition-colors"
                >
                  🔊
                </button>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saved || saving}
            className={`flex-1 py-3 rounded-2xl font-medium text-sm transition-all active:scale-95 ${
              saved
                ? 'bg-success/20 text-success border border-success/30'
                : 'bg-accent text-white hover:bg-accent-light'
            } disabled:opacity-60`}
          >
            {saved ? '✓ Ajouté !' : saving ? '…' : '＋ Ajouter à ma Vocabulary Box'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-2xl bg-surface-raised text-text-secondary
                       text-sm hover:text-text-primary transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
