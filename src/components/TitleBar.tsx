import { memo } from '@/core/memo'
import styles from '@/styles/components/TitleBar.module.css'
import type { PollStatus } from '@/core/types'

interface TitleBarProps {
  pcName: string
  status: PollStatus
  pinned: boolean
  settingsOpen: boolean
  onToggleSettings: () => void
  onTogglePin: () => void
  onHideToTray: () => void
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
}

export const TitleBar = memo(function TitleBar({
  pcName,
  status,
  pinned,
  settingsOpen,
  onToggleSettings,
  onTogglePin,
  onHideToTray,
  onMinimize,
  onMaximize,
  onClose,
}: TitleBarProps) {
  const statusLabel =
    status.type === 'polling' ? '在线'
    : status.type === 'connecting' ? '连接中...'
    : status.type === 'error' ? '离线'
    : '未连接'

  const statusClass =
    status.type === 'polling' ? styles.online
    : status.type === 'error' ? styles.offline
    : styles.idle

  return (
    <div class={styles.titlebar} data-tauri-drag-region>
      <div class={styles.left}>
        <button class={`${styles.menuBtn} ${settingsOpen ? styles.menuActive : ''}`} onClick={onToggleSettings} title="设置菜单 (S)">
          <span class={styles.icon}>📊</span>
          <span class={styles.menuTitle}>LHM Monitor</span>
          <span class={styles.menuArrow}>{settingsOpen ? '▲' : '▼'}</span>
        </button>
        {pcName && <span class={styles.pcName}>{pcName}</span>}
        <span class={`${styles.status} ${statusClass}`}>
          {statusLabel}
        </span>
      </div>
      <div class={styles.right}>
        <button class={`${styles.ctrlBtn} ${pinned ? styles.active : ''}`} onClick={onTogglePin} title="置顶 (T)">📌</button>
        <button class={styles.ctrlBtn} onClick={onHideToTray} title="隐藏到托盘">🔽</button>
        <button class={styles.ctrlBtn} onClick={onMinimize} title="最小化">─</button>
        <button class={styles.ctrlBtn} onClick={onMaximize} title="最大化">□</button>
        <button class={`${styles.ctrlBtn} ${styles.closeBtn}`} onClick={onClose} title="关闭">✕</button>
      </div>
    </div>
  )
})
