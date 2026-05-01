import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import type { AppSettings, PollStatus, ParsedData } from '@/core/types'
import * as api from '@/core/api'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    api.loadSettings().then((s) => setSettings(s))
  }, [])

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...partial }
      api.saveSettings(next)
      return next
    })
  }, [])

  return { settings, updateSettings }
}

export function usePolling() {
  const [status, setStatus] = useState<PollStatus>({ type: 'idle' })
  const [data, setData] = useState<ParsedData | null>(null)
  const [running, setRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    const unlisten = api.onPollStatus((s) => {
      setStatus(s)
    })
    return () => { unlisten.then(fn => fn()) }
  }, [])

  const start = useCallback(async (ip: string, port: number, interval: number) => {
    setRunning(true)
    setStatus({ type: 'connecting' })
    await api.connect(ip, port, interval)

    clearInterval(timerRef.current)
    timerRef.current = setInterval(async () => {
      const d = await api.getData()
      if (d) setData(d)
    }, 500)
  }, [])

  const stop = useCallback(async () => {
    setRunning(false)
    clearInterval(timerRef.current)
    await api.disconnect()
    setStatus({ type: 'idle' })
  }, [])

  return { status, data, running, start, stop }
}

export function useTheme(externalMode: string = 'dark') {
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const mode = externalMode || 'dark'
  const isDark = mode === 'auto' ? systemDark : mode === 'dark'

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')
    root.style.colorScheme = isDark ? 'dark' : 'light'
  }, [isDark])

  return { isDark }
}

export function useResizeObserver<T extends HTMLElement>() {
  const [ref, setRef] = useState<T | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!ref) return
    let rafId: number
    const observer = new ResizeObserver((entries) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        setWidth(entries[0].contentRect.width)
      })
    })
    observer.observe(ref)
    return () => { observer.disconnect(); cancelAnimationFrame(rafId) }
  }, [ref])

  return { ref: setRef, width }
}
