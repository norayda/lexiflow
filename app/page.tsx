'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AppLogo from '@/components/AppLogo'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/today')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="text-center page-fade">
        <AppLogo size="lg" className="mx-auto mb-8" />

        <h1
          className="text-5xl font-light tracking-wide text-text-primary mb-4"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          LexiFlow
        </h1>
        <p className="text-text-secondary text-lg mb-14">
          Un texte par jour. Une langue à la fois.
        </p>

        <button
          onClick={() => router.push('/auth')}
          className="px-10 py-4 bg-accent text-white rounded-full text-lg font-medium
                     hover:bg-accent-light transition-colors active:scale-95 shadow-lg
                     shadow-accent/30"
        >
          Commencer
        </button>
      </div>
    </div>
  )
}
