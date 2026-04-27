import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from './ipc/channels'

const electronAPI = {
  close: () => ipcRenderer.send(IPC.WIN_CLOSE),
  minimize: () => ipcRenderer.send(IPC.WIN_MINIMIZE),
  maximize: () => ipcRenderer.send(IPC.WIN_MAXIMIZE),
  toggleTop: () => ipcRenderer.send(IPC.WIN_TOGGLE_TOP),
  hide: () => ipcRenderer.send(IPC.WIN_HIDE),
  show: () => ipcRenderer.send(IPC.WIN_SHOW),

  onWindowVisibility: (cb: (visible: boolean) => void): (() => void) => {
    const handler = (_: unknown, visible: boolean) => cb(visible)
    ipcRenderer.on(IPC.WINDOW_VISIBILITY, handler)
    return () => ipcRenderer.removeListener(IPC.WINDOW_VISIBILITY, handler)
  },

  onTopState: (cb: (pinned: boolean) => void): (() => void) => {
    const handler = (_: unknown, pinned: boolean) => cb(pinned)
    ipcRenderer.on(IPC.TOP_STATE, handler)
    return () => ipcRenderer.removeListener(IPC.TOP_STATE, handler)
  },

  storeGet: (key: string, def?: unknown) => ipcRenderer.invoke(IPC.STORE_GET, key, def),
  storeSet: (key: string, val: unknown) => ipcRenderer.send(IPC.STORE_SET, key, val),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
