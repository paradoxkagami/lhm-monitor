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
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 版本历史

### v3.2.0

**性能优化**
- `std::sync::Mutex` → `tokio::sync::Mutex`：消除 async 上下文中的线程阻塞
- `std::fs` → `tokio::fs`：所有文件 I/O 改为非阻塞异步操作
- 500ms `has_update()` 轮询 → `tokio::sync::Notify` 事件驱动：空闲时零 CPU 消耗
- 前端 `setInterval` 数据拉取 → `poll-status` 事件驱动：消除冗余轮询
- 窗口位置保存：5 秒定时器 → `onResized`/`onMoved` 事件 + 2 秒防抖
- 动态 `import()` → 静态 import：零延迟 API 调用

**GPU 仪表盘重构**
- GPU 设备卡片从单个负载仪表环扩展为 7 项仪表环横排布局
- 新增：核心温度、显存温度、热点温度、核心频率、显存占用、Package 功耗
- `GaugeRing` 组件扩展 `max`/`isTemp` 属性，支持温度和功耗的非百分比弧度填充
- `flex-wrap` 响应式换行，窄屏自动分行排列

**代码质量**
- `TempBar`：移除 `(value / 100) * 100` 无效计算
- CSS：提取重复 `@keyframes pulse` 到 `global.css`，消除 2 处重复定义
- `memo.ts`：`Record<string, any>` → 泛型 `Comparer<P>`，移除 `as any` 类型断言
- `unlisten.then(fn => fn())` → `unlisten.then((fn) => fn())`：消除参数名歧义
- 移除未使用的 `getStatus()` API 导出
- `SensorCategory`/`DeviceType`/`DeviceColor` 改为内部类型（去掉 `export`）
- Rust `LHMNode` 移除多余的 `Serialize` 派生

**项目清理**
- 删除 `legacy/v2-electron-preact/`（Electron v2 旧版代码）
- 删除 `v3/`（空壳目录）
- 删除 `refactor-design/ARCHITECTURE.md`（已过时的设计文档）

---

| 版本 | 框架 | 安装包大小 | 说明 |
|------|------|-----------|------|
| v3.2 | Tauri 2 + Rust | ~3.9MB | 性能优化 + GPU 仪表盘重构 |
| v3 | Tauri 2 + Rust | ~2.5MB | 当前版本，Rust 后端 |
| v2 | Electron + Preact | ~80MB | 首次 Preact 重写 |
| v1 | Electron + Vanilla JS | ~80MB | 初始版本 |

## License

MIT
