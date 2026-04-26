const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  close:      ()      => ipcRenderer.send('win-close'),
  minimize:   ()      => ipcRenderer.send('win-minimize'),
  maximize:   ()      => ipcRenderer.send('win-maximize'),
  toggleTop:  ()      => ipcRenderer.send('win-toggle-top'),
  onTopState: (cb)    => ipcRenderer.on('top-state', (_, v) => cb(v)),

  // 持久化
  storeGet: (key, def) => ipcRenderer.invoke('store-get', key, def),
  storeSet: (key, val) => ipcRenderer.send('store-set', key, val),
});
