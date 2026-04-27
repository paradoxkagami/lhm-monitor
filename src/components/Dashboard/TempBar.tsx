import { memo } from '@/core/memo'
import { getTempColor } from '@/core/parser'
import styles from '@/styles/components/Gauge.module.css'

interface TempBarProps {
  name: string
  value: number
  max: number
}

export const TempBar = memo(
  function TempBar({ name, value, max }: TempBarProps) {
    const pct = max > 0 ? Math.min((value / 100) * 100, 100) : 0 // 按 100°C 为满量程
    const color = getTempColor(value)

    return (
      <div class={styles.tempBar}>
        <span class={styles.tempName}>{name}</span>
        <div class={styles.tempTrack}>
          <div
            class={styles.tempFill}
            style={{ width: `${Math.min(pct, 100)}%`, background: color }}
          />
        </div>
        <span class={styles.tempValue} style={{ color }}>
          {value.toFixed(1)}°C
        </span>
      </div>
    )
  },
  (prev, next) =>
    prev.value === next.value && prev.name === next.name && prev.max === next.max
)
