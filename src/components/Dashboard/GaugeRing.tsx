import { memo } from '@/core/memo'
import { getLoadColor } from '@/core/types'
import styles from '@/styles/components/Gauge.module.css'

interface GaugeRingProps {
  value: number
  label: string
  unit?: string
  size?: number
}

export const GaugeRing = memo(
  function GaugeRing({ value, label, unit = '%', size = 90 }: GaugeRingProps) {
    const strokeWidth = 6
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const progress = Math.min(value, 100)
    const dashOffset = circumference * (1 - progress / 100)
    const color = getLoadColor(progress)

    return (
      <div class={styles.gauge} style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} class={styles.svg}>
          <circle class={styles.track} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke-width={strokeWidth} />
          <circle
            class={styles.fill}
            cx={size / 2} cy={size / 2} r={radius} fill="none" stroke-width={strokeWidth}
            stroke={color} stroke-dasharray={circumference} stroke-dashoffset={dashOffset}
            stroke-linecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div class={styles.valueWrap}>
          <span class={styles.value} style={{ color }}>{Math.round(progress)}</span>
          <span class={styles.unit}>{unit}</span>
        </div>
        <span class={styles.label}>{label}</span>
      </div>
    )
  },
  (prev, next) => prev.value === next.value && prev.label === next.label
)
