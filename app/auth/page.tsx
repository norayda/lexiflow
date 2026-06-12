'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AppLogo from '@/components/AppLogo'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace('/today')
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        router.replace('/onboarding')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setError('Un compte existe déjà avec cet email.')
      } else if (msg.includes('Invalid login') || msg.includes('invalid credentials')) {
        setError('Email ou mot de passe incorrect.')
      } else {
        setError('Une erreur est survenue, réessaie.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm page-fade">
        <AppLogo size="md" className="mx-auto mb-6" />
        <h1
          className="text-3xl font-light text-center mb-10 text-text-primary"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          LexiFlow
        </h1>

        {/* Toggle */}
        <div className="flex mb-7 bg-surface rounded-full p-1 gap-1">
          {['Connexion', 'Inscription'].map((label, i) => (
            <button
              key={label}
              onClick={() => setIsLogin(i === 0)}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                isLogin === (i === 0)
                  ? 'bg-accent text-white shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3.5 bg-surface rounded-2xl text-text-primary
                       placeholder:text-text-secondary border border-surface-raised
                       focus:border-accent focus:outline-none transition-colors"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className="w-full px-4 py-3.5 pr-12 bg-surface rounded-2xl text-text-primary
                         placeholder:text-text-secondary border border-surface-raised
                         focus:border-accent focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary
                         hover:text-text-primary transition-colors px-1 py-1 text-lg leading-none"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center px-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-accent text-white rounded-2xl font-medium
                       hover:bg-accent-light transition-colors disabled:opacity-50
                       active:scale-95 mt-2"
          >
            {loading ? '…' : isLogin ? 'Se connecter' : 'Créer un compte'}
          </button>
        </form>
      </div>
    </div>
  )
}
