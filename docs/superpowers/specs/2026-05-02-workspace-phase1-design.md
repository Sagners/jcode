# jcode Web UI - Workspace Phase 1 设计规范

Status: Draft
Date: 2026-05-02
Phase: 1 (Core Framework)

## 概述

本文档定义 jcode Web UI Workspace 系统的 Phase 1 实现规范，采用 Niri 风格的分层工作区架构，支持多会话并行管理、文件树浏览和基础设置配置。

## 设计目标

- **多会话并行**: 在单一窗口内管理多个 AI 会话
- **空间组织**: Lane/Column/Surface 分层结构
- **键鼠共用**: 标准快捷键支持，鼠标操作友好
- **可扩展**: 为后续 Surface 类型预留扩展接口

## 核心概念

```
Workspace (项目级)
  └── Lane[] (垂直分组)
        └── Column[] (水平单元)
              └── Surface[] (面板)
```

| 概念 | 说明 |
|------|------|
| Workspace | 项目/仓库级容器 |
| Lane | 垂直分组的任务流 (如: 主开发、代码审查、监控) |
| Column | Lane 内的水平单元，可包含多个 Surface |
| Surface | 具体面板: 会话、文件树、设置等 |

## 数据结构

### Workspace

```typescript
interface Workspace {
  id: string;
  name: string;
  projectPath?: string;  // 关联的项目路径
  lanes: Lane[];
  activeLaneIndex: number;
  createdAt: number;
  updatedAt: number;
}
```

### Lane

```typescript
interface Lane {
  id: string;
  name: string;
  columns: Column[];
  activeColumnIndex: number;
  isCollapsed: boolean;
}
```

### Column

```typescript
interface Column {
  id: string;
  surfaces: Surface[];
  width: number;  // 百分比
  isActive: boolean;
}
```

### Surface

```typescript
interface Surface {
  id: string;
  kind: SurfaceKind;
  title: string;
  isActive: boolean;
  isMinimized: boolean;
  localState: any;
}

type SurfaceKind =
  | 'agent-session'
  | 'workspace-files'
  | 'settings';
```

### AgentSession Surface

```typescript
interface AgentSessionSurfaceState {
  sessionId: string;
  sessionName: string;
  status: 'idle' | 'running' | 'error';
  currentTool?: string;
  messages: MessageSummary[];
  lastActiveAt: number;
  tokenCount: number;
}

interface MessageSummary {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
```

## 布局结构

### 整体布局

```
┌─────────────────────────────────────────────────────────────┐
│                        Header Bar                          │
│  [≡ 工作区 ▾] │ Session A │ Session B │ Session C │ [⚙️]  │
├────────┬───────────────────────────────────────────────────┤
│        │                                                   │
│ Lane   │              Column / Surface Area                │
│ Navigator                                                   │
│        │  ┌─────────────────────────────────┬────────────┐│
│ [主任务] │  │                                 │            ││
│ [审查  ] │  │     AgentSession Surface       │  文件树    ││
│ [监控  ] │  │                                 │  (可折叠)  ││
│        │  └─────────────────────────────────┴────────────┘│
│        │                                                   │
│  [+ 新] │  ┌─────────────────────────────────────────────┐│
│        │  │              Composer / Input                 ││
│        │  └─────────────────────────────────────────────┘│
└────────┴───────────────────────────────────────────────────┘
```

### 默认布局

- Lane 导航: 左侧窄栏 (120px)
- 主区域: 充满可用空间
- 文件树: 默认隐藏，从右侧边缘呼出

## Surface 详细设计

### 1. AgentSession Surface

#### Header

```
┌────────────────────────────────────────────────────────────┐
│ [●] Session A - 主任务                    [↻] [📌] [✕]   │
│ 状态: ◉ 运行中 - 使用工具: Read (src/main.rs)             │
└────────────────────────────────────────────────────────────┘
```

- 状态指示器: `●` (绿色=idle, 橙色=running, 红色=error)
- 会话名称: 可编辑
- 快捷操作: 重新连接, 固定, 关闭

#### Body (消息流)

