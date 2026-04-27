import { memo } from '@/core/memo'
import { useState, useCallback } from 'preact/hooks'
import type { AppSettings } from '@/core/types'
import styles from '@/styles/components/Settings.module.css'

interface BasicTabProps {
  settings: AppSettings
  onUpdate: (partial: Partial<AppSettings>) => void
  status: 'idle' | 'connecting' | 'polling' | 'error'
  onConnect: () => void
  onStop: () => void
}

export const BasicTab = memo(function BasicTab({
  settings,
  onUpdate,
  status,
  onConnect,
  onStop,
}: BasicTabProps) {
  const [ip, setIp] = useState(settings.ip)
  const [port, setPort] = useState(String(settings.port))
  const [interval, setInterval] = useState(String(settings.interval))

  const handleApply = useCallback(() => {
    onUpdate({
      ip,
      port: parseInt(port, 10) || 8085,
      interval: parseInt(interval, 10) || 3,
    })
    onConnect()
  }, [ip, port, interval, onUpdate, onConnect])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleApply()
    },
    [handleApply]
  )

  const isRunning = status === 'polling' || status === 'connecting'

  return (
    <div class={styles.tab}>
      <label class={styles.field}>
        <span>目标 IP</span>
        <input
          type="text"
          value={ip}
          onInput={(e) => setIp(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="192.168.1.x"
          class={styles.input}
          disabled={isRunning}
        />
      </label>

      <label class={styles.field}>
        <span>端口</span>
        <input
          type="number"
          value={port}
          onInput={(e) => setPort(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="8085"
          class={styles.input}
          disabled={isRunning}
        />
      </label>

      <label class={styles.field}>
        <span>刷新间隔（秒）</span>
        <input
          type="number"
          value={interval}
          onInput={(e) => setInterval(e.currentTarget.value)}
          min="1"
          max="60"
          class={styles.input}
        />
      </label>

      <div class={styles.actions}>
        {isRunning ? (
          <button class={`${styles.btn} ${styles.stopBtn}`} onClick={onStop}>
            ⏹ 停止
          </button>
        ) : (
          <button
            class={`${styles.btn} ${styles.connectBtn}`}
            onClick={handleApply}
            disabled={!ip.trim()}
          >
            ▶ 连接
          </button>
        )}
        <button
          class={`${styles.btn} ${styles.resetBtn}`}
          onClick={() => {
            setIp('')
            setPort('8085')
            setInterval('3')
          }}
        >
          ↺ 重置
        </button>
      </div>
    </div>
  )
})
