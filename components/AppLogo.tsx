'use client'
import { useTheme } from '@/contexts/ThemeContext'

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'w-14 h-14 rounded-2xl',
  md: 'w-20 h-20 rounded-3xl',
  lg: 'w-28 h-28 rounded-[2rem]',
}

export default function AppLogo({ size = 'md', className = '' }: AppLogoProps) {
  const { theme } = useTheme()

  return (
    <div className={`overflow-hidden shadow-lg shadow-accent/10 ${sizeMap[size]} ${className}`}>
      <img
        src="/mini_LF.jpeg"
        alt="LexiFlow"
        className="w-full h-full object-cover transition-[filter] duration-300"
        style={theme === 'dark' ? { filter: 'brightness(0.82) saturate(0.85)' } : undefined}
      />
    </div>
  )
}