```
┌────────────────────────────────────────────────────────────┐
│ 09:30 你: 帮我优化这段代码的性能                           │
│ 09:31 Claude: 好的，我来分析一下...                       │
│ 09:31 ◉ 正在读取: src/main.rs                             │
│ 09:32 Claude: 找到问题了...                               │
│                                                            │
│ [📎 附件]                                                 │
└────────────────────────────────────────────────────────────┘
```

- 时间戳显示
- 工具调用高亮
- 附件预览

#### Footer (Composer)

```
┌────────────────────────────────────────────────────────────┐
│ [📎] [💬 请输入消息...                        ] [发送 ▶]  │
│ last active: 刚刚  │  tokens: ~2.1k                       │
└────────────────────────────────────────────────────────────┘
```

- 附件按钮
- 消息输入框 (支持多行)
- 发送按钮
- 底部信息栏 (活动时间, token 计数)

### 2. WorkspaceFiles Surface

#### 显示模式

- 树形结构
- 文件/文件夹图标
- 展开/折叠
- 悬停操作 (右键菜单)

#### 功能

- 打开文件: 在 CodeView 或外部编辑器
- 新建文件/文件夹
- 重命名
- 删除
- 复制路径

### 3. Settings Surface

#### 布局

模态弹窗或全屏面板

```
┌────────────────────────────────────────────────────────────┐
│                      设置                                  │
├────────────────────────────────────────────────────────────┤
│  [API 配置] [外观] [快捷键] [关于]                         │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Provider: [自动检测 ▾]                               │ │
│  │ API Key:  [••••••••••••••••]                        │ │
│  │ Base URL: [https://api.example.com/v1    ]          │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                            │
│  [保存] [取消]                                            │
└────────────────────────────────────────────────────────────┘
```

#### 配置项

| 类别 | 配置项 |
|------|--------|
| API | Provider, API Key, Base URL, Model |
| 外观 | 主题 (dark/light), 字体大小 |
| 快捷键 | 快捷键映射表 |
| 关于 | 版本信息, 许可 |

## 交互设计

### 视图切换

| 操作 | 结果 |
|------|------|
| 点击 Lane 导航项 | 切换到该 Lane |
| 双击 Lane 标题 | 重命名 |
| 拖动 Lane 导航项 | 调整顺序 |

### Surface 操作

| 操作 | 结果 |
|------|------|
| 点击 Surface 标题栏 | 聚焦该 Surface |
| 双击标题栏 | 全屏/退出全屏 |
| 拖动标题栏 | 移动 Surface 位置 |
| 点击最小化按钮 | 折叠 Surface |
| 点击关闭按钮 | 关闭 Surface |

### 布局调整

| 操作 | 结果 |
|------|------|
| 拖动 Lane 导航分隔线 | 调整导航栏宽度 |
| 拖动 Column 分隔线 | 调整 Column 宽度 |
| 拖动 Surface 分隔线 | 调整 Surface 高度 |

## 快捷键

### 全局快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+,` | 打开设置 |
| `Ctrl+B` | 切换文件树 |
| `Ctrl+L` | 新建 Lane |
| `Ctrl+K Ctrl+S` | 打开快捷键设置 |

### 会话快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+N` | 新建会话 |
| `Ctrl+W` | 关闭当前会话 |
| `Ctrl+Tab` | 下一个会话 |
| `Ctrl+Shift+Tab` | 上一个会话 |
| `Ctrl+1~9` | 快速切换到第 N 个会话 |
| `Enter` (输入框内) | 发送消息 |
| `Escape` | 取消当前操作 |

### 导航快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Alt+H` | 焦点左移 |
| `Ctrl+Alt+J` | 焦点下移 |
| `Ctrl+Alt+K` | 焦点上移 |
| `Ctrl+Alt+L` | 焦点右移 |

## 状态管理

### Store 结构

```
stores/
  ├── workspace.js    # 工作区状态
  ├── lanes.js        # Lane 管理
  ├── surfaces.js     # Surface 管理
  ├── sessions.js     # 会话列表
  ├── messages.js     # 消息流
  ├── connection.js   # WebSocket 连接
  └── ui.js          # UI 状态 (侧边栏, 模态等)
```

### 状态流

```
User Action
    ↓
Component → Action Dispatcher
    ↓
Store (State Update)
    ↓
React Re-render
    ↓
Effect (API Call / LocalStorage)
```

