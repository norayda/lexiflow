'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import ScrollingText from '@/components/ScrollingText'
import type { DailyText, Profile, Language } from '@/types'

export default function ReadDatePage() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dailyText, setDailyText] = useState<DailyText | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const router = useRouter()
  const params = useParams()
  const date = params.date as string

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user || !date) return

    const load = async () => {
      const [{ data: profileData }, { data: textData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('daily_texts').select('*').eq('text_date', date).single(),
      ])

      setProfile(profileData)

      if (!textData) {
        setNotFound(true)
      } else {
        setDailyText(textData)
        await supabase.from('reading_progress').upsert(
          { user_id: user.id, text_id: textData.id, completed: false },
          { onConflict: 'user_id,text_id', ignoreDuplicates: true },
        )
      }

      setLoading(false)
    }

    load()
  }, [user, date])

  const handleComplete = async () => {
    if (!user || !dailyText) return
    await supabase
      .from('reading_progress')
      .update({ completed: true })
      .eq('user_id', user.id)
      .eq('text_id', dailyText.id)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <p className="text-5xl mb-4">📭</p>
        <p className="text-text-primary text-lg mb-2">Aucun texte pour cette date</p>
        <button
          onClick={() => router.push('/calendar')}
          className="mt-4 text-accent text-sm underline"
        >
          ← Retour au calendrier
        </button>
      </div>
    )
  }

  if (!dailyText) return null

  const lang: Language = profile?.learning_language ?? 'fr'
  const nativeLang: Language = profile?.native_language ?? 'en'
  const contentKey = `content_${lang}` as keyof DailyText
  const nativeContentKey = `content_${nativeLang}` as keyof DailyText

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-3 flex items-start gap-3">
        <button
          onClick={() => router.back()}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl
                     bg-surface text-text-secondary hover:text-text-primary transition-colors mt-0.5"
        >
          ‹
        </button>
        <div>
          <p className="text-text-secondary text-xs uppercase tracking-widest">{dateLabel}</p>
          {dailyText.theme && (
            <p className="text-text-primary text-base font-medium mt-0.5">{dailyText.theme}</p>
          )}
        </div>
      </div>

      {/* Scrolling text */}
      <div className="flex-1 overflow-hidden">
        <ScrollingText
          text={dailyText[contentKey] as string}
          language={lang}
          nativeLang={nativeLang}
          defaultSpeed={profile?.scroll_speed ?? 50}
          textId={dailyText.id}
          dailyText={dailyText}
          userId={user!.id}
          onComplete={handleComplete}
        />
      </div>

      {/* Translation toggle */}
      <div className="shrink-0 px-5 py-2" style={{ paddingBottom: 'calc(64px + 8px)' }}>
        <button
          onClick={() => setShowTranslation((v) => !v)}
          className="w-full py-2.5 text-text-secondary text-sm rounded-xl
                     border border-surface-raised hover:border-accent/40 transition-colors"
        >
          {showTranslation ? 'Masquer la traduction' : 'Voir la traduction complète'}
        </button>
      </div>

      {showTranslation && (
        <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-md
                        bottom-16 max-h-64 overflow-y-auto
                        bg-surface border-t border-surface-raised px-5 py-4 z-30">
          <p className="reading-text text-text-secondary text-sm leading-relaxed">
            {dailyText[nativeContentKey] as string}
          </p>
        </div>
      )}
    </div>
  )
}
