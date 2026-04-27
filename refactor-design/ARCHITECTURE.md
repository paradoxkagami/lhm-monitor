# LHM Monitor v2 重构架构设计

## 一、现状诊断：CPU/资源问题根因分析

| # | 问题 | 严重度 | 解释 |
|---|------|--------|------|
| 1 | **innerHTML 全量 DOM 重建** | 🔴 严重 | 每个轮询周期（默认3秒）用 `innerHTML` 销毁+重建所有DOM节点，触发完整 Layout→Paint→Composite 管线。即使数据未变化也全量渲染。 |
| 2 | **单文件 49KB 巨无霸** | 🔴 严重 | `index.html` 1154行，HTML/CSS/JS 全混在一个文件，零模块化，无法局部优化。 |
| 3 | **持续 CSS 动画** | 🟡 中等 | 在线状态脉冲动画 (`@keyframes pulse`) 和进度条过渡持续触发 composite，即使窗口不可见 |
| 4 | **ResizeObserver 无节流** | 🟡 中等 | 窗口调整时每个像素变化都触发列数重算和全量重排 |
| 5 | **electron-store 竞态** | 🟡 中等 | ESM动态`import()` 是异步的，`createWindow()` 同步执行时 store 可能为 null，导致窗口位置读不到，首次启动丢失记忆位置 |
| 6 | **GC 压力** | 🟡 中等 | 频繁创建/销毁大量 DOM 节点 + AbortController + 闭包，触发 V8 GC |
| 7 | **webSecurity: false** | 🟡 中等 | 为了 LAN HTTP 轮询关闭了 CORS，但同时禁用了所有 web security 检查 |
| 8 | **Google Fonts @import 阻塞** | 🟢 轻微 | `<style>` 内的 `@import` 阻塞 CSSOM 构建；但其实 Segoe UI Variable 是 Win11 系统字体，该 import 实际是空操作 |
| 9 | **孤立 CSS 变量** | 🟢 轻微 | `--surf-blur` 定义未使用（Mica 效果移除后的残留） |
| 10 | **listener 累积** | 🟢 已修复 | `matchMedia` listener 已在 commit af8912b 修复 |

### 已知已修复的历史 CPU 问题（git 历史）
- `33978b4`: 移除 Mica/Acrylic 特效 → 消除 GPU 合成层开销
- `af8912b`: `setInterval` → 串行 `setTimeout` 轮询 → 消除请求堆积
- `6574467`: 添加 AbortController 5s 超时 + 指数退避 → 防止挂起和快速重试

---

## 二、v2 技术栈选型

| 层 | v1 (当前) | v2 (重构) | 理由 |
|---|-----------|-----------|------|
| 运行时 | Electron 29 | Electron 33+ | 最新稳定版，V8/Chromium 性能提升 |
| 语言 | JavaScript (ES6) | TypeScript (strict) | 类型安全，编译期拦截错误 |
| 构建 | 无 (直接 `electron .`) | Vite + electron-vite | HMR 热更新，tree-shaking，代码分割 |
| UI 框架 | 无 (Vanilla JS + innerHTML) | Preact 10 | 3KB 体积，React 兼容 API，memo 差异化更新 |
| CSS | 裸 CSS (内联 `<style>`) | CSS Modules + CSS Custom Properties | 作用域隔离，主题变量 |
| 状态管理 | 全局变量 + localStorage | Preact Context + useReducer | 单向数据流，可测试 |
| 持久化 | electron-store v8 (ESM) | electron-store v10 (CJS) | 消除竞态条件 |
| 打包 | electron-builder | electron-builder | 保持不变，成熟稳定 |

### 为什么是 Preact 而不是 React/Vue/Svelte/Solid？

- **React**: 40KB+ gzip，对于这个只有仪表盘和设置面板的小工具来说是杀鸡用牛刀
- **Vue**: 同样 30KB+，且响应式系统对这个 polling 场景过度设计
- **Svelte**: 优秀但需要专门的编译器生态，和 Vite 集成有额外复杂度
- **Solid**: 同样优秀，但生态较小
- **Preact**: 3KB，React API 兼容，`memo` + `shouldComponentUpdate` 天然支持按需渲染，完美匹配仪表盘场景（数据不变化时零 DOM 操作）

---

## 三、v2 目录结构

