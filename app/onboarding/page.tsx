'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Language } from '@/types'

function EmailConfirmPopup({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
      <div className="bg-surface rounded-3xl p-8 max-w-sm w-full text-center slide-up border border-surface-raised">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">📧</span>
        </div>
        <h3
          className="text-xl font-light text-text-primary mb-3"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Vérifiez votre email
        </h3>
        <p className="text-text-secondary text-sm leading-relaxed mb-3">
          Un lien de confirmation a été envoyé à votre adresse. Cliquez dessus pour
          activer votre compte <strong className="text-text-primary">LexiFlow</strong>.
        </p>
        <p className="text-text-secondary text-xs italic mb-7">
          Vous pouvez continuer à explorer l&apos;application en attendant.
        </p>
        <button
          onClick={onContinue}
          className="w-full py-3.5 bg-accent text-white rounded-2xl font-medium
                     hover:bg-accent-light transition-colors active:scale-95"
        >
          Compris, on commence !
        </button>
      </div>
    </div>
  )
}

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [nativeLang, setNativeLang] = useState<Language | null>(null)
  const [learningLang, setLearningLang] = useState<Language | null>(null)
  const [notifTime, setNotifTime] = useState('07:30')
  const [loading, setLoading] = useState(false)
  const [showEmailPopup, setShowEmailPopup] = useState(false)
  const router = useRouter()

  const handleFinish = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/auth')
        return
      }

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        native_language: nativeLang,
        learning_language: learningLang,
        notification_time: notifTime,
        scroll_speed: 50,
      })

      if (error) throw error

      // Request push notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }

      // Show email confirmation reminder before redirecting
      setLoading(false)
      setShowEmailPopup(true)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm page-fade">
        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-12">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s < step ? 'w-8 bg-accent' : s === step ? 'w-12 bg-accent' : 'w-8 bg-surface-raised'
              }`}
            />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h2
              className="text-2xl font-light text-center text-text-primary mb-2"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Quelle est votre langue maternelle&nbsp;?
            </h2>
            <p className="text-text-secondary text-sm text-center mb-8">
              Étape 1 sur 3
            </p>
            <div className="space-y-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setNativeLang(lang.code)
                    setStep(2)
                  }}
                  className="w-full flex items-center gap-5 px-5 py-4 rounded-2xl
                             border-2 transition-all active:scale-[0.98]
                             border-surface-raised bg-surface hover:border-accent/50"
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <span className="text-text-primary font-medium text-lg">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h2
              className="text-2xl font-light text-center text-text-primary mb-2"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Quelle langue voulez-vous apprendre&nbsp;?
            </h2>
            <p className="text-text-secondary text-sm text-center mb-8">
              Étape 2 sur 3
            </p>
            <div className="space-y-3">
              {LANGUAGES.map((lang) => {
                const isNative = lang.code === nativeLang
                return (
                  <button
                    key={lang.code}
                    disabled={isNative}
                    onClick={() => {
                      setLearningLang(lang.code)
                      setStep(3)
                    }}
                    className={`w-full flex items-center gap-5 px-5 py-4 rounded-2xl
                                border-2 transition-all ${
                      isNative
                        ? 'border-surface bg-surface/40 opacity-35 cursor-not-allowed'
                        : 'border-surface-raised bg-surface hover:border-accent/50 active:scale-[0.98]'
                    }`}
                  >
                    <span className="text-3xl">{lang.flag}</span>
                    <span className="text-text-primary font-medium text-lg">{lang.label}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setStep(1)}
              className="mt-6 w-full text-text-secondary text-sm py-2"
            >
              ← Retour
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <h2
              className="text-2xl font-light text-center text-text-primary mb-2"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              À quelle heure voulez-vous lire&nbsp;?
            </h2>
            <p className="text-text-secondary text-sm text-center mb-10">
              Étape 3 sur 3 · Nous vous enverrons un rappel
            </p>
            <div className="flex justify-center mb-10">
              <input
                type="time"
                value={notifTime}
                onChange={(e) => setNotifTime(e.target.value)}
                className="text-5xl font-light text-text-primary bg-surface rounded-2xl
                           px-8 py-6 border-2 border-surface-raised
                           focus:border-accent focus:outline-none text-center"
              />
            </div>
            <button
              onClick={handleFinish}
              disabled={loading}
              className="w-full py-4 bg-accent text-white rounded-full text-lg font-medium
                         hover:bg-accent-light transition-colors disabled:opacity-50
                         active:scale-95 shadow-lg shadow-accent/25"
            >
              {loading ? '…' : "C'est parti ! 🚀"}
            </button>
            <button
              onClick={() => setStep(2)}
              className="mt-4 w-full text-text-secondary text-sm py-2"
            >
              ← Retour
            </button>
          </div>
        )}
      </div>
    </div>

    {showEmailPopup && (
      <EmailConfirmPopup onContinue={() => router.replace('/today')} />
    )}
  )
}
