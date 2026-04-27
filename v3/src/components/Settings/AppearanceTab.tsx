import { memo } from '@/core/memo'
import type { AppSettings, ThemeMode } from '@/core/types'
import styles from '@/styles/components/Settings.module.css'

interface AppearanceTabProps {
  settings: AppSettings
  onUpdate: (partial: Partial<AppSettings>) => void
}

const THEMES: { value: ThemeMode; label: string }[] = [
  { value: 'dark', label: '深色' },
  { value: 'light', label: '浅色' },
  { value: 'auto', label: '跟随系统' },
]

export const AppearanceTab = memo(function AppearanceTab({ settings, onUpdate }: AppearanceTabProps) {
  return (
    <div class={styles.tab}>
      <div class={styles.field}>
        <span>主题</span>
        <div class={styles.themeToggle}>
          {THEMES.map((t) => (
            <button key={t.value} class={`${styles.themeBtn} ${settings.theme === t.value ? styles.themeActive : ''}`} onClick={() => onUpdate({ theme: t.value })}>{t.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
})
