import { useState, useEffect, useCallback } from 'preact/hooks'
import type { AppSettings } from '@/core/types'
import { DEFAULT_SETTINGS } from '@/core/types'

const STORE_KEY = 'lhm_settings'

function readFromStore(): Partial<AppSettings> | null {
  try {
    if (window.electronAPI) {
      // Electron: 异步 → 同步退化读取
      // 这里用 localStorage 做启动缓存
      const raw = localStorage.getItem(STORE_KEY)
      return raw ? JSON.parse(raw) : null
    }
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

async function writeToStore(settings: AppSettings): Promise<void> {
  localStorage.setItem(STORE_KEY, JSON.stringify(settings))
  if (window.electronAPI) {
    window.electronAPI.storeSet(STORE_KEY, settings)
  }
}

async function loadFromElectron(): Promise<AppSettings | null> {
  if (!window.electronAPI) return null
  try {
    const raw = await window.electronAPI.storeGet(STORE_KEY)
    if (raw) return raw as AppSettings
  } catch { /* 忽略 */ }
  return null
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  // 启动时从持久化存储加载
  useEffect(() => {
    ;(async () => {
      // 优先 electron-store
      const fromElectron = await loadFromElectron()
      if (fromElectron) {
        setSettings(fromElectron)
        setLoaded(true)
        return
      }

      // 其次 localStorage
      const fromLocal = readFromStore()
      if (fromLocal) {
        setSettings((s) => ({ ...s, ...fromLocal }))
      }
      setLoaded(true)
    })()
  }, [])

  const updateSettings = useCallback(
    (partial: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial }
        writeToStore(next) // 异步写入，不阻塞 UI
        return next
      })
    },
    []
  )

  return { settings, updateSettings, loaded }
}
