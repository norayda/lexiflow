'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useSpeech } from '@/hooks/useSpeech'
import VocabDetail from '@/components/VocabDetail'
import type { VocabularyWord, Language } from '@/types'

const LANG_OPTIONS: { code: Language | 'all'; label: string }[] = [
  { code: 'all', label: 'Tous' },
  { code: 'fr', label: '🇫🇷 FR' },
  { code: 'en', label: '🇬🇧 EN' },
  { code: 'es', label: '🇪🇸 ES' },
]

const LANG_FLAGS: Record<Language, string> = { fr: '🇫🇷', en: '🇬🇧', es: '🇪🇸' }

export default function VocabularyPage() {
  const { user, loading: authLoading } = useAuth()
  const [words, setWords] = useState<VocabularyWord[]>([])
  const [nativeLang, setNativeLang] = useState<Language>('fr')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Language | 'all'>('all')
  const [selected, setSelected] = useState<VocabularyWord | null>(null)
  const { speak } = useSpeech()
  const router = useRouter()
  const longPressRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [{ data: profile }, { data: vocab }] = await Promise.all([
        supabase.from('profiles').select('native_language').eq('id', user.id).single(),
        supabase
          .from('vocabulary_box')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('saved_at', { ascending: false }),
      ])
      if (profile?.native_language) setNativeLang(profile.native_language as Language)
      setWords(vocab ?? [])
      setLoading(false)
    }
    load()
  }, [user])

  const handleDelete = async (id: string) => {
    await supabase
      .from('vocabulary_box')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    setWords((w) => w.filter((x) => x.id !== id))
  }

  const startLongPress = (word: VocabularyWord) => {
    const t = setTimeout(() => setSelected(word), 500)
    longPressRefs.current.set(word.id, t)
  }

  const cancelLongPress = (id: string) => {
    const t = longPressRefs.current.get(id)
    if (t) clearTimeout(t)
    longPressRefs.current.delete(id)
  }

  const filtered = filter === 'all' ? words : words.filter((w) => w.language === filter)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 pt-8 pb-28 page-fade">
      <h1
        className="text-2xl font-light text-text-primary mb-6"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        Ma Vocabulary Box
      </h1>

      {/* Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {LANG_OPTIONS.map((opt) => (
          <button
            key={opt.code}
            onClick={() => setFilter(opt.code)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === opt.code
                ? 'bg-accent text-white'
                : 'bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-text-secondary">
            {filter === 'all' ? 'Votre boîte à mots est vide.' : 'Aucun mot dans cette langue.'}
          </p>
          <p className="text-text-secondary text-sm mt-1">
            Maintenez un mot lors de la lecture pour l&apos;ajouter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((word) => {
            const lang = word.language as Language
            const combined = word[`translation_${nativeLang}` as keyof VocabularyWord] as string | null
            const dashIdx = combined?.indexOf(' — ') ?? -1
            const wordTranslation = dashIdx > -1 ? combined!.substring(0, dashIdx) : combined
            const definition = dashIdx > -1 ? combined!.substring(dashIdx + 3) : null

            return (
              <article
                key={word.id}
                className="bg-surface rounded-2xl p-4 border border-surface-raised
                           select-none cursor-pointer active:bg-surface-raised/50 transition-colors"
                onPointerDown={() => startLongPress(word)}
                onPointerUp={() => cancelLongPress(word.id)}
                onPointerLeave={() => cancelLongPress(word.id)}
                onPointerCancel={() => cancelLongPress(word.id)}
              >
                {/* Word row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{LANG_FLAGS[lang]}</span>
                    <span
                      className="text-xl text-text-primary truncate"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      {word.word}
                    </span>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => speak(word.word, lang)}
                      className="text-accent hover:text-accent-light transition-colors text-base shrink-0"
                    >
                      🔊
                    </button>
                  </div>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handleDelete(word.id)}
                    className="text-text-secondary hover:text-red-400 transition-colors text-sm shrink-0 px-1"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>

                {/* Translation + definition */}
                {wordTranslation && (
                  <div className="flex items-start gap-1.5 mb-2">
                    <span className="text-xs shrink-0 mt-0.5">{LANG_FLAGS[nativeLang]}</span>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-text-primary">{wordTranslation}</span>
                      {definition && (
                        <span className="text-xs text-text-secondary ml-1.5 italic">— {definition}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Hint + date */}
                <div className="flex items-center justify-between">
                  <p className="text-text-secondary text-[11px]">Maintien pour les détails</p>
                  <p className="text-text-secondary text-[11px]">
                    {new Date(word.saved_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {selected && (
        <VocabDetail
          word={selected}
          nativeLang={nativeLang}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
