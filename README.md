# LHM Monitor v2

> 局域网 LibreHardwareMonitor 硬件监控桌面小工具 —— Preact + TypeScript 重写版

## 功能特点

- 实时监控 CPU / GPU / 主板 / 内存 / 硬盘传感器数据
- Windows 11 Fluent Design 风格，深色 / 浅色 / 跟随系统主题
- 响应式布局，窗口大小自适应列数
- 丰富的自定义选项（主题、字体、列数、DPI 缩放）
- 系统置顶 + 系统托盘最小化
- 所有设置自动持久化
- 指数退避重连 + 超时控制
- 窗口隐藏时自动暂停轮询和动画，零 CPU 消耗

## 快速开始

### 前提条件

1. 在被监控的电脑上安装 [LibreHardwareMonitor](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor)
2. 启用远程 Web 服务器：选项 → 远程 Web 服务器 → 运行（默认端口 8085）

### 开发

```bash
git clone https://github.com/paradoxkagami/lhm-monitor.git
cd lhm-monitor
git checkout refactor/rewrite-v2
npm install
npm run dev
```

### 构建

```bash
npm run package
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `S` | 展开/收起设置面板 |
| `T` | 切换窗口置顶 |

## v2 技术栈

| 层 | 技术 |
|---|------|
| 运行时 | Electron 33+ |
| 语言 | TypeScript (strict) |
| UI 框架 | Preact 10 (memo 差异化渲染) |
| 构建工具 | Vite 6 + vite-plugin-electron |
| 样式 | CSS Modules + CSS Custom Properties |
| 持久化 | electron-store v10 |

## 架构

```
lhm-monitor/
├── electron/              # Electron 主进程
│   ├── main.ts            # 窗口管理、托盘、单实例锁
│   ├── preload.ts         # Context bridge 安全桥接
│   └── ipc/
│       └── channels.ts    # IPC 通道常量
├── src/                   # 渲染进程 (Preact)
│   ├── main.tsx           # 入口
│   ├── App.tsx            # 根组件
│   ├── components/        # UI 组件
│   │   ├── TitleBar.tsx
│   │   ├── Settings/      # 设置面板 (3 Tab)
│   │   ├── Dashboard/     # 仪表盘（memo 组件）
│   │   └── StatusBar.tsx
│   ├── hooks/             # 自定义 hooks
│   │   ├── usePolling.ts  # 串行轮询 + 退避
│   │   ├── useSettings.ts
│   │   ├── useTheme.ts
│   │   └── useResizeObserver.ts
│   ├── core/              # 核心逻辑
│   │   ├── parser.ts      # LHM JSON 解析器
│   │   ├── connection.ts  # HTTP 客户端
│   │   └── types.ts       # TypeScript 类型
│   └── styles/            # CSS Modules
├── assets/icon.ico
├── package.json
├── vite.config.ts
├── tsconfig.json
└── electron-builder.yml
```

## License

MIT
