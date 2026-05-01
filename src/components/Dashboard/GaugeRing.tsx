import { memo } from '@/core/memo'
import { getLoadColor } from '@/core/types'
import styles from '@/styles/components/Gauge.module.css'

interface GaugeRingProps {
  value: number
  label: string
  unit?: string
  size?: number
}

const SEGMENTS = 20
const SEG_GAP = 3
const ARC_START = -225
const ARC_SPAN = 270

function segPath(cx: number, cy: number, r: number, sw: number, startDeg: number, spanDeg: number): string {
  const rad = (Math.PI / 180)
  const a1 = rad * startDeg
  const a2 = rad * (startDeg + spanDeg)
  const outerR = r + sw / 2
  const innerR = r - sw / 2
  const ox1 = cx + outerR * Math.cos(a1)
  const oy1 = cy + outerR * Math.sin(a1)
  const ox2 = cx + outerR * Math.cos(a2)
  const oy2 = cy + outerR * Math.sin(a2)
  const ix1 = cx + innerR * Math.cos(a2)
  const iy1 = cy + innerR * Math.sin(a2)
  const ix2 = cx + innerR * Math.cos(a1)
  const iy2 = cy + innerR * Math.sin(a1)
  const large = spanDeg > 180 ? 1 : 0
  return `M${ox1},${oy1} A${outerR},${outerR} 0 ${large} 1 ${ox2},${oy2} L${ix1},${iy1} A${innerR},${innerR} 0 ${large} 0 ${ix2},${iy2} Z`
}

export const GaugeRing = memo(
  function GaugeRing({ value, label, unit = '%', size = 72 }: GaugeRingProps) {
    const strokeWidth = 5
    const radius = (size - strokeWidth - 8) / 2
    const cx = size / 2
    const cy = size / 2
    const progress = Math.min(value, 100)
    const color = getLoadColor(progress)
    const filledSegs = Math.round((progress / 100) * SEGMENTS)
    const segSpan = (ARC_SPAN - SEG_GAP * (SEGMENTS - 1)) / SEGMENTS

    const segments = Array.from({ length: SEGMENTS }, (_, i) => {
      const startDeg = ARC_START + i * (segSpan + SEG_GAP)
      const d = segPath(cx, cy, radius, strokeWidth, startDeg, segSpan)
      const isActive = i < filledSegs
      return { d, isActive, key: i }
    })

    return (
      <div class={styles.gauge}>
        <div class={styles.ring} style={{ width: size, height: size }}>
          <svg viewBox={`0 0 ${size} ${size}`} class={styles.svg}>
            {segments.map((s) => (
              <path
                key={s.key}
                d={s.d}
                class={`${styles.seg} ${s.isActive ? styles.segActive : ''}`}
                style={s.isActive ? { fill: color } : undefined}
              />
            ))}
            <path
              d={`M${cx - 3},${cy - radius + strokeWidth / 2 + 2} L${cx},${cy - radius - 2} L${cx + 3},${cy - radius + strokeWidth / 2 + 2} Z`}
              class={styles.marker}
              style={{ fill: color }}
            />
          </svg>
        </div>
        <div class={styles.readout}>
          <div class={styles.readoutRow}>
            <span class={styles.readoutValue} style={{ color }}>{Math.round(progress)}</span>
            <span class={styles.readoutUnit} style={{ color }}>{unit}</span>
          </div>
          <span class={styles.readoutLabel}>{label}</span>
        </div>
      </div>
    )
  },
  (prev, next) => prev.value === next.value && prev.label === next.label
)
