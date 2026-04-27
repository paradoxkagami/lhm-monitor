import { memo } from '@/core/memo'
import styles from '@/styles/components/StatusBar.module.css'
import type { PollStatus } from '@/core/types'

interface StatusBarProps {
  status: PollStatus
}

export const StatusBar = memo(function StatusBar({ status }: StatusBarProps) {
  const lastUpdate = status.type === 'polling' ? status.last_update : null
  const timeStr = lastUpdate
    ? new Date(lastUpdate).toLocaleTimeString('zh-CN', { hour12: false })
    : '--:--:--'

  return (
    <div class={styles.statusBar}>
      <span class={styles.left}>
        {status.type === 'polling' && (
          <span class={styles.latency}>延迟 {status.latency_ms}ms</span>
        )}
        {status.type === 'error' && (
          <span class={styles.error}>{status.message}</span>
        )}
        {status.type === 'connecting' && (
          <span class={styles.connecting}>连接中...</span>
        )}
        {status.type === 'idle' && (
          <span class={styles.idleText}>就绪 — 请配置连接</span>
        )}
      </span>
      <span class={styles.right}>最后更新 {timeStr}</span>
    </div>
  )
})
