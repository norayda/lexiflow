self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()))

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url ?? '/today'
  e.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((cs) => {
        const existing = cs.find((c) => 'focus' in c)
        if (existing) {
          existing.navigate(url)
          return existing.focus()
        }
        return clients.openWindow(url)
      })
  )
})

// Ready for real Web Push if a push server is added later
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'LexiFlow', {
      body: data.body ?? "Ton texte du jour t'attend !",
      icon: '/mini_LF.jpeg',
      badge: '/mini_LF.jpeg',
      tag: 'daily-reminder',
      data: { url: data.url ?? '/today' },
    })
  )
})
