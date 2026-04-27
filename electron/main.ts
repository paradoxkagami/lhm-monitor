import { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { IPC } from './ipc/channels'

// ── electron-store（v10 支持 CJS，同步可用）───
let Store: any
try {
  Store = require('electron-store')
} catch {
  // 兼容 ESM 场景
}

let store: any

function initStore() {
  if (!store && Store) {
    store = new Store({ name: 'lhm-settings' })
  }
}

function getStore<T>(key: string, def: T): T {
  return store ? (store.get(key) ?? def) : def
}
function setStore(key: string, val: unknown) {
  if (store) store.set(key, val)
}

// ── 窗口状态 ──────────────────────────────────
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isAlwaysOnTop = false
let windowHidden = false

// ── 系统托盘 ──────────────────────────────────
function createTray() {
  const iconPath = join(__dirname, '../assets/icon.ico')
  let trayIcon = nativeImage.createFromPath(iconPath)
  if (trayIcon.isEmpty()) trayIcon = nativeImage.createEmpty()

  tray = new Tray(trayIcon)
  tray.setToolTip('LHM Monitor')

  const ctx = Menu.buildFromTemplate([
    { label: '显示监控窗口', click: () => showWindow() },
    { label: '隐藏监控窗口', click: () => hideWindow() },
    { type: 'separator' },
    {
      label: '退出程序',
      click: () => {
        if (mainWindow) {
          setStore('windowBounds', mainWindow.getBounds())
          mainWindow.destroy()
        }
        app.quit()
      },
    },
  ])

  tray.setContextMenu(ctx)

  tray.on('double-click', () => {
    if (windowHidden) showWindow()
    else {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })
}

// ── 窗口显隐 ──────────────────────────────────
function showWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.show()
  mainWindow.setSkipTaskbar(false)
  windowHidden = false
  mainWindow.webContents.send(IPC.WINDOW_VISIBILITY, true)
}

function hideWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.hide()
  mainWindow.setSkipTaskbar(true)
  windowHidden = true
  mainWindow.webContents.send(IPC.WINDOW_VISIBILITY, false)
}

// ── 保存窗口位置 ──────────────────────────────
function saveBounds() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    setStore('windowBounds', mainWindow.getBounds())
  }
}

// ── 创建窗口 ──────────────────────────────────
function createWindow() {
  initStore()

  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const savedBounds = getStore('windowBounds', {
    width: 420,
    height: 660,
    x: sw - 440,
    y: 30,
  })

  mainWindow = new BrowserWindow({
    width: savedBounds.width,
    height: savedBounds.height,
    x: savedBounds.x,
    y: savedBounds.y,
    minWidth: 300,
    minHeight: 200,
    frame: false,
    transparent: false,
    hasShadow: true,
    resizable: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    backgroundMaterial: 'none',
    icon: join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // LAN HTTP 必须
    },
    show: false,
  })

  // Win11 下确保无背景材质
  try {
    mainWindow.setBackgroundMaterial('none')
  } catch { /* 非 Win11 忽略 */ }

  // ready-to-show 后再显示，避免白屏闪烁
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('moved', saveBounds)
  mainWindow.on('resized', saveBounds)

  mainWindow.on('close', (e) => {
    if (!(app as any).isQuitting) {
      e.preventDefault()
      hideWindow()
    }
  })

  createTray()
}

// ── IPC 注册 ──────────────────────────────────
function registerIPC() {
  ipcMain.on(IPC.WIN_CLOSE, () => {
    if (mainWindow && !mainWindow.isDestroyed()) hideWindow()
  })

  ipcMain.on(IPC.WIN_MINIMIZE, () => {
    mainWindow?.minimize()
  })

  ipcMain.on(IPC.WIN_MAXIMIZE, () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })

  ipcMain.on(IPC.WIN_HIDE, () => hideWindow())
  ipcMain.on(IPC.WIN_SHOW, () => showWindow())

  ipcMain.on(IPC.WIN_TOGGLE_TOP, (event) => {
    isAlwaysOnTop = !isAlwaysOnTop
    mainWindow?.setAlwaysOnTop(isAlwaysOnTop, 'floating')
    event.reply(IPC.TOP_STATE, isAlwaysOnTop)
  })

  ipcMain.handle(IPC.STORE_GET, (_, key: string, def: unknown) => {
    return getStore(key, def)
  })

  ipcMain.on(IPC.STORE_SET, (_, key: string, val: unknown) => {
    setStore(key, val)
  })
}

// ── 应用生命周期 ──────────────────────────────
app.on('before-quit', () => {
  (app as any).isQuitting = true
})

app.on('window-all-closed', () => {
  // Windows: 不退出，留给托盘
})

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const waitForWindow = () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        if (!mainWindow.isVisible()) mainWindow.show()
        mainWindow.focus()
      } else {
        setTimeout(waitForWindow, 50)
      }
    }
    waitForWindow()
  })
}

app.whenReady().then(() => {
  registerIPC()
  createWindow()
})
