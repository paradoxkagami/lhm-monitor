import { memo } from '@/core/memo'
import { useState } from 'preact/hooks'
import type { AppSettings, PollStatus, ParsedData } from '@/core/types'
import { BasicTab } from './BasicTab'
import { AppearanceTab } from './AppearanceTab'
import { LayoutTab } from './LayoutTab'
import { AboutTab } from './AboutTab'
import styles from '@/styles/components/Settings.module.css'

interface SettingsProps {
  open: boolean
  settings: AppSettings
  data: ParsedData | null
  status: PollStatus
  onUpdate: (partial: Partial<AppSettings>) => void
  onConnect: () => void
  onStop: () => void
  onClose: () => void
}

type Tab = 'basic' | 'appearance' | 'layout' | 'about'

const TABS: { key: Tab; label: string }[] = [
  { key: 'basic', label: '基础' },
  { key: 'appearance', label: '外观' },
  { key: 'layout', label: '布局' },
  { key: 'about', label: '关于' },
]

export const Settings = memo(function Settings({
  open, settings, data, status, onUpdate, onConnect, onStop, onClose,
}: SettingsProps) {
  const [tab, setTab] = useState<Tab>('basic')

  return (
    <div class={`${styles.drawer} ${open ? styles.open : ''}`}>
      <div class={styles.tabBar}>
        {TABS.map((t) => (
          <button key={t.key} class={`${styles.tabBtn} ${tab === t.key ? styles.tabActive : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
        <button class={styles.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div class={styles.body}>
        {tab === 'basic' && <BasicTab settings={settings} onUpdate={onUpdate} status={status} onConnect={onConnect} onStop={onStop} />}
        {tab === 'appearance' && <AppearanceTab settings={settings} onUpdate={onUpdate} />}
        {tab === 'layout' && <LayoutTab settings={settings} data={data} onUpdate={onUpdate} />}
        {tab === 'about' && <AboutTab />}
      </div>
    </div>
  )
})
