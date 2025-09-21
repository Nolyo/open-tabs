import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = localStorage.getItem('open-tabs-theme') as Theme | null
      if (savedTheme) {
        setTheme(savedTheme)
      } else {
        // Détecter le thème système
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setTheme(prefersDark ? 'dark' : 'light')
      }
    }

    loadTheme()
  }, [])

  useEffect(() => {
    // Appliquer le thème au document
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('open-tabs-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return { theme, toggleTheme, setTheme }
}