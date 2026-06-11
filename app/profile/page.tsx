'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { requestNotifPermission, registerSW } from '@/components/NotificationManager'
import type { Profile, Language } from '@/types'

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [vocabCount, setVocabCount] = useState(0)
  const [textsThisMonth, setTextsThisMonth] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPerm(Notification.permission)
      registerSW()
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]

      const [{ data: p }, { count: vc }, { count: tc }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('vocabulary_box')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('deleted_at', null),
        supabase
          .from('reading_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('read_at', firstOfMonth),
      ])

      setProfile(p)
      setVocabCount(vc ?? 0)
      setTextsThisMonth(tc ?? 0)
      setLoading(false)
    }
    load()
  }, [user])

  const handleSave = async () => {
    if (!user || !profile) return
    setSaving(true)
    await supabase.from('profiles').update({
      native_language: profile.native_language,
      learning_language: profile.learning_language,
      notification_time: profile.notification_time,
      scroll_speed: profile.scroll_speed,
    }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-background px-4 pt-8 pb-28 page-fade">
      <h1 className="text-2xl font-light text-text-primary mb-2"
          style={{ fontFamily: 'Georgia, serif' }}>
        Profil
      </h1>
      <p className="text-text-secondary text-sm mb-8">{user?.email}</p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-surface rounded-2xl p-4 border border-surface-raised">
          <p className="text-3xl font-light text-accent">{vocabCount}</p>
          <p className="text-text-secondary text-sm mt-1">mots sauvegardés</p>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-surface-raised">
          <p className="text-3xl font-light text-accent">{textsThisMonth}</p>
          <p className="text-text-secondary text-sm mt-1">textes lus ce mois</p>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-5">
        {/* Native language */}
        <div>
          <label className="block text-text-secondary text-xs uppercase tracking-wider mb-2">
            Langue maternelle
          </label>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() =>
                  setProfile((p) => p ? { ...p, native_language: l.code } : p)
                }
                disabled={profile.learning_language === l.code}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl
                            border-2 transition-all text-sm ${
                  profile.native_language === l.code
                    ? 'border-accent bg-accent/10 text-accent'
                    : profile.learning_language === l.code
                    ? 'border-surface-raised opacity-30 cursor-not-allowed text-text-secondary'
                    : 'border-surface-raised text-text-secondary hover:border-accent/40'
                }`}
              >
                <span className="text-xl">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Learning language */}
        <div>
          <label className="block text-text-secondary text-xs uppercase tracking-wider mb-2">
            Langue apprise
          </label>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() =>
                  setProfile((p) => p ? { ...p, learning_language: l.code } : p)
                }
                disabled={profile.native_language === l.code}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl
                            border-2 transition-all text-sm ${
                  profile.learning_language === l.code
                    ? 'border-accent bg-accent/10 text-accent'
                    : profile.native_language === l.code
                    ? 'border-surface-raised opacity-30 cursor-not-allowed text-text-secondary'
                    : 'border-surface-raised text-text-secondary hover:border-accent/40'
                }`}
              >
                <span className="text-xl">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notification time */}
        <div>
          <label className="block text-text-secondary text-xs uppercase tracking-wider mb-2">
            Heure de notification
          </label>
          <input
            type="time"
            value={profile.notification_time?.slice(0, 5) ?? '07:30'}
            onChange={(e) =>
              setProfile((p) => p ? { ...p, notification_time: e.target.value } : p)
            }
            className="w-full px-4 py-3 bg-surface rounded-2xl text-text-primary
                       border border-surface-raised focus:border-accent focus:outline-none"
          />
        </div>

        {/* Rappels push */}
        {notifPerm !== 'unsupported' && (
          <div>
            <label className="block text-text-secondary text-xs uppercase tracking-wider mb-2">
              Rappels
            </label>
            {notifPerm === 'granted' ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-surface rounded-2xl
                              border border-surface-raised text-sm text-text-secondary">
                <span className="text-accent">✓</span>
                <span>Rappels activés — tu reçois une notification à chaque ouverture du jour.</span>
              </div>
            ) : notifPerm === 'denied' ? (
              <div className="px-4 py-3 bg-surface rounded-2xl border border-surface-raised
                              text-sm text-text-secondary">
                Rappels bloqués. Active-les dans Réglages → LexiFlow → Notifications.
              </div>
            ) : (
              <button
                onClick={async () => {
                  const perm = await requestNotifPermission()
                  setNotifPerm(perm)
                }}
                className="w-full py-3 rounded-2xl border-2 border-accent/40 text-accent
                           text-sm hover:bg-accent/10 transition-all active:scale-95"
              >
                Activer les rappels quotidiens
              </button>
            )}
          </div>
        )}

        {/* Theme */}
        <div>
          <label className="block text-text-secondary text-xs uppercase tracking-wider mb-2">
            Apparence
          </label>
          <div className="flex gap-2">
            {([
              { value: 'light' as const, icon: '☀️', label: 'Clair (beige)' },
              { value: 'dark'  as const, icon: '🌙', label: 'Sombre' },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => theme !== opt.value && toggleTheme()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl
                            border-2 transition-all text-sm ${
                  theme === opt.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-surface-raised text-text-secondary hover:border-accent/40'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll speed */}
        <div>
          <label className="block text-text-secondary text-xs uppercase tracking-wider mb-2">
            Vitesse de défilement — {profile.scroll_speed}
          </label>
          <input
            type="range"
            min={1}
            max={100}
            value={profile.scroll_speed}
            onChange={(e) =>
              setProfile((p) => p ? { ...p, scroll_speed: Number(e.target.value) } : p)
            }
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-[11px] text-text-secondary mt-1">
            <span>Lent (1)</span>
            <span>Rapide (100)</span>
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`mt-8 w-full py-3.5 rounded-2xl font-medium transition-all
                    active:scale-95 ${
          saved
            ? 'bg-success/20 text-success border border-success/30'
            : 'bg-accent text-white hover:bg-accent-light'
        } disabled:opacity-50`}
      >
        {saved ? '✓ Enregistré' : saving ? '…' : 'Enregistrer les modifications'}
      </button>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="mt-4 w-full py-3 rounded-2xl text-text-secondary text-sm
                   border border-surface-raised hover:border-red-500/40
                   hover:text-red-400 transition-colors"
      >
        Se déconnecter
      </button>
    </div>
  )
}