```
lhm-monitor/
├── electron/                    # Electron 主进程
│   ├── main.ts                  # 入口：窗口创建、托盘、单实例
│   ├── preload.ts               # Context bridge：安全暴露 API
│   └── ipc/
│       ├── channels.ts          # IPC 通道常量（主进程+渲染进程共享）
│       └── store.ts             # electron-store 封装
│
├── src/                         # 渲染进程
│   ├── main.tsx                 # Preact 入口，挂载根组件
│   ├── App.tsx                  # 根组件：布局 + 路由状态
│   │
│   ├── components/
│   │   ├── TitleBar.tsx         # 自定义标题栏（拖拽区 + 窗口控制）
│   │   ├── Settings/
│   │   │   ├── index.tsx        # 设置抽屉容器（三Tab）
│   │   │   ├── BasicTab.tsx     # 连接配置：IP/端口/刷新间隔
│   │   │   ├── AppearanceTab.tsx# 主题：深色/浅色/跟随系统
│   │   │   └── LayoutTab.tsx    # 布局：列数/字体/DPI
│   │   ├── Dashboard/
│   │   │   ├── index.tsx        # 仪表盘容器 + 列布局
│   │   │   ├── DeviceCard.tsx   # 单个设备卡片（memo）
│   │   │   ├── GaugeRing.tsx    # SVG 环形仪表（memo，仅值变时更新）
│   │   │   ├── TempBar.tsx      # 温度条（memo）
│   │   │   └── SensorRow.tsx    # 传感器数据行（memo）
│   │   └── StatusBar.tsx        # 底部状态栏
│   │
│   ├── hooks/
│   │   ├── usePolling.ts        # 串行轮询 hook（AbortController + 指数退避）
│   │   ├── useSettings.ts       # 设置读写 hook
│   │   ├── useTheme.ts          # 主题切换 hook
│   │   └── useResizeObserver.ts # 节流版 ResizeObserver hook
│   │
│   ├── core/
│   │   ├── parser.ts            # LHM /data.json 解析器（纯函数）
│   │   ├── connection.ts        # HTTP 客户端封装
│   │   └── types.ts             # 全部 TypeScript 类型定义
│   │
│   └── styles/
│       ├── global.css           # 全局样式 + reset
│       ├── variables.css        # CSS 自定义属性（主题色板）
│       └── components/          # 组件级 CSS Modules
│           ├── TitleBar.module.css
│           ├── Settings.module.css
│           ├── Dashboard.module.css
│           ├── Gauge.module.css
│           └── StatusBar.module.css
│
├── assets/
│   └── icon.ico                 # 应用图标（保持不变）
│
├── package.json
├── tsconfig.json
├── tsconfig.node.json           # Node 端 TS 配置
├── vite.config.ts
├── electron-builder.yml         # 替换 electron-builder JSON config
└── README.md
```

---

## 四、核心渲染优化策略

### 4.1 组件 Memo 化（解决 innerHTML 全量重建）

```typescript
// 每个 DeviceCard 只在 props 变化时重新渲染
const DeviceCard = memo(({ device }: DeviceCardProps) => {
  // ...
}, (prev, next) => {
  // 自定义比较：只比较传感器值，忽略时间戳等无关字段
  return shallowEqual(prev.device.sensors, next.device.sensors);
});

// GaugeRing：只比较负载值
const GaugeRing = memo(({ value, max, label }: GaugeProps) => {
  // ...
}, (prev, next) => {
  return prev.value === next.value && prev.max === next.max;
});
```

**效果**: 如果 CPU 负载从 45% 变为 45%，GaugeRing 组件完全不重新渲染，DOM 零操作。

### 4.2 CSS Containment（限制重绘范围）

```css
.device-card {
  contain: layout style paint; /* 卡片内部重绘不波及外部 */
}
```

### 4.3 轮询优化（已有 + 增强）

```typescript
function usePolling(url: string, interval: number) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef<AbortController>();

  useEffect(() => {
    let retryCount = 0;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          // 增加缓存控制
          headers: { 'Cache-Control': 'no-cache' }
        });
        const json = await res.json();
        setData(json);
        setError(null);
        retryCount = 0;
      } catch (e) {
        if (e.name === 'AbortError') return;
        setError(e);
        retryCount++;
      }

      // 指数退避: 3s → 6s → 12s → 24s → 48s → 60s(max)
      const backoff = Math.min(interval * Math.pow(2, Math.max(0, retryCount - 1)), 60000);
      timer = setTimeout(poll, retryCount === 0 ? interval : backoff);
    };

    poll();
    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [url, interval]);

  return { data, error };
}
```

### 4.4 ResizeObserver 节流

```typescript
function useResizeObserver(ref: RefObject<HTMLElement>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let rafId: number;
    const observer = new ResizeObserver((entries) => {
      // 用 rAF 合并同一帧内的多次回调
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const { width, height } = entries[0].contentRect;
        setSize({ width, height });
      });
    });

    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, []);

  return size;
}
```

### 4.5 窗口不可见时暂停渲染

```typescript
// 主进程通知渲染进程窗口可见性
// preload 暴露 onWindowVisibility 事件
// App.tsx 接收到 hidden 时，暂停轮询并停止 CSS 动画

useEffect(() => {
  const unsub = window.electronAPI.onWindowVisibility((visible) => {
    if (!visible) {
      pausePolling();       // 暂停 HTTP 轮询
      document.body.classList.add('window-hidden'); // 全局暂停动画
    } else {
      resumePolling();
      document.body.classList.remove('window-hidden');
    }
  });
  return unsub;
}, []);
```

