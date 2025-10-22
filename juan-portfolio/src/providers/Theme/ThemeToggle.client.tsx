'use client'
import React from 'react'
import { useTheme } from './ThemeProvider.client'
import { Sun, Moon } from 'lucide-react'

const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggle } = useTheme()

  return (
    <button className={className} onClick={toggle} aria-label="Toggle theme">
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

export default ThemeToggle
