import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import { ThemeProvider } from '@/contexts/ThemeContext'
import NotificationManager from '@/components/NotificationManager'
import SwipeNavigation from '@/components/SwipeNavigation'

export const metadata: Metadata = {
  title: 'LexiFlow',
  description: 'Un texte par jour. Une langue à la fois.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LexiFlow',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/mini_LF.jpeg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/mini_LF.jpeg" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Runs synchronously before first paint to prevent theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('lexiflow-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {/*
            Outer shell: fills the viewport, provides the desktop "frame" background.
            Inner container: max-w-md (448px) centred – phone-width on desktop.
            On mobile (< 448px) the container is naturally full-width, outer bg is never visible.
          */}
          <div className="min-h-screen bg-surface flex flex-col items-center">
            <div className="relative w-full max-w-md bg-background min-h-screen
                            md:border-x md:border-surface-raised overflow-x-hidden">
              <main>{children}</main>
            </div>
          </div>
          <BottomNav />
          <NotificationManager />
          <SwipeNavigation />
        </ThemeProvider>
      </body>
    </html>
  )
}
