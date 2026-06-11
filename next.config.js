/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/daily_texts/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'daily-texts-cache',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
    ],
  },
})

const nextConfig = {
  reactStrictMode: true,
}

module.exports = withPWA(nextConfig)
