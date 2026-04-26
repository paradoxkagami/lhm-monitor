# LHM Monitor

> 局域网 LibreHardwareMonitor 硬件监控桌面小工具

## 功能特点

- 🔄 实时监控 CPU / GPU / 主板 / 内存 / 硬盘传感器数据
- 🎨 Windows 11 Fluent Design 风格，Mica 半透明效果
- 📐 响应式布局，窗口大小自适应列数
- 🎛️ 丰富的自定义选项（主题、透明度、字体、列数、DPI 缩放）
- 📌 真正的系统置顶
- 💾 所有设置自动保存，断点续连

## 快速开始

### 前提条件

1. 在被监控的电脑上安装 [LibreHardwareMonitor](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor)
2. 启用远程 Web 服务器：`选项 → 远程 Web 服务器 → 运行`（默认端口 8085）

### 安装

#### 方式一：直接运行（推荐）

1. 下载最新发行版 [LHM-Monitor-x.x.x-win64.zip](https://github.com/paradoxkagami/lhm-monitor/releases)
2. 解压到任意目录
3. 双击 `LHM Monitor.exe` 运行

#### 方式二：从源码构建

```bash
git clone https://github.com/paradoxkagami/lhm-monitor.git
cd lhm-monitor
npm install
npm run build
```

构建完成后，运行免安装版：
```
dist/win-unpacked/LHM Monitor.exe
```

或打包为单文件：
```bash
npm run build:portable
```

## 使用说明

### 首次使用

1. 启动程序
2. 点击标题栏的 ⚙️ 按钮展开设置
3. 输入被监控电脑的局域网 IP 和端口（默认 8085）
4. 点击 **连接**

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `S` | 展开/收起设置面板 |
| `T` | 切换窗口置顶 |
| `Enter` | IP 输入框内回车 = 连接 |

### 设置面板

- **🔗 基础**：连接地址（IP / 端口）、刷新频率
- **🎨 外观**：主题（深色 / 浅色 / 跟随系统）、透明度、背景模糊、背景色
- **📐 布局**：列数模式（自动 / 1~4 列固定）、字体大小、字体族、DPI 缩放

## 技术栈

- Electron 29+
- Windows 11 Mica / Acrylic 窗口材质
- 纯 HTML + CSS + Vanilla JS（零运行时依赖）

## 项目结构

```
lhm-monitor/
├── main.js          # Electron 主进程（窗口管理、IPC）
├── preload.js       # 预加载脚本（安全桥接 API）
├── src/
│   └── index.html   # 完整 UI（HTML + CSS + JS）
├── assets/
│   └── icon.ico     # 应用图标
├── package.json
└── README.md
```

## License

MIT
