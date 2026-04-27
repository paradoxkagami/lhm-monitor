import { memo } from '@/core/memo'
import styles from '@/styles/components/StatusBar.module.css'

interface StatusBarProps {
  status: 'idle' | 'connecting' | 'polling' | 'error'
  latencyMs: number
  lastUpdate: number | null
  error: string | null
}

export const StatusBar = memo(function StatusBar({
  status,
  latencyMs,
  lastUpdate,
  error,
}: StatusBarProps) {
  const timeStr = lastUpdate
    ? new Date(lastUpdate).toLocaleTimeString('zh-CN', { hour12: false })
    : '--:--:--'

  return (
    <div class={styles.statusBar}>
      <span class={styles.left}>
        {status === 'polling' && (
          <span class={styles.latency}>
            延迟 {latencyMs}ms
          </span>
        )}
        {status === 'error' && error && (
          <span class={styles.error}>{error}</span>
        )}
        {status === 'connecting' && (
          <span class={styles.connecting}>连接中...</span>
        )}
        {status === 'idle' && (
          <span class={styles.idle}>就绪 — 请配置连接</span>
        )}
      </span>
      <span class={styles.right}>
        最后更新 {timeStr}
      </span>
    </div>
  )
})
