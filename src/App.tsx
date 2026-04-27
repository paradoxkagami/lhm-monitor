import { useState, useCallback, useEffect, useMemo } from 'preact/hooks'
import { TitleBar } from '@/components/TitleBar'
import { Dashboard } from '@/components/Dashboard'
import { Settings } from '@/components/Settings'
import { StatusBar } from '@/components/StatusBar'
import { usePolling } from '@/hooks/usePolling'
import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/hooks/useTheme'

export function App() {
  const { settings, updateSettings, loaded } = useSettings()
  const { mode } = useTheme(settings.theme)
  const {
    data,
    error,
    status,
    latencyMs,
    lastUpdate,
    retryCount,
    start,
    stop,
    paused,
    setPaused,
  } = usePolling()

  // UI 状态
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pinned, setPinned] = useState(false)

  // 监听置顶状态（Electron 主进程回复）
  useEffect(() => {
    if (!window.electronAPI) return
    return window.electronAPI.onTopState((p) => setPinned(p))
  }, [])

  // 窗口可见性控制
  useEffect(() => {
    if (!window.electronAPI) return
    return window.electronAPI.onWindowVisibility((visible) => {
      setPaused(!visible)
    })
  }, [setPaused])

  // 启动时自动连接（仅 Electron）
  useEffect(() => {
    if (!loaded) return
    if (settings.ip && window.electronAPI) {
      const t = setTimeout(() => {
        start(settings.ip, settings.port, settings.interval)
      }, 500)
      return () => clearTimeout(t)
    }
  }, [loaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      if (e.key === 's' || e.key === 'S') {
        setSettingsOpen((v) => !v)
      } else if (e.key === 't' || e.key === 'T') {
        window.electronAPI?.toggleTop()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleConnect = useCallback(() => {
    if (settings.ip) {
      start(settings.ip, settings.port, settings.interval)
    }
  }, [settings.ip, settings.port, settings.interval, start])

  const handleStop = useCallback(() => stop(), [stop])

  const handleTogglePin = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.toggleTop()
    } else {
      setPinned((v) => !v)
    }
  }, [])

  const handleHideToTray = useCallback(() => {
    window.electronAPI?.hide()
  }, [])

  // DPI 缩放
  const rootStyle = useMemo(
    () => ({
      fontSize: `${settings.fontSize}px`,
      fontFamily: settings.fontFamily,
      '--dpi-scale': settings.dpiScale / 100,
      '--theme-mode': mode,
    }),
    [settings.fontSize, settings.fontFamily, settings.dpiScale, mode]
  )

  return (
    <div class="app-shell" style={rootStyle}>
      <TitleBar
        pcName={data?.pcName ?? ''}
        status={status}
        pinned={pinned}
        onToggleSettings={() => setSettingsOpen((v) => !v)}
        onTogglePin={handleTogglePin}
        onHideToTray={handleHideToTray}
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

      <Dashboard data={data} columnMode={settings.columnMode} error={error} status={status} />

      <StatusBar
        status={status}
        latencyMs={latencyMs}
        lastUpdate={lastUpdate}
        error={error}
      />
    </div>
  )
}
