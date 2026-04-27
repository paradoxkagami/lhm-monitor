import { useState, useCallback, useEffect, useMemo } from 'preact/hooks'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { TitleBar } from '@/components/TitleBar'
import { Dashboard } from '@/components/Dashboard'
import { Settings } from '@/components/Settings'
import { StatusBar } from '@/components/StatusBar'
import { useSettings, usePolling, useTheme } from '@/hooks'

export function App() {
  const { settings, updateSettings } = useSettings()
  const { status, data, start, stop } = usePolling()
  const { isDark } = useTheme(settings?.theme)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pinned, setPinned] = useState(false)

  const appWindow = useMemo(() => getCurrentWindow(), [])

  useEffect(() => {
    if (!settings) return
    if (settings.ip) {
      const t = setTimeout(() => start(settings.ip, settings.port, settings.interval), 500)
      return () => clearTimeout(t)
    }
  }, [settings])

  useEffect(() => {
    const loadBounds = async () => {
      const { loadWindowBounds } = await import('@/core/api')
      const bounds = await loadWindowBounds()
      try {
        await appWindow.setSize(new (await import('@tauri-apps/api/dpi')).LogicalSize(bounds.width, bounds.height))
        await appWindow.setPosition(new (await import('@tauri-apps/api/dpi')).LogicalPosition(bounds.x, bounds.y))
      } catch {}
    }

    const saveBounds = async () => {
      const { saveWindowBounds } = await import('@/core/api')
      try {
        const size = await appWindow.outerSize()
        const pos = await appWindow.outerPosition()
        await saveWindowBounds({ width: size.width, height: size.height, x: pos.x, y: pos.y })
      } catch {}
    }

    loadBounds()

    const unlistenResize = setInterval(saveBounds, 5000)

    return () => clearInterval(unlistenResize)
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

  const rootStyle = useMemo(() => ({
    fontSize: `${settings?.font_size ?? 13}px`,
    fontFamily: settings?.font_family ?? 'inherit',
    '--dpi-scale': (settings?.dpi_scale ?? 100) / 100,
    '--theme-mode': isDark ? 'dark' : 'light',
  }), [settings, isDark])

  if (!settings) return null

  return (
    <div class="app-shell" style={rootStyle}>
      <TitleBar
        pcName={data?.pc_name ?? ''}
        status={status}
        pinned={pinned}
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
        status={status}
        onUpdate={updateSettings}
        onConnect={handleConnect}
        onStop={handleStop}
        onClose={() => setSettingsOpen(false)}
      />
      <Dashboard
        data={data}
        columnMode={settings.column_mode}
        status={status}
      />
      <StatusBar status={status} />
    </div>
  )
}
