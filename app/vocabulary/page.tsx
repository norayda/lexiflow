'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useSpeech } from '@/hooks/useSpeech'
import type { VocabularyWord, Language } from '@/types'

const LANG_OPTIONS: { code: Language | 'all'; label: string }[] = [
  { code: 'all', label: 'Tous' },
  { code: 'fr', label: '🇫🇷 FR' },
  { code: 'en', label: '🇬🇧 EN' },
  { code: 'es', label: '🇪🇸 ES' },
]

export default function VocabularyPage() {
  const { user, loading: authLoading } = useAuth()
  const [words, setWords] = useState<VocabularyWord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Language | 'all'>('all')
  const { speak } = useSpeech()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase
        .from('vocabulary_box')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('saved_at', { ascending: false })
      setWords(data ?? [])
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
            {filter === 'all'
              ? 'Votre boîte à mots est vide.'
              : 'Aucun mot dans cette langue.'}
          </p>
          <p className="text-text-secondary text-sm mt-1">
            Maintenez un mot lors de la lecture pour l&apos;ajouter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((word) => (
            <article
              key={word.id}
              className="bg-surface rounded-2xl p-4 border border-surface-raised"
            >
              {/* Word + listen */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-2xl text-text-primary"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {word.word}
                  </span>
                  <button
                    onClick={() => speak(word.word, word.language as Language)}
                    className="text-accent hover:text-accent-light transition-colors text-lg"
                  >
                    🔊
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(word.id)}
                  className="text-text-secondary hover:text-red-400 transition-colors text-sm px-2 py-1"
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>

              {/* Context sentence */}
              {word.context_sentence && (
                <div className="flex items-start gap-2 mb-3">
                  <p className="flex-1 text-text-secondary text-sm italic leading-relaxed">
                    &ldquo;{word.context_sentence}&rdquo;
                  </p>
                  <button
                    onClick={() => speak(word.context_sentence!, word.language as Language)}
                    className="shrink-0 text-accent hover:text-accent-light transition-colors"
                  >
                    🔊
                  </button>
                </div>
              )}

              {/* Translations row */}
              <div className="flex gap-3 flex-wrap">
                {(['fr', 'en', 'es'] as Language[]).map((l) => {
                  if (l === word.language) return null
                  const val = word[`translation_${l}` as keyof VocabularyWord] as string | null
                  return (
                    <div key={l} className="flex items-center gap-1.5 bg-surface-raised rounded-lg px-2.5 py-1">
                      <span className="text-xs text-text-secondary">
                        {l === 'fr' ? '🇫🇷' : l === 'en' ? '🇬🇧' : '🇪🇸'}
                      </span>
                      <span className="text-xs text-text-primary">
                        {val ?? '—'}
                      </span>
                      {val && (
                        <button
                          onClick={() => speak(val, l)}
                          className="text-accent text-xs hover:text-accent-light transition-colors"
                        >
                          🔊
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Date */}
              <p className="text-text-secondary text-[11px] mt-3">
                {new Date(word.saved_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
