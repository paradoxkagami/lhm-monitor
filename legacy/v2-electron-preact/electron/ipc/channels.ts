// 共享 IPC 通道常量——主进程和 preload 共用，确保类型一致

export const IPC = {
  WIN_CLOSE: 'win-close',
  WIN_MINIMIZE: 'win-minimize',
  WIN_MAXIMIZE: 'win-maximize',
  WIN_HIDE: 'win-hide',
  WIN_SHOW: 'win-show',
  WIN_TOGGLE_TOP: 'win-toggle-top',
  STORE_GET: 'store-get',
  STORE_SET: 'store-set',
  WINDOW_VISIBILITY: 'window-visibility',
  TOP_STATE: 'top-state',
} as const
