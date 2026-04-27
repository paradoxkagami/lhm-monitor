// ── LHM /data.json 数据结构 ──────────────────

export interface LHMSensor {
  Text: string
  Value: number
  Min: number
  Max: number
}

export interface LHMNode {
  Text: string
  Children: LHMNode[]
  // 叶节点上的传感器属性
  Value?: number
  Min?: number
  Max?: number
}

export interface LHMResponse {
  Children: LHMNode[]
}

// ── 内部数据结构 ──────────────────────────────

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
  /** 负载百分比 0-100（仅 Load 类计算） */
  loadPercent?: number
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
  load?: number // 0-100
  maxTemp?: number
}

export interface ParsedData {
  pcName: string
  devices: ParsedDevice[]
}

// ── 设置 ──────────────────────────────────────

export type ThemeMode = 'dark' | 'light' | 'auto'
export type ColumnMode = 'auto' | '1' | '2' | '3' | '4'

export interface AppSettings {
  ip: string
  port: number
  interval: number
  theme: ThemeMode
  fontFamily: string
  fontSize: number
  dpiScale: number
  columnMode: ColumnMode
}

export const DEFAULT_SETTINGS: AppSettings = {
  ip: '',
  port: 8085,
  interval: 3,
  theme: 'dark',
  fontFamily: 'Segoe UI Variable, "Microsoft YaHei", "PingFang SC", sans-serif',
  fontSize: 13,
  dpiScale: 100,
  columnMode: 'auto',
}

export interface WindowBounds {
  width: number
  height: number
  x: number
  y: number
}

// ── IPC 通道 ──────────────────────────────────

export const IPC = {
  WIN_CLOSE: 'win-close',
  WIN_MINIMIZE: 'win-minimize',
  WIN_MAXIMIZE: 'win-maximize',
  WIN_HIDE: 'win-hide',
  WIN_SHOW: 'win-show',
  WIN_TOGGLE_TOP: 'win-toggle-top',
  STORE_GET: 'store-get',
  STORE_SET: 'store-set',
  WINDOW_VISIBILITY: 'window-visibility',
  TOP_STATE: 'top-state',
} as const

// ── electronAPI 接口（preload 暴露）───────────

export interface ElectronAPI {
  close: () => void
  minimize: () => void
  maximize: () => void
  toggleTop: () => void
  hide: () => void
  show: () => void
  onWindowVisibility: (cb: (visible: boolean) => void) => () => void
  onTopState: (cb: (pinned: boolean) => void) => () => void
  storeGet: (key: string, def?: unknown) => Promise<unknown>
  storeSet: (key: string, val: unknown) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
