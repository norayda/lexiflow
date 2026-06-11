'use client'
import { useEffect } from 'react'

const NOTIF_DATE_KEY = 'lexiflow-notif-date'

export default function NotificationManager() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('Notification' in window)
    ) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        if (Notification.permission === 'granted') {
          maybeNotifyToday(reg)
        }
      })
      .catch(() => {})
  }, [])

  return null
}

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch {
    return null
  }
}

export async function requestNotifPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  const perm = await Notification.requestPermission()
  if (perm === 'granted') {
    const reg = await navigator.serviceWorker.ready
    maybeNotifyToday(reg)
  }
  return perm
}

function maybeNotifyToday(reg: ServiceWorkerRegistration) {
  const today = new Date().toISOString().split('T')[0]
  if (localStorage.getItem(NOTIF_DATE_KEY) === today) return
  localStorage.setItem(NOTIF_DATE_KEY, today)

  reg.showNotification('LexiFlow', {
    body: "Ton texte du jour t'attend ! 📖",
    icon: '/mini_LF.jpeg',
    badge: '/mini_LF.jpeg',
    tag: 'daily-reminder',
    data: { url: '/today' },
  })
}
