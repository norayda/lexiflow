/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme-sensitive: use CSS RGB variables so Tailwind opacity modifiers work
        // e.g. bg-surface/50 → background-color: rgb(var(--rgb-surface) / 0.5)
        background:      'rgb(var(--rgb-background)      / <alpha-value>)',
        surface:         'rgb(var(--rgb-surface)         / <alpha-value>)',
        'surface-raised':'rgb(var(--rgb-surface-raised)  / <alpha-value>)',
        'text-primary':  'rgb(var(--rgb-text-primary)    / <alpha-value>)',
        'text-secondary':'rgb(var(--rgb-text-secondary)  / <alpha-value>)',
        // Theme-agnostic: keep as hex (accent is identical in both themes)
        accent:          '#6c63ff',
        'accent-light':  '#8b85ff',
        success:         '#4ade80',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
