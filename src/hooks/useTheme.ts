import { useState, useEffect } from 'preact/hooks'
import type { ThemeMode } from '@/core/types'

export function useTheme(externalMode: ThemeMode = 'dark') {
  const [mode, setMode] = useState<ThemeMode>(externalMode)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // 同步外部 theme 变化 → 内部 state
  useEffect(() => {
    setMode(externalMode)
  }, [externalMode])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const isDark = mode === 'auto' ? systemDark : mode === 'dark'
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [mode, systemDark])

  return { mode, setMode }
}
