import { memo } from '@/core/memo'
import type { ParsedSensor } from '@/core/types'
import styles from '@/styles/components/Gauge.module.css'

interface SensorRowProps {
  sensor: ParsedSensor
}

export const SensorRow = memo(
  function SensorRow({ sensor }: SensorRowProps) {
    const { name, value, min, max, unit } = sensor
    const displayValue = Math.abs(value) < 100 ? value.toFixed(1) : Math.round(value).toString()
    const hasRange = max > min

    return (
      <div class={styles.sensorRow}>
        <span class={styles.sensorName}>{name}</span>
        <span class={styles.sensorValue}>
          {displayValue}
          {unit && <span class={styles.sensorUnit}>{unit}</span>}
        </span>
        {hasRange && (
          <span class={styles.sensorRange}>min {min.toFixed(1)} / max {max.toFixed(1)}</span>
        )}
      </div>
    )
  },
  (prev, next) =>
    prev.sensor.value === next.sensor.value &&
    prev.sensor.name === next.sensor.name &&
    prev.sensor.min === next.sensor.min &&
    prev.sensor.max === next.sensor.max
)
