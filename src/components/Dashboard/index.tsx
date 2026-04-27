import { memo } from '@/core/memo'
import { useMemo } from 'preact/hooks'
import type { ParsedData, ColumnMode } from '@/core/types'
import { DeviceCard } from './DeviceCard'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import styles from '@/styles/components/Dashboard.module.css'

interface DashboardProps {
  data: ParsedData | null
  columnMode: ColumnMode
  error: string | null
}

const MIN_CARD_WIDTH = 200

function computeColumns(
  columnMode: ColumnMode,
  containerWidth: number,
  deviceCount: number
): number {
  if (columnMode !== 'auto') return parseInt(columnMode, 10)

  if (containerWidth <= 0) return Math.min(deviceCount, 3)

  const cols = Math.floor(containerWidth / MIN_CARD_WIDTH)
  return Math.max(1, Math.min(cols, 4))
}

export const Dashboard = memo(function Dashboard({
  data,
  columnMode,
  error,
}: DashboardProps) {
  const { ref, width: containerWidth } = useResizeObserver<HTMLDivElement>()

  const columns = useMemo(
    () => computeColumns(columnMode, containerWidth, data?.devices.length ?? 0),
    [columnMode, containerWidth, data?.devices.length]
  )

  if (!data || !data.devices.length) {
    return (
      <div class={styles.dashboard} ref={ref}>
        <div class={styles.empty}>
          {error ? (
            <div class={styles.errorHint}>
              <span class={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
              <div class={styles.errorTips}>
                <p>排查建议：</p>
                <p>1. 确保目标电脑已运行 LibreHardwareMonitor</p>
                <p>2. 确认「远程 Web 服务器」已启用（选项 → 远程 Web 服务器 → 运行）</p>
                <p>3. 检查防火墙是否放行端口</p>
              </div>
            </div>
          ) : (
            <span class={styles.placeholder}>输入目标 IP 并点击连接</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      class={styles.dashboard}
      ref={ref}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {data.devices.map((device) => (
        <DeviceCard key={device.name} device={device} />
      ))}
    </div>
  )
})
