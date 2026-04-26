const { app, BrowserWindow, ipcMain, screen, shell } = require('electron');
const path = require('path');

// 持久化存储（窗口位置、设置）
let store;
(async () => {
  const { default: Store } = await import('electron-store');
  store = new Store();
})();

let mainWindow;
let isAlwaysOnTop = false;

function getStore(key, def) {
  return store ? store.get(key, def) : def;
}
function setStore(key, val) {
  if (store) store.set(key, val);
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
    frame: false,               // 无系统标题栏
    transparent: true,          // 允许透明/亚克力
    hasShadow: true,
    resizable: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,       // 允许访问局域网 http
    },
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    // Windows 11 Mica 效果
    backgroundMaterial: 'mica',
  });

  // 尝试启用 Win11 Mica（Electron 28+）
  try {
    mainWindow.setBackgroundMaterial('mica');
  } catch (_) {}

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // 记忆窗口位置与尺寸
  mainWindow.on('moved', saveBounds);
  mainWindow.on('resized', saveBounds);

  // 开发模式显示 DevTools（可注释掉）
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

function saveBounds() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    setStore('windowBounds', mainWindow.getBounds());
  }
}

// ── IPC handlers ──────────────────────────────
ipcMain.on('win-close',    () => { saveBounds(); mainWindow.close(); });
ipcMain.on('win-minimize', () => mainWindow.minimize());
ipcMain.on('win-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});

ipcMain.on('win-toggle-top', (event) => {
  isAlwaysOnTop = !isAlwaysOnTop;
  mainWindow.setAlwaysOnTop(isAlwaysOnTop, 'floating');
  event.reply('top-state', isAlwaysOnTop);
});

// 拖动窗口
ipcMain.on('win-drag-start', () => {});

// 读/写持久化设置
ipcMain.handle('store-get', (_, key, def) => getStore(key, def));
ipcMain.on('store-set', (_, key, val) => setStore(key, val));

app.whenReady().then(() => {
  // 等待 store 初始化
  setTimeout(createWindow, 100);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
