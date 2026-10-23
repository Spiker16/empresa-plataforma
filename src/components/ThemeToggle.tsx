'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = localStorage.getItem('theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const dark = stored ? stored === 'dark' : prefersDark
      setIsDark(dark)
      setMounted(true)
      document.documentElement.classList.toggle('dark', dark)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  // Evita parpadeo/mismatch de hidratación mientras se lee la preferencia
  if (!mounted) {
    return <div className="h-10 w-10 rounded-full border border-slate-200 dark:border-white/10" />
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow-sm backdrop-blur-md transition-all hover:border-amber-400 hover:text-amber-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-amber-500/50 dark:hover:text-amber-400"
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px] transition-transform group-hover:rotate-45" />
      ) : (
        <Moon className="h-[18px] w-[18px] transition-transform group-hover:-rotate-12" />
      )}
    </button>
  )
}