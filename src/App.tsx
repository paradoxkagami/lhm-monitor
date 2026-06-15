import { useState, useCallback, useEffect, useMemo, useRef } from 'preact/hooks'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { LogicalSize, LogicalPosition } from '@tauri-apps/api/dpi'
import { invoke } from '@tauri-apps/api/core'
import { loadWindowBounds, saveWindowBounds } from '@/core/api'
import type { UpdateInfo } from '@/core/types'
import { TitleBar } from '@/components/TitleBar'
import { Dashboard } from '@/components/Dashboard'
import { Settings } from '@/components/Settings'
import { StatusBar } from '@/components/StatusBar'
import { useSettings, usePolling, useTheme } from '@/hooks'
import { formatFontFamily } from '@/core/utils'

export function App() {
  const { settings, updateSettings } = useSettings()
  const { status, data, start, stop } = usePolling()
  useTheme(settings?.theme)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)

  const appWindow = useMemo(() => getCurrentWindow(), [])
  const prevScaleRef = useRef(settings?.dpi_scale ?? 100)

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const info = await invoke<UpdateInfo>('check_update')
        if (info.has_update) setUpdateInfo(info)
      } catch {}
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!settings?.ip) return
    const t = setTimeout(() => start(settings.ip, settings.port, settings.interval), 500)
    return () => clearTimeout(t)
  }, [settings?.ip, settings?.port, settings?.interval, start])

  useEffect(() => {
    if (!settings) return
    const currentScale = settings.dpi_scale
    const prevScale = prevScaleRef.current
    prevScaleRef.current = currentScale

    if (prevScale === currentScale) return

    const applyScale = async () => {
      try {
        const size = await appWindow.innerSize()
        const factor = currentScale / prevScale
        const newW = Math.round(size.width * factor)
        const newH = Math.round(size.height * factor)
        await appWindow.setSize(new LogicalSize(newW, newH))
      } catch {}
    }
    applyScale()
  }, [settings?.dpi_scale, appWindow])

  useEffect(() => {
    const storeBounds = async () => {
      try {
        const size = await appWindow.outerSize()
        const pos = await appWindow.outerPosition()
        await saveWindowBounds({ width: size.width, height: size.height, x: pos.x, y: pos.y })
      } catch {}
    }

    const loadBounds = async () => {
      const bounds = await loadWindowBounds()
      try {
        await appWindow.setSize(new LogicalSize(bounds.width, bounds.height))
        await appWindow.setPosition(new LogicalPosition(bounds.x, bounds.y))
      } catch {}
    }

    loadBounds()

    let debounceTimer: ReturnType<typeof setTimeout> | undefined

    const debouncedStore = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(storeBounds, 2000)
    }

    const unlistenResize = appWindow.onResized(debouncedStore)
    const unlistenMove = appWindow.onMoved(debouncedStore)

    return () => {
      clearTimeout(debounceTimer)
      unlistenResize.then((fn) => fn())
      unlistenMove.then((fn) => fn())
    }
  }, [appWindow])

  const handleConnect = useCallback(() => {
    if (settings?.ip) {
      start(settings.ip, settings.port, settings.interval)
    }
  }, [settings, start])

  const handleStop = useCallback(() => stop(), [stop])

  const handleTogglePin = useCallback(async () => {
    const newPinned = !pinned
    setPinned(newPinned)
    await appWindow.setAlwaysOnTop(newPinned)
  }, [pinned, appWindow])

  const handleHideToTray = useCallback(async () => {
    await appWindow.hide()
  }, [appWindow])

  const handleMinimize = useCallback(async () => {
    await appWindow.minimize()
  }, [appWindow])

  const handleMaximize = useCallback(async () => {
    const isMax = await appWindow.isMaximized()
    if (isMax) await appWindow.unmaximize()
    else await appWindow.maximize()
  }, [appWindow])

  const handleClose = useCallback(() => {
    appWindow.hide()
  }, [appWindow])

  const fontSize = settings?.font_size ?? 13
  const fontFamily = settings?.font_family ?? ''

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--font-size-base', `${fontSize}px`)
    if (fontFamily) {
      root.style.setProperty('--font-family', formatFontFamily(fontFamily))
    }
  }, [fontSize, fontFamily])

  if (!settings) return null

  return (
    <div class="app-shell">
      <TitleBar
        pcName={data?.pc_name ?? ''}
        status={status}
        pinned={pinned}
        settingsOpen={settingsOpen}
        updateInfo={updateInfo}
        onToggleSettings={() => setSettingsOpen((v) => !v)}
        onTogglePin={handleTogglePin}
        onHideToTray={handleHideToTray}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onClose={handleClose}
      />
      <Settings
        open={settingsOpen}
        settings={settings}
        data={data}
        status={status}
        onUpdate={updateSettings}
        onConnect={handleConnect}
        onStop={handleStop}
        onClose={() => setSettingsOpen(false)}
      />
      <Dashboard
        data={data}
        columnMode={settings.column_mode}
        hiddenDevices={settings.hidden_devices}
        status={status}
      />
      <StatusBar status={status} />
    </div>
  )
}