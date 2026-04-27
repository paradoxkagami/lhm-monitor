import { useState, useEffect, useRef, useCallback } from 'preact/hooks'
import { fetchLHMData, ConnectionError } from '@/core/connection'
import { parseLHMData } from '@/core/parser'
import type { ParsedData } from '@/core/types'

interface PollingState {
  data: ParsedData | null
  error: string | null
  status: 'idle' | 'connecting' | 'polling' | 'error'
  latencyMs: number
  retryCount: number
  lastUpdate: number | null
}

interface UsePollingReturn extends PollingState {
  start: (ip: string, port: number, interval: number) => void
  stop: () => void
  paused: boolean
  setPaused: (v: boolean) => void
}

export function usePolling(): UsePollingReturn {
  const [state, setState] = useState<PollingState>({
    data: null,
    error: null,
    status: 'idle',
    latencyMs: 0,
    retryCount: 0,
    lastUpdate: null,
  })
  const [paused, setPaused] = useState(false)

  const configRef = useRef({ ip: '', port: 0, interval: 3000 })
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const abortRef = useRef<AbortController>()
  const retryRef = useRef(0)
  const runningRef = useRef(false)

  const stop = useCallback(() => {
    runningRef.current = false
    clearTimeout(timerRef.current)
    abortRef.current?.abort()
    setState((s) => ({ ...s, status: 'idle' }))
  }, [])

  const poll = useCallback(async () => {
    if (!runningRef.current) return

    const { ip, port, interval } = configRef.current
    const baseUrl = `http://${ip}:${port}`

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const { data, latencyMs } = await fetchLHMData(baseUrl, 5000)
      if (!runningRef.current) return

      const parsed = parseLHMData(data)

      setState((s) => ({
        ...s,
        data: parsed,
        error: null,
        status: 'polling',
        latencyMs,
        retryCount: 0,
        lastUpdate: Date.now(),
      }))
      retryRef.current = 0
    } catch (err: any) {
      if (!runningRef.current) return

      retryRef.current++
      const retryCount = retryRef.current
      const message = err instanceof ConnectionError
        ? err.isTimeout
          ? '连接超时——请检查目标机器是否在线'
          : `无法连接 (${err.status || '网络错误'})`
        : err.message || '未知错误'

      setState((s) => ({
        ...s,
        error: message,
        status: 'error',
        data: s.data,
        retryCount,
      }))
    }

    if (!runningRef.current) return

    // 指数退避
    const backoff = retryRef.current === 0
      ? interval
      : Math.min(interval * Math.pow(2, Math.min(retryRef.current - 1, 4)), 60000)

    timerRef.current = setTimeout(poll, backoff)
  }, [])

  const start = useCallback(
    (ip: string, port: number, interval: number) => {
      stop()

      configRef.current = { ip, port, interval: interval * 1000 }
      retryRef.current = 0
      runningRef.current = true

      setState((s) => ({
        ...s,
        status: 'connecting',
        error: null,
        retryCount: 0,
      }))

      // 首次立即执行
      poll()
    },
    [stop, poll]
  )

  // paused 控制
  useEffect(() => {
    if (paused && runningRef.current) {
      clearTimeout(timerRef.current)
      abortRef.current?.abort()
    } else if (!paused && runningRef.current) {
      poll()
    }
  }, [paused, poll])

  // 卸载时清理
  useEffect(() => {
    return () => {
      runningRef.current = false
      clearTimeout(timerRef.current)
      abortRef.current?.abort()
    }
  }, [])

  return { ...state, start, stop, paused, setPaused }
}
