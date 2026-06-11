'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NO_NAV_PATHS = ['/', '/auth', '/onboarding']

const items = [
  { href: '/today', label: 'Aujourd\'hui', icon: '📖' },
  { href: '/calendar', label: 'Calendrier', icon: '📅' },
  { href: '/vocabulary', label: 'Vocabulaire', icon: '📦' },
  { href: '/profile', label: 'Profil', icon: '👤' },
]

export default function BottomNav() {
  const pathname = usePathname()

  if (NO_NAV_PATHS.includes(pathname)) return null

  return (
    <nav className="fixed bottom-0 z-50 h-16
                    left-1/2 -translate-x-1/2 w-full max-w-md
                    bg-surface border-t border-surface-raised
                    flex items-center justify-around
                    safe-area-inset-bottom">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href === '/today' && pathname.startsWith('/read'))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl
                        transition-colors min-w-0 ${
              isActive ? 'text-accent' : 'text-text-secondary'
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
