import type {
  LHMResponse,
  LHMNode,
  ParsedData,
  ParsedDevice,
  ParsedSensor,
  DeviceType,
  SensorCategory,
} from './types'

// ── 设备类型识别 ──────────────────────────────

const DEVICE_PATTERNS: [DeviceType, RegExp[]][] = [
  ['CPU', [/cpu/i, /processor/i, /intel/i, /amd/i, /ryzen/i]],
  ['GPU', [/gpu/i, /graphics/i, /nvidia/i, /radeon/i, /arc/i, /video/i]],
  ['Memory', [/memory/i, /ram/i, /dimm/i]],
  ['Storage', [/drive/i, /ssd/i, /hdd/i, /nvme/i, /sata/i, /disk/i, /storage/i]],
  ['Motherboard', [/motherboard/i, /mainboard/i, /board/i, /super i\/o/i, /nct/i]],
]

function identifyDeviceType(name: string): DeviceType {
  for (const [type, patterns] of DEVICE_PATTERNS) {
    for (const re of patterns) {
      if (re.test(name)) return type
    }
  }
  return 'Motherboard'
}

// ── 传感器分类 ────────────────────────────────

const SENSOR_CATEGORY_MAP: [SensorCategory, RegExp[]][] = [
  ['Load', [/load/i, /usage/i, /utilization/i, /total/i]],
  ['Temperature', [/temperature/i, /temp/i, /core/i, /hot\s?spot/i, /junction/i]],
  ['Power', [/power/i, /watt/i, /tdp/i]],
  ['Clock', [/clock/i, /frequency/i, /mhz/i, /ghz/i, /speed/i]],
  ['Fan', [/fan/i, /rpm/i, /pump/i]],
  ['Data', [/read/i, /write/i, /throughput/i, /data/i, /transfer/i, /bandwidth/i]],
  ['Voltage', [/voltage/i, /volt/i, /vcore/i, /vdd/i]],
]

function categorizeSensor(name: string): SensorCategory {
  for (const [cat, patterns] of SENSOR_CATEGORY_MAP) {
    for (const re of patterns) {
      if (re.test(name)) return cat
    }
  }
  return 'Data'
}

function deduceUnit(name: string, category: SensorCategory): string {
  switch (category) {
    case 'Temperature':
      return '°C'
    case 'Load':
      return '%'
    case 'Power':
      return 'W'
    case 'Clock':
      return name.includes('MHz') ? 'MHz' : 'GHz'
    case 'Fan':
      return 'RPM'
    case 'Voltage':
      return 'V'
    case 'Data':
      if (/read|write|throughput/i.test(name)) return 'GB/s'
      return ''
    default:
      return ''
  }
}

// ── 递归采集传感器 ────────────────────────────

function collectSensors(node: LHMNode, sensors: ParsedSensor[]): void {
  if (node.Value !== undefined && node.Value !== null) {
    const category = categorizeSensor(node.Text)
    const sensor: ParsedSensor = {
      name: node.Text,
      value: node.Value,
      min: node.Min ?? 0,
      max: node.Max ?? 0,
      category,
      unit: deduceUnit(node.Text, category),
    }

    if (category === 'Load') {
      // LHM 的 Load 值通常是 0-100 的百分比或 0-1 的小数
      if (sensor.max <= 1 && sensor.value <= 1) {
        sensor.loadPercent = sensor.value * 100
      } else {
        sensor.loadPercent = sensor.value
      }
    }

    sensors.push(sensor)
  }

  for (const child of node.Children) {
    collectSensors(child, sensors)
  }
}

// ── 主解析函数 ────────────────────────────────

export function parseLHMData(json: LHMResponse): ParsedData {
  const root = json.Children[0]
  if (!root) {
    return { pcName: 'Unknown', devices: [] }
  }

  const pcName = root.Text || 'Unknown PC'

  // 收集所有硬件设备节点
  const hardwareNodes = root.Children.filter(
    (n) => n.Children.length > 0
  )

  const devices: ParsedDevice[] = hardwareNodes.map((node) => {
    const deviceType = identifyDeviceType(node.Text)
    const sensors: ParsedSensor[] = []
    collectSensors(node, sensors)

    const loadSensor = sensors.find((s) => s.category === 'Load' && s.loadPercent !== undefined)
    const maxTemp = sensors
      .filter((s) => s.category === 'Temperature')
      .reduce((max, s) => Math.max(max, s.value), 0)

    return {
      type: deviceType,
      name: node.Text,
      sensors,
      color: DEVICE_COLORS[deviceType],
      load: loadSensor?.loadPercent,
      maxTemp: maxTemp || undefined,
    }
  })

  return { pcName, devices }
}

// ── 设备颜色映射 ──────────────────────────────

export const DEVICE_COLORS: Record<DeviceType, { hue: number; label: string }> = {
  CPU: { hue: 210, label: 'CPU' },
  GPU: { hue: 270, label: 'GPU' },
  Memory: { hue: 140, label: 'RAM' },
  Storage: { hue: 30, label: 'Disk' },
  Motherboard: { hue: 180, label: 'MB' },
}

export function getLoadColor(percent: number): string {
  if (percent >= 90) return '#f87171'
  if (percent >= 70) return '#fb923c'
  if (percent >= 50) return '#facc15'
  return '#4ade80'
}

export function getTempColor(temp: number): string {
  if (temp >= 85) return '#f87171'
  if (temp >= 70) return '#fb923c'
  if (temp >= 50) return '#facc15'
  return '#4ade80'
}
