const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let store;
(async () => {
  const { default: Store } = await import('electron-store');
  store = new Store();
})();

let mainWindow;
let tray = null;
let isAlwaysOnTop = false;
let windowHidden = false; // 监控窗口是否被用户隐藏

function getStore(key, def) {
  return store ? store.get(key, def) : def;
}
function setStore(key, val) {
  if (store) store.set(key, val);
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) trayIcon = nativeImage.createEmpty();
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('LHM Monitor');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示监控窗口',
      click: () => showWindow(),
    },
    {
      label: '隐藏监控窗口',
      click: () => hideWindow(),
    },
    { type: 'separator' },
    {
      label: '退出程序',
      click: () => {
        if (mainWindow) {
          setStore('windowBounds', mainWindow.getBounds());
          mainWindow.destroy();
        }
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (windowHidden) showWindow();
    else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function showWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.show();
  mainWindow.setSkipTaskbar(false);
  windowHidden = false;
  mainWindow.webContents.send('window-visibility', true);
}

function hideWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.hide();
  mainWindow.setSkipTaskbar(true);
  windowHidden = true;
  mainWindow.webContents.send('window-visibility', false);
}

function createWindow() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  const savedBounds = getStore('windowBounds', {
    width: 420,
    height: 660,
    x: sw - 440,
    y: 30,
  });

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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    backgroundMaterial: 'none',
  });

  try {
    mainWindow.setBackgroundMaterial('none');
  } catch (_) {}

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.on('moved', saveBounds);
  mainWindow.on('resized', saveBounds);

  // 关闭按钮改为隐藏到托盘
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      hideWindow();
    }
  });

  createTray();
}

// 主动暴露 hide/show 到渲染进程
let hideFn = hideWindow;
let showFn = showWindow;

function saveBounds() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    setStore('windowBounds', mainWindow.getBounds());
  }
}

// ── IPC handlers ──────────────────────────────
ipcMain.on('win-close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    hideWindow();
  }
});

ipcMain.on('win-minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});

ipcMain.on('win-maximize', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});

ipcMain.on('win-hide', () => hideWindow());
ipcMain.on('win-show', () => showWindow());

ipcMain.on('win-toggle-top', (event) => {
  isAlwaysOnTop = !isAlwaysOnTop;
  mainWindow.setAlwaysOnTop(isAlwaysOnTop, 'floating');
  event.reply('top-state', isAlwaysOnTop);
});

ipcMain.handle('store-get', (_, key, def) => getStore(key, def));
ipcMain.on('store-set', (_, key, val) => setStore(key, val));

// 阻止 macOS 默认 quit（Electron 窗口全部关闭时的行为）
app.on('before-quit', () => { app.isQuitting = true; });

app.on('window-all-closed', () => {
  // Windows 下不quit，留给托盘
});

// ── 单实例锁：只允许运行一个窗口 ─────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // 窗口未创建时先等待，创建完立即聚焦
    const waitForWindow = () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        if (!mainWindow.isVisible()) mainWindow.show();
        mainWindow.focus();
      } else {
        setTimeout(waitForWindow, 50);
      }
    };
    waitForWindow();
  });
}
// ───────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow(); // 去掉 setTimeout 延迟，消除竞态
});
