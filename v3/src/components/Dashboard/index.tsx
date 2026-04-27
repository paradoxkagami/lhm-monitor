import { memo } from '@/core/memo'
import type { ParsedData, PollStatus, ColumnMode } from '@/core/types'
import { DeviceCard } from './DeviceCard'
import { useResizeObserver } from '@/hooks'
import styles from '@/styles/components/Dashboard.module.css'

interface DashboardProps {
  data: ParsedData | null
  columnMode: ColumnMode
  status: PollStatus
}

const MIN_CARD_WIDTH = 200

function computeColumns(columnMode: ColumnMode, containerWidth: number, deviceCount: number): number {
  if (columnMode !== 'auto') return parseInt(columnMode, 10)
  if (containerWidth <= 0) return Math.min(deviceCount, 3)
  const cols = Math.floor(containerWidth / MIN_CARD_WIDTH)
  return Math.max(1, Math.min(cols, 4))
}

export const Dashboard = memo(function Dashboard({ data, columnMode, status }: DashboardProps) {
  const { ref, width } = useResizeObserver<HTMLDivElement>()
  const columns = computeColumns(columnMode, width, data?.devices.length ?? 0)

  if (!data || !data.devices.length) {
    const errorMsg = status.type === 'error' ? status.message : null
    return (
      <div class={styles.dashboard} ref={ref}>
        <div class={styles.empty}>
          {errorMsg ? (
            <div class={styles.errorHint}>
              <span class={styles.errorIcon}>⚠️</span>
              <span>{errorMsg}</span>
              <div class={styles.errorTips}>
                <p>排查建议：</p>
                <p>1. 确保目标电脑已运行 LibreHardwareMonitor</p>
                <p>2. 确认「远程 Web 服务器」已启用</p>
                <p>3. 检查防火墙是否放行端口</p>
              </div>
            </div>
          ) : status.type === 'polling' ? (
            <div class={styles.emptyData}>
              <span class={styles.emptyIcon}>📡</span>
              <span>已连接 {data?.pc_name || ''}，但未检测到硬件传感器</span>
              <span class={styles.emptySub}>请检查目标电脑上 LibreHardwareMonitor 是否正常运行</span>
            </div>
          ) : (
            <span class={styles.placeholder}>输入目标 IP 并点击连接</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div class={styles.dashboard} ref={ref} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {data.devices.map((device) => (
        <DeviceCard key={device.name} device={device} />
      ))}
    </div>
  )
})
