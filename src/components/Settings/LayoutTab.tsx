import { memo } from '@/core/memo'
import type { AppSettings, ColumnMode, ParsedData } from '@/core/types'
import styles from '@/styles/components/Settings.module.css'

interface LayoutTabProps {
  settings: AppSettings
  data: ParsedData | null
  onUpdate: (partial: Partial<AppSettings>) => void
}

const COLUMN_MODES: { value: ColumnMode; label: string }[] = [
  { value: 'auto', label: '自动' },
  { value: '1', label: '1 列' },
  { value: '2', label: '2 列' },
  { value: '3', label: '3 列' },
  { value: '4', label: '4 列' },
]

const DPI_PRESETS: { value: number; label: string }[] = [
  { value: 80, label: '80%' },
  { value: 100, label: '100%' },
  { value: 120, label: '120%' },
  { value: 150, label: '150%' },
  { value: 200, label: '200%' },
]

const FONT_FAMILIES = ['Segoe UI Variable', 'Microsoft YaHei', 'PingFang SC', 'SF Pro Display', 'Consolas']

const TYPE_LABELS: Record<string, string> = {
  CPU: '🖥️',
  GPU: '🎮',
  Motherboard: '🔧',
  Memory: '💾',
  Storage: '💿',
}

export const LayoutTab = memo(function LayoutTab({ settings, data, onUpdate }: LayoutTabProps) {
  const toggleDevice = (name: string) => {
    const hidden = settings.hidden_devices ?? []
    const next = hidden.includes(name)
      ? hidden.filter((n) => n !== name)
      : [...hidden, name]
    onUpdate({ hidden_devices: next })
  }

  return (
    <div class={styles.tab}>
      <div class={styles.field}>
        <span>列数模式</span>
        <div class={styles.toggle}>
          {COLUMN_MODES.map((m) => (
            <button key={m.value} class={`${styles.toggleBtn} ${settings.column_mode === m.value ? styles.toggleActive : ''}`} onClick={() => onUpdate({ column_mode: m.value })}>{m.label}</button>
          ))}
        </div>
      </div>
      <div class={styles.field}>
        <span>界面缩放</span>
        <div class={styles.toggle}>
          {DPI_PRESETS.map((p) => (
            <button key={p.value} class={`${styles.toggleBtn} ${settings.dpi_scale === p.value ? styles.toggleActive : ''}`} onClick={() => onUpdate({ dpi_scale: p.value })}>{p.label}</button>
          ))}
        </div>
      </div>
      <label class={styles.field}>
        <span>字体大小 ({settings.font_size}px)</span>
        <input type="range" min="9" max="32" value={settings.font_size} onInput={(e) => onUpdate({ font_size: parseInt(e.currentTarget.value, 10) })} class={styles.range} />
      </label>
      <label class={styles.field}>
        <span>字体族</span>
        <select class={styles.select} value={settings.font_family.split(',')[0].trim().replace(/^"|"$/g, '')} onChange={(e) => { const val = e.currentTarget.value; onUpdate({ font_family: `${val}, Microsoft YaHei, PingFang SC, sans-serif` }) }}>
          {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>
      {data && data.devices.length > 0 && (
        <div class={styles.field}>
          <span>显示硬件模块</span>
          <div class={styles.checkList}>
            {data.devices.map((d) => {
              const hidden = (settings.hidden_devices ?? []).includes(d.name)
              return (
                <label key={d.name} class={`${styles.checkItem} ${hidden ? styles.checkHidden : ''}`}>
                  <input type="checkbox" checked={!hidden} onChange={() => toggleDevice(d.name)} class={styles.checkbox} />
                  <span class={styles.checkIcon}>{TYPE_LABELS[d.type] ?? '📦'}</span>
                  <span class={styles.checkLabel}>{d.name}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})
