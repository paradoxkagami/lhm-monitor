import { memo } from '@/core/memo'
import { getTempColor, type ParsedDevice, type ParsedSensor } from '@/core/types'
import { GaugeRing } from './GaugeRing'
import { TempBar } from './TempBar'
import { SensorRow } from './SensorRow'
import styles from '@/styles/components/Dashboard.module.css'

interface DeviceCardProps {
  device: ParsedDevice
  gaugeSize?: number
}

function findSensor(sensors: ParsedSensor[], category: string, keywords: string[], exclude?: string[]): ParsedSensor | undefined {
  return sensors.find((s) => {
    if (s.category !== category) return false
    const lower = s.name.toLowerCase()
    const match = keywords.some((kw) => lower.includes(kw.toLowerCase()))
    if (!match) return false
    if (exclude && exclude.some((ex) => lower.includes(ex.toLowerCase()))) return false
    return true
  })
}

function renderSensors(device: ParsedDevice) {
  if (!device.sensors || device.sensors.length === 0) return null

  const groups: Record<string, typeof device.sensors> = {}
  for (const s of device.sensors) {
    ;(groups[s.category] ??= []).push(s)
  }

  const order = ['Temperature', 'Load', 'Power', 'Clock', 'Fan', 'Data', 'Voltage']

  return order
    .filter((cat) => groups[cat]?.length)
    .map((cat) => (
      <div key={cat} class={styles.sensorGroup}>
        {cat === 'Temperature' &&
          groups[cat]!.map((s) => (
            <TempBar key={s.name} name={s.name} value={s.value} max={s.max} />
          ))}
        {cat !== 'Temperature' && groups[cat]!.map((s) => <SensorRow key={s.name} sensor={s} />)}
      </div>
    ))
}

export const DeviceCard = memo(
  function DeviceCard({ device, gaugeSize = 90 }: DeviceCardProps) {
    const hue = device.color.hue
    const isGpu = device.type === 'GPU'
    const gpuGaugeSize = 70

    const hotspot = isGpu
      ? findSensor(device.sensors, 'Temperature', ['hot spot', 'hotspot', '热点'])
      : undefined
    const vramTemp = isGpu
      ? findSensor(device.sensors, 'Temperature', ['memory', '显存', 'vram'])
      : undefined
    const coreTemp = isGpu
      ? findSensor(device.sensors, 'Temperature', ['core', 'gpu'], ['hot spot', 'hotspot', 'memory', '显存', 'vram'])
      : undefined
    const vramLoad = isGpu
      ? findSensor(device.sensors, 'Load', ['memory', '显存', 'vram'], ['d3d', 'compute', 'core', 'bus', 'video engine', 'decoder', 'encoder', 'controller'])
      : undefined
    const coreClock = isGpu
      ? findSensor(device.sensors, 'Clock', ['core', 'gpu'], ['memory', '显存', 'vram', 'shader'])
      : undefined
    const packagePower = isGpu
      ? findSensor(device.sensors, 'Power', ['package', 'total', 'gpu'])
      : undefined

    const hasGpuGauges = isGpu && (hotspot || vramTemp || coreTemp || vramLoad || coreClock || packagePower)

    return (
      <div class={styles.card} style={{ '--card-hue': hue }}>
        <div class={styles.header}>
          <span class={styles.badge} style={{ background: `hsl(${hue}, 60%, 40%)` }}>
            {device.color.label}
          </span>
          <span class={styles.deviceName}>{device.name}</span>
        </div>
        <div class={styles.body}>
          {device.load !== undefined && device.load !== null && (
            hasGpuGauges ? (
              <div class={styles.gaugeRow}>
                {coreTemp && (
                  <GaugeRing value={coreTemp.value} label="核心温度" unit="°C" size={gpuGaugeSize} max={coreTemp.max} isTemp />
                )}
                {vramTemp && (
                  <GaugeRing value={vramTemp.value} label="显存温度" unit="°C" size={gpuGaugeSize} max={vramTemp.max} isTemp />
                )}
                <GaugeRing value={device.load} label="负载" unit="%" size={gpuGaugeSize} />
                {hotspot && (
                  <GaugeRing value={hotspot.value} label="热点温度" unit="°C" size={gpuGaugeSize} max={hotspot.max} isTemp />
                )}
                {coreClock && (
                  <GaugeRing value={coreClock.value} label="核心频率" unit="MHz" size={gpuGaugeSize} max={coreClock.max} />
                )}
                {vramLoad && (
                  <GaugeRing value={vramLoad.load_percent ?? vramLoad.value} label="显存占用" unit="%" size={gpuGaugeSize} />
                )}
                {packagePower && (
                  <GaugeRing value={packagePower.value} label="Package功耗" unit="W" size={gpuGaugeSize} max={packagePower.max} />
                )}
              </div>
            ) : (
              <div class={styles.gaugeWrap}>
                <GaugeRing value={device.load} label="Load" unit="%" size={gaugeSize} />
              </div>
            )
          )}
          {device.max_temp !== undefined && device.max_temp !== null && (
            <div class={styles.maxTemp}>
              <span class={styles.maxTempLabel}>最高温度</span>
              <span class={styles.maxTempValue} style={{ color: getTempColor(device.max_temp) }}>
                {device.max_temp.toFixed(1)}°C
              </span>
            </div>
          )}
          {renderSensors(device)}
        </div>
      </div>
    )
  },
  (prev, next) => {
    if (prev.device.name !== next.device.name) return false
    if (prev.device.load !== next.device.load) return false
    if (prev.device.max_temp !== next.device.max_temp) return false
    if (prev.device.sensors.length !== next.device.sensors.length) return false
    for (let i = 0; i < prev.device.sensors.length; i++) {
      const a = prev.device.sensors[i]
      const b = next.device.sensors[i]
      if (a.value !== b.value || a.name !== b.name || a.min !== b.min || a.max !== b.max) return false
    }
    return true
  }
)