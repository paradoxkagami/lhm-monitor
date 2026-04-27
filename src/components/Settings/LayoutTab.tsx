import { memo } from '@/core/memo'
import { useCallback } from 'preact/hooks'
import type { AppSettings, ColumnMode } from '@/core/types'
import styles from '@/styles/components/Settings.module.css'

interface LayoutTabProps {
  settings: AppSettings
  onUpdate: (partial: Partial<AppSettings>) => void
}

const COLUMN_MODES: { value: ColumnMode; label: string }[] = [
  { value: 'auto', label: '自动' },
  { value: '1', label: '1 列' },
  { value: '2', label: '2 列' },
  { value: '3', label: '3 列' },
  { value: '4', label: '4 列' },
]

const FONT_FAMILIES = [
  'Segoe UI Variable',
  'Microsoft YaHei',
  'PingFang SC',
  'SF Pro Display',
  'Consolas',
]

export const LayoutTab = memo(function LayoutTab({
  settings,
  onUpdate,
}: LayoutTabProps) {
  const handleFontSizeKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        onUpdate({ fontSize: Math.min(settings.fontSize + 1, 32) })
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        onUpdate({ fontSize: Math.max(settings.fontSize - 1, 9) })
      }
    },
    [settings.fontSize, onUpdate]
  )

  return (
    <div class={styles.tab}>
      <div class={styles.field}>
        <span>列数模式</span>
        <div class={styles.toggle}>
          {COLUMN_MODES.map((m) => (
            <button
              key={m.value}
              class={`${styles.toggleBtn} ${
                settings.columnMode === m.value ? styles.toggleActive : ''
              }`}
              onClick={() => onUpdate({ columnMode: m.value })}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <label class={styles.field}>
        <span>字体大小 ({settings.fontSize}px)</span>
        <input
          type="range"
          min="9"
          max="32"
          value={settings.fontSize}
          onInput={(e) =>
            onUpdate({ fontSize: parseInt(e.currentTarget.value, 10) })
          }
          onKeyDown={handleFontSizeKeyDown}
          class={styles.range}
        />
      </label>

      <label class={styles.field}>
        <span>字体族</span>
        <select
          class={styles.select}
          value={settings.fontFamily.split(',')[0].replace(/"/g, '')}
          onChange={(e) => {
            const val = e.currentTarget.value
            onUpdate({
              fontFamily: `"${val}", "Microsoft YaHei", "PingFang SC", sans-serif`,
            })
          }}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>

      <label class={styles.field}>
        <span>DPI 缩放 ({settings.dpiScale}%)</span>
        <input
          type="range"
          min="50"
          max="300"
          step="10"
          value={settings.dpiScale}
          onInput={(e) =>
            onUpdate({ dpiScale: parseInt(e.currentTarget.value, 10) })
          }
          class={styles.range}
        />
      </label>
    </div>
  )
})