```css
.window-hidden *,
.window-hidden *::before,
.window-hidden *::after {
  animation-play-state: paused !important;
  transition: none !important;
}
```

---

## 五、分阶段实施计划

### 阶段 1：脚手架搭建（预计 1-2 天）
- [ ] 初始化 Vite + electron-vite 项目骨架
- [ ] 配置 TypeScript strict mode
- [ ] 安装 Preact + electron-store v10
- [ ] 迁移 `electron/main.ts`：窗口管理、托盘、单实例锁
- [ ] 迁移 `electron/preload.ts`：contextBridge API
- [ ] 定义共享类型 `core/types.ts`

### 阶段 2：核心逻辑迁移（预计 1-2 天）
- [ ] 提取 `core/parser.ts`：LHM JSON 解析（纯函数，可直接从 v1 移植）
- [ ] 封装 `core/connection.ts`：HTTP 客户端
- [ ] 实现 `hooks/usePolling.ts`：带超时+退避的串行轮询
- [ ] 实现 `hooks/useSettings.ts`：设置持久化
- [ ] 实现 `hooks/useTheme.ts`：主题切换

### 阶段 3：UI 组件重构（预计 2-3 天）
- [ ] `TitleBar.tsx`：标题栏 + 窗口控制按钮
- [ ] `Settings/`：设置面板三个 Tab
- [ ] `Dashboard/`：
  - `DeviceCard.tsx`：设备卡片容器（memo）
  - `GaugeRing.tsx`：SVG 环形仪表（memo）
  - `TempBar.tsx`：温度进度条（memo）
  - `SensorRow.tsx`：传感器行（memo）
- [ ] `StatusBar.tsx`：底部状态

### 阶段 4：样式迁移（预计 1 天）
- [ ] 提取 CSS 变量到 `variables.css`
- [ ] 拆分组件样式到 CSS Modules
- [ ] 响应式列布局（`useResizeObserver`）
- [ ] 暗色/亮色主题
- [ ] 移除无用的 Google Fonts import

### 阶段 5：性能打磨（预计 1 天）
- [ ] 添加 `contain: layout style paint` 到设备卡片
- [ ] 窗口隐藏时暂停动画和轮询
- [ ] 验证 memo 比较函数正确性
- [ ] 用 Performance 面板验证渲染性能

### 阶段 6：打包和测试（预计 1 天）
- [ ] 配置 electron-builder
- [ ] 测试 NSIS 安装包 + 便携版
- [ ] 手动回归测试（连接、断线、设置、托盘）
- [ ] 对比 v1/v2 CPU 占用（任务管理器 + DevTools Performance）

---

## 六、预期性能收益

| 指标 | v1 (当前) | v2 (重构后) | 改善 |
|------|-----------|-------------|------|
| 空闲 CPU 占用 | 0.5-2% | <0.3% | 动画暂停 + 零渲染 |
| 轮询时 CPU 占用 | 3-8% | 1-3% | memo 差异化更新 |
| DOM 操作/轮询 | 全量 innerHTML | 仅变化节点更新 | 90%+ 减少 |
| 内存占用 | 60-100MB | 40-60MB | Preact 轻量 + 更少 GC |
| 首屏加载 | ~200ms | ~50ms | Vite 预构建 + tree-shaking |
| 包体积 | ~150MB (Electron) | ~150MB (Electron) | Electron 本身不变 |
| 源码可维护性 | 单文件 1154 行 | 25+ 模块化文件 | 质的飞跃 |

---

## 七、风险与不变量

### 不变的东西
- Electron + electron-builder 打包体系
- 与 LibreHardwareMonitor 的 HTTP 协议（`GET /data.json`）
- 系统托盘行为（关闭→隐藏到托盘）
- 单实例锁机制
- 所有现有功能（设置面板、快捷键、置顶等）
- NSIS 安装包 + 便携版双输出
- 用户保存的设置数据格式（向后兼容 electron-store 数据）

### 风险
1. **Preact 兼容性**: Preact 的 `memo` 比较函数 API 与 React 略有差异，需验证
2. **electron-vite 稳定性**: 选择成熟的 `electron-vite` 或 `vite-plugin-electron`
3. **electron-store 数据迁移**: v8→v10 可能需要处理存储路径变化
4. **功能回归**: 重构后需完整回归测试所有交互路径

---

## 八、分支策略

```
master ───────────────────────────────────────────── (v1 稳定版)
  │
  └── refactor/rewrite-v2 ──────────────────────── (v2 重构分支)
        │
        ├── 阶段1: 脚手架
        ├── 阶段2: 核心逻辑
        ├── 阶段3: UI组件
        ├── 阶段4: 样式
        ├── 阶段5: 性能打磨
        └── 阶段6: 打包测试 → merge to master
```

v1 的 `master` 分支保持不动，全部重构工作在 `refactor/rewrite-v2` 上进行。重构完成并验证后合并回 master。
