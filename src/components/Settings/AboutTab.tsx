import { memo } from '@/core/memo'
import { useState, useCallback } from 'preact/hooks'
import { invoke } from '@tauri-apps/api/core'
import styles from '@/styles/components/Settings.module.css'

interface UpdateInfo {
  has_update: boolean
  latest_version: string
  current_version: string
  html_url: string
}

type CheckState = 'idle' | 'checking' | 'up-to-date' | 'available' | 'error'

export const AboutTab = memo(function AboutTab() {
  const [state, setState] = useState<CheckState>('idle')
  const [info, setInfo] = useState<UpdateInfo | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCheck = useCallback(async () => {
    setState('checking')
    setErrorMsg('')
    try {
      const result = await invoke<UpdateInfo>('check_update')
      setInfo(result)
      setState(result.has_update ? 'available' : 'up-to-date')
    } catch (e) {
      setErrorMsg(String(e))
      setState('error')
    }
  }, [])

  const handleDownload = useCallback(async () => {
    if (!info?.html_url) return
    try {
      await invoke('open_url', { url: info.html_url })
    } catch {}
  }, [info])

  return (
    <div class={styles.tab}>
      <div class={styles.aboutSection}>
        <div class={styles.aboutIcon}>📊</div>
        <div class={styles.aboutTitle}>LHM Monitor</div>
        <div class={styles.aboutVersion}>v{info?.current_version || '—'}</div>
      </div>

      <div class={styles.field}>
        <span>检查更新</span>
        {state === 'idle' && (
          <button class={`${styles.btn} ${styles.connectBtn}`} onClick={handleCheck}>
            🔍 检查更新
          </button>
        )}
        {state === 'checking' && (
          <div class={styles.updateStatus}>
            <span class={styles.spinner} /> 正在检查...
          </div>
        )}
        {state === 'up-to-date' && (
          <div class={styles.updateStatus}>
            ✅ 已是最新版本 (v{info?.latest_version})
          </div>
        )}
        {state === 'available' && (
          <div class={styles.updateAvailable}>
            <div class={styles.updateStatus}>
              🆕 发现新版本 v{info?.latest_version}
            </div>
            <button class={`${styles.btn} ${styles.connectBtn}`} onClick={handleDownload}>
              ⬇️ 前往下载
            </button>
          </div>
        )}
        {state === 'error' && (
          <div class={styles.updateAvailable}>
            <div class={`${styles.updateStatus} ${styles.updateError}`}>
              ❌ 检查失败：{errorMsg}
            </div>
            <button class={`${styles.btn} ${styles.resetBtn}`} onClick={handleCheck}>
              🔄 重试
            </button>
          </div>
        )}
      </div>

      <div class={styles.aboutFooter}>
        <span>基于 LibreHardwareMonitor 的硬件监控工具</span>
        <span>使用 Tauri + Preact 构建</span>
      </div>
    </div>
  )
})