## API 集成

### WebSocket 消息

```typescript
// 连接会话
{ type: 'connect', sessionId: string }

// 发送消息
{ type: 'user-message', sessionId: string, content: string }

// 工具调用
{ type: 'tool-use', sessionId: string, tool: string, params: object }

// 会话列表
{ type: 'session-list', sessions: Session[] }
```

### REST API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sessions` | GET | 获取会话列表 |
| `/api/sessions` | POST | 创建新会话 |
| `/api/sessions/:id` | DELETE | 删除会话 |
| `/api/sessions/:id/messages` | GET | 获取消息历史 |
| `/api/workspaces` | GET | 获取工作区列表 |
| `/api/workspaces` | POST | 创建工作区 |
| `/api/config` | GET/PUT | 配置读写 |

## 持久化

### LocalStorage

```typescript
// 保存
localStorage.setItem('jcode-workspace', JSON.stringify({
  version: 1,
  activeWorkspaceId: string,
  workspaces: Workspace[],
  uiState: { sidebarWidth, fileTreeVisible, theme }
}));

// 加载
const saved = localStorage.getItem('jcode-workspace');
```

### 保存时机

- 布局变更后延迟 500ms 保存
- 页面卸载前强制保存
- 会话状态实时同步到服务器

## 组件清单

### 布局组件

| 组件 | 说明 |
|------|------|
| `App` | 根组件 |
| `HeaderBar` | 顶部栏 |
| `LaneNavigator` | 左侧 Lane 导航 |
| `LaneContent` | Lane 内容区 |
| `Column` | 列容器 |
| `SurfaceContainer` | Surface 包装器 |

### Surface 组件

| 组件 | 说明 |
|------|------|
| `AgentSessionSurface` | 会话面板 |
| `WorkspaceFilesSurface` | 文件树面板 |
| `SettingsSurface` | 设置面板 |

### 子组件

| 组件 | 说明 |
|------|------|
| `MessageList` | 消息流 |
| `MessageItem` | 单条消息 |
| `Composer` | 输入框 |
| `SessionTabs` | 会话标签栏 |
| `StatusIndicator` | 状态指示器 |
| `ToolBadge` | 工具调用标签 |
| `FileTree` | 文件树 |
| `FileTreeItem` | 文件树节点 |

## 样式规范

### 颜色系统

```css
:root {
  /* 主色 */
  --color-primary: #10b981;      /* mint green */
  --color-primary-hover: #059669;

  /* 背景 */
  --bg-primary: #0f0f0f;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #252525;

  /* 文字 */
  --text-primary: #ffffff;
  --text-secondary: #a1a1a1;
  --text-muted: #666666;

  /* 状态 */
  --color-idle: #22c55e;
  --color-running: #f59e0b;
  --color-error: #ef4444;

  /* 边框 */
  --border-color: #333333;
  --border-focus: var(--color-primary);
}
```

### 间距

```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  --lane-nav-width: 120px;
  --surface-min-width: 200px;
  --surface-max-width: 50%;
}
```

### 字体

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
}
```

## 错误处理

### 网络错误

- 连接断开: 显示重连按钮
- 消息发送失败: 显示错误提示，提供重试
- 超时: 提示 "请求超时，请重试"

### 会话错误

- 会话崩溃: 显示错误信息，提供重新连接
- API 错误: 显示错误码和消息

## 性能考虑

- 消息列表虚拟滚动 (超过 100 条时)
- Surface 懒加载
- 布局变更 debounce 500ms
- WebSocket 心跳保活

## 里程碑

- [ ] 核心布局组件 (App, HeaderBar, LaneNavigator)
- [ ] Surface 基础抽象
- [ ] AgentSession Surface 实现
- [ ] 多会话切换
- [ ] WorkspaceFiles Surface 实现
- [ ] Settings Surface 实现
- [ ] 布局持久化
- [ ] 键盘快捷键
- [ ] 响应式适配

## 参考文档

- [DESKTOP_SUPERAPP_WORKSPACE.md](../../DESKTOP_SUPERAPP_WORKSPACE.md) - 完整愿景文档
- [现有 web-ui 实现](../web-ui/) - 当前实现参考
