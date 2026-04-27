import { memo } from '@/core/memo'
import { useCallback, useState } from 'preact/hooks'
import styles from '@/styles/components/TitleBar.module.css'

interface TitleBarProps {
  pcName: string
  status: 'idle' | 'connecting' | 'polling' | 'error'
  pinned: boolean
  onToggleSettings: () => void
  onTogglePin: () => void
  onHideToTray: () => void
}

export const TitleBar = memo(function TitleBar({
  pcName,
  status,
  pinned,
  onToggleSettings,
  onTogglePin,
  onHideToTray,
}: TitleBarProps) {
  const api = window.electronAPI
  const [maximized, setMaximized] = useState(false)

  const statusLabel =
    status === 'polling'
      ? '在线'
      : status === 'connecting'
      ? '连接中...'
      : status === 'error'
      ? '离线'
      : '未连接'

  const handleMaximize = useCallback(() => {
    setMaximized((v) => !v)
    api?.maximize()
  }, [api])

  return (
    <div class={styles.titlebar} data-tauri-drag-region>
      <div class={styles.left}>
        <span class={styles.icon}>📊</span>
        <span class={styles.title}>LHM Monitor</span>
        {pcName && <span class={styles.pcName}>{pcName}</span>}
        <span
          class={`${styles.status} ${
            status === 'polling'
              ? styles.online
              : status === 'error'
              ? styles.offline
              : styles.idle
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div class={styles.right}>
        <button
          class={styles.ctrlBtn}
          onClick={onToggleSettings}
          title="设置 (S)"
        >
          ⚙️
        </button>
        <button
          class={`${styles.ctrlBtn} ${pinned ? styles.active : ''}`}
          onClick={onTogglePin}
          title="置顶 (T)"
        >
          📌
        </button>
        <button
          class={styles.ctrlBtn}
          onClick={onHideToTray}
          title="隐藏到托盘"
        >
          🔽
        </button>

        {api && (
          <>
            <button
              class={styles.ctrlBtn}
              onClick={() => api.minimize()}
              title="最小化"
            >
              ─
            </button>
            <button
              class={styles.ctrlBtn}
              onClick={handleMaximize}
              title="最大化"
            >
              {maximized ? '❐' : '□'}
            </button>
            <button
              class={`${styles.ctrlBtn} ${styles.closeBtn}`}
              onClick={() => api.close()}
              title="关闭"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  )
})
