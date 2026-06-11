'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import ScrollingText from '@/components/ScrollingText'
import ThemeToggle from '@/components/ThemeToggle'
import type { DailyText, Profile, Language } from '@/types'

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function TodayPage() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dailyText, setDailyText] = useState<DailyText | null>(null)
  const [nextDate, setNextDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTranslation, setShowTranslation] = useState(false)
  const [completed, setCompleted] = useState(false)
  const router = useRouter()

  const today = toDateStr(new Date())

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const [{ data: profileData }, { data: textData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('daily_texts').select('*').eq('text_date', today).single(),
      ])

      if (!profileData) {
        router.replace('/onboarding')
        return
      }
      setProfile(profileData)

      if (textData) {
        setDailyText(textData)
        await supabase.from('reading_progress').upsert(
          { user_id: user.id, text_id: textData.id, completed: false },
          { onConflict: 'user_id,text_id', ignoreDuplicates: true },
        )
        const { data: existing } = await supabase
          .from('reading_progress')
          .select('completed')
          .eq('user_id', user.id)
          .eq('text_id', textData.id)
          .single()
        if (existing?.completed) setCompleted(true)
      } else {
        const { data: next } = await supabase
          .from('daily_texts')
          .select('text_date')
          .gt('text_date', today)
          .order('text_date', { ascending: true })
          .limit(1)
          .single()
        setNextDate(next?.text_date ?? null)
      }

      setLoading(false)
    }

    load()
  }, [user, today, router])

  const handleComplete = async () => {
    if (!user || !dailyText) return
    await supabase
      .from('reading_progress')
      .update({ completed: true })
      .eq('user_id', user.id)
      .eq('text_id', dailyText.id)
    setCompleted(true)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!dailyText) {
    const formatted = nextDate
      ? new Date(nextDate + 'T12:00:00').toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      : null
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <p className="text-6xl mb-6">🌙</p>
        <p className="text-xl text-text-primary font-light mb-2">Revenez demain</p>
        {formatted && (
          <p className="text-text-secondary">Prochain texte : {formatted}</p>
        )}
      </div>
    )
  }

  const lang: Language = profile?.learning_language ?? 'fr'
  const nativeLang: Language = profile?.native_language ?? 'en'
  const contentKey = `content_${lang}` as keyof DailyText
  const nativeContentKey = `content_${nativeLang}` as keyof DailyText

  const dateLabel = new Date(today + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  if (completed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center pb-24 page-fade">
        <p className="text-6xl mb-5">🎉</p>
        <h2 className="text-2xl font-light text-text-primary mb-2">Bravo !</h2>
        <p className="text-text-secondary mb-8 leading-relaxed">
          Tu as terminé le texte du jour.<br />
          Reviens demain pour continuer.
        </p>
        <p className="text-4xl mb-8">🌙</p>
        <Link
          href="/calendar"
          className="px-6 py-3 rounded-2xl bg-surface border border-surface-raised
                     text-text-secondary text-sm hover:text-text-primary transition-colors"
        >
          Voir ma progression →
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-text-secondary text-xs uppercase tracking-widest">{dateLabel}</p>
          {dailyText.theme && (
            <p className="text-text-primary text-base font-medium mt-0.5">{dailyText.theme}</p>
          )}
        </div>
        <ThemeToggle className="shrink-0 mt-0.5" />
      </div>

      {/* Scrolling text – takes remaining height */}
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

      {/* Translation panel */}
      {showTranslation && (
        <div
          className="fixed left-1/2 -translate-x-1/2 w-full max-w-md
                     bottom-16 max-h-64 overflow-y-auto
                     bg-surface border-t border-surface-raised px-5 py-4 z-30"
        >
          <p className="reading-text text-text-secondary text-sm leading-relaxed">
            {dailyText[nativeContentKey] as string}
          </p>
        </div>
      )}
    </div>
  )
}
