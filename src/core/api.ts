import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { PollStatus, ParsedData, AppSettings, WindowBounds } from '@/core/types'

export async function connect(ip: string, port: number, interval: number): Promise<void> {
  await invoke('connect', { ip, port, intervalSecs: interval })
}

export async function disconnect(): Promise<void> {
  await invoke('disconnect')
}

export async function getData(): Promise<ParsedData | null> {
  return invoke('get_data')
}

export async function getStatus(): Promise<PollStatus> {
  return invoke('get_status')
}

export async function loadSettings(): Promise<AppSettings> {
  return invoke('load_settings')
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await invoke('save_settings', { settings })
}

export async function loadWindowBounds(): Promise<WindowBounds> {
  return invoke('load_window_bounds')
}

export async function saveWindowBounds(bounds: WindowBounds): Promise<void> {
  await invoke('save_window_bounds', { bounds })
}

export function onPollStatus(callback: (status: PollStatus) => void) {
  return listen<PollStatus>('poll-status', (event) => callback(event.payload))
}
