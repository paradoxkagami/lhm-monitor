import { memo } from '@/core/memo'
import type { ParsedDevice } from '@/core/types'
import { GaugeRing } from './GaugeRing'
import { TempBar } from './TempBar'
import { SensorRow } from './SensorRow'
import styles from '@/styles/components/Dashboard.module.css'

interface DeviceCardProps {
  device: ParsedDevice
  gaugeSize?: number
}

function renderSensors(device: ParsedDevice) {
  if (!device.sensors || device.sensors.length === 0) return null

  // 按类别分组
  const groups: Record<string, typeof device.sensors> = {}
  for (const s of device.sensors) {
    ;(groups[s.category] ??= []).push(s)
  }

  const order = [
    'Temperature',
    'Load',
    'Power',
    'Clock',
    'Fan',
    'Data',
    'Voltage',
  ]

  return order
    .filter((cat) => groups[cat]?.length)
    .map((cat) => (
      <div key={cat} class={styles.sensorGroup}>
        {cat === 'Temperature' &&
          groups[cat]!.map((s) => (
            <TempBar
              key={s.name}
              name={s.name}
              value={s.value}
              max={s.max}
            />
          ))}
        {(cat === 'Load' && device.load !== undefined) ||
        cat !== 'Temperature' ? (
          groups[cat]!.map((s) => <SensorRow key={s.name} sensor={s} />)
        ) : null}
      </div>
    ))
}

export const DeviceCard = memo(function DeviceCard({
  device,
  gaugeSize = 90,
}: DeviceCardProps) {
  const hue = device.color.hue

  return (
    <div
      class={styles.card}
      style={{
        '--card-hue': hue,
        fontFamily: 'inherit',
      }}
    >
      <div class={styles.header}>
        <span
          class={styles.badge}
          style={{ background: `hsl(${hue}, 60%, 40%)` }}
        >
          {device.color.label}
        </span>
        <span class={styles.deviceName}>{device.name}</span>
      </div>

      <div class={styles.body}>
        {device.load !== undefined && (
          <div class={styles.gaugeWrap}>
            <GaugeRing
              value={device.load}
              label="Load"
              unit="%"
              size={gaugeSize}
            />
          </div>
        )}

        {device.maxTemp !== undefined && (
          <div class={styles.maxTemp}>
            <span class={styles.maxTempLabel}>最高温度</span>
            <span
              class={styles.maxTempValue}
              style={{
                color:
                  device.maxTemp >= 85
                    ? '#f87171'
                    : device.maxTemp >= 70
                    ? '#fb923c'
                    : '#4ade80',
              }}
            >
              {device.maxTemp.toFixed(1)}°C
            </span>
          </div>
        )}

        {renderSensors(device)}
      </div>
    </div>
  )
},
  // 自定义比较：只在传感器值变化时重新渲染
  (prev, next) => {
    if (prev.device.name !== next.device.name) return false
    if (prev.device.load !== next.device.load) return false
    if (prev.device.maxTemp !== next.device.maxTemp) return false
    if (prev.device.sensors.length !== next.device.sensors.length) return false

    // 逐个比较传感器值
    for (let i = 0; i < prev.device.sensors.length; i++) {
      const a = prev.device.sensors[i]
      const b = next.device.sensors[i]
      if (
        a.value !== b.value ||
        a.name !== b.name ||
        a.min !== b.min ||
        a.max !== b.max
      )
        return false
    }
    return true
  }
)
