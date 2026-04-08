'use client'
import React, { useEffect, useState } from 'react'
import { useTheme } from './ThemeProvider.client'
import { Sun, Moon } from 'lucide-react'

const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggle } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Render a neutral button on server to avoid mismatch. Icon is shown after mount.
  return (
    <button className={className} onClick={toggle} aria-label="Toggle theme">
      {mounted ? theme === 'dark' ? <Sun size={18} /> : <Moon size={18} /> : null}
    </button>
  )
}

export default ThemeToggle
