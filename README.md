# LHM Monitor v3

> 局域网 LibreHardwareMonitor 硬件监控桌面工具 —— Tauri 2 + Preact 重写版

## 功能特点

- 实时监控 CPU / GPU / 主板 / 硬盘传感器数据
- Rust 后端处理数据轮询和解析，极低资源占用
- 正确利用 LHM 树结构分类传感器（Temperature/Clock/Voltage 等）
- 自动过滤网络适配器子条目，只显示真实硬件设备
- 安装包仅 2.5MB（NSIS）/ 3.9MB（MSI）
- 暗色 / 浅色 / 跟随系统主题
- 响应式布局，窗口大小自适应列数
- 系统置顶 + 系统托盘最小化
- 所有设置自动持久化
- 指数退避重连 + 超时控制
- 窗口隐藏时自动暂停轮询，零 CPU 消耗

## 快速开始

### 前提条件

1. 在被监控的电脑上安装 [LibreHardwareMonitor](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor)
2. 启用远程 Web 服务器：选项 → 远程 Web 服务器 → 运行（默认端口 8085）

### 开发

```bash
git clone https://github.com/paradoxkagami/lhm-monitor.git
cd lhm-monitor
npm install
cd src-tauri && cargo build && cd ..
npm run tauri dev
```

### 构建

```bash
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`。

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `S` | 展开/收起设置面板 |
| `T` | 切换窗口置顶 |

## 技术栈

| 层 | 技术 |
|---|------|
| 桌面框架 | Tauri 2 |
| 后端 | Rust (reqwest + tokio + serde) |
| 语言 | TypeScript (strict) |
| UI 框架 | Preact 10 (memo 差异化渲染) |
| 构建工具 | Vite 6 + @tauri-apps/cli |
| 样式 | CSS Modules + CSS Custom Properties |
| 持久化 | Rust JSON 文件读写 |

## 架构

```
lhm-monitor/
├── src/                       # 前端 (Preact)
│   ├── main.tsx               # 入口
│   ├── App.tsx                # 根组件
│   ├── components/
│   │   ├── TitleBar.tsx       # 标题栏（菜单按钮 + 窗口控制）
│   │   ├── Settings/          # 设置面板 (3 Tab)
│   │   ├── Dashboard/         # 仪表盘（memo 组件）
│   │   └── StatusBar.tsx      # 底部状态栏
│   ├── hooks/                 # 自定义 hooks
│   ├── core/                  # 核心逻辑
│   │   ├── api.ts             # Tauri invoke 封装
│   │   ├── memo.ts            # 自定义 memo
│   │   └── types.ts           # TypeScript 类型
│   └── styles/                # CSS Modules
├── src-tauri/                 # Rust 后端
│   ├── src/
│   │   ├── main.rs            # 入口
│   │   ├── lib.rs             # Tauri 命令 + 窗口管理
│   │   ├── lhm.rs             # LHM JSON 解析器
│   │   ├── poller.rs          # 轮询器（串行 + 退避）
│   │   └── store.rs           # 设置持久化
│   ├── Cargo.toml
│   └── tauri.conf.json
├── legacy/                    # 旧版归档
│   └── v2-electron-preact/    # v2 Electron 版本
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 版本历史

| 版本 | 框架 | 安装包大小 | 说明 |
|------|------|-----------|------|
| v3 | Tauri 2 + Rust | ~2.5MB | 当前版本，Rust 后端 |
| v2 | Electron + Preact | ~80MB | 首次 Preact 重写 |
| v1 | Electron + Vanilla JS | ~80MB | 初始版本 |

## License

MIT
