export type SensorCategory =
  | 'Load'
  | 'Temperature'
  | 'Power'
  | 'Clock'
  | 'Fan'
  | 'Data'
  | 'Voltage'

export interface ParsedSensor {
  name: string
  value: number
  min: number
  max: number
  category: SensorCategory
  unit: string
  load_percent?: number
}

export type DeviceType = 'CPU' | 'GPU' | 'Motherboard' | 'Memory' | 'Storage'

export interface DeviceColor {
  hue: number
  label: string
}

export interface ParsedDevice {
  type: DeviceType
  name: string
  sensors: ParsedSensor[]
  color: DeviceColor
  load?: number
  max_temp?: number
}

export interface ParsedData {
  pc_name: string
  devices: ParsedDevice[]
}

export type ThemeMode = 'dark' | 'light' | 'auto'
export type ColumnMode = 'auto' | '1' | '2' | '3' | '4'

export interface AppSettings {
  ip: string
  port: number
  interval: number
  theme: ThemeMode
  font_family: string
  font_size: number
  dpi_scale: number
  column_mode: ColumnMode
  hidden_devices: string[]
}

export interface WindowBounds {
  width: number
  height: number
  x: number
  y: number
}

export type PollStatus =
  | { type: 'idle' }
  | { type: 'connecting' }
  | { type: 'polling'; latency_ms: number; last_update: number | null; retry_count: number }
  | { type: 'error'; message: string; retry_count: number }

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
