# Web UI 文档

## 概述

jcode Web UI 是一个纯前端应用，通过浏览器与 jcode Gateway 进行交互，实现 UI 方式的对话和工作区管理。

## 技术架构

- **通信方式**: WebSocket + HTTP 到 jcode Gateway (port 7643)
- **技术栈**: 纯 HTML/CSS/JavaScript，无框架依赖
- **路由**: 基于 Hash 的 SPA 路由
- **状态管理**: 基于事件订阅的 Store 模式

## 文件结构

```
web-ui/
├── index.html              # 主入口
├── css/
│   ├── variables.css       # 官方设计系统变量
│   ├── base.css            # 基础样式
│   ├── components.css      # 组件样式
│   └── pages/
│       ├── chat.css
│       ├── sessions.css
│       └── settings.css
├── js/
│   ├── main.js             # 应用入口
│   ├── api.js              # Gateway HTTP API 客户端
│   ├── websocket.js        # WebSocket 连接管理
│   ├── router.js           # SPA 路由
│   ├── components/
│   │   ├── header.js
│   │   ├── sidebar.js
│   │   ├── chat.js
│   │   ├── message.js
│   │   ├── composer.js
│   │   └── tool-chain.js
│   └── stores/
│       ├── connection.js   # 连接状态
│       ├── session.js      # 会话状态
│       └── messages.js     # 消息状态
└── assets/icons/           # SVG 图标
```

## 设计系统

官方设计规范来自 `figma/jcode-mobile-design-spec.md`：

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg` | `#0F0F14` | 背景色 |
| `--surface` | `#1A1A1F` | 卡片/面板 |
| `--surface-elevated` | `#242429` | 提升的表面 |
| `--border` | `rgba(255,255,255,0.08)` | 边框 |
| `--accent` | `#4DD9A6` | 薄荷绿强调色 |
| `--accent-tint` | `rgba(77,217,166,0.15)` | 强调色浅色 |
| `--text-primary` | `rgba(255,255,255,0.92)` | 主要文字 |
| `--text-secondary` | `rgba(255,255,255,0.55)` | 次要文字 |
| `--warning` | `#F59E0B` | 警告色 |
| `--error` | `#D94D59` | 错误色 |

字体:
- UI: Inter
- Mono: Roboto Mono

## API 端点

Gateway API 基础地址: `http://127.0.0.1:7643`

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/sessions` | GET | 列出所有会话 |
| `/api/sessions` | POST | 创建新会话 |
| `/api/sessions/:id` | GET | 获取会话详情 |
| `/api/sessions/:id` | DELETE | 删除会话 |
| `/api/sessions/:id/messages` | GET | 获取消息列表 |
| `/api/sessions/:id/messages` | POST | 发送消息 |
| `ws://127.0.0.1:7643/ws` | WebSocket | 实时消息 |

## 运行方式

```bash
# 本地服务器
cd web-ui
python -m http.server 8080

# 或直接用浏览器打开
# file://E:/Projects/jcode/web-ui/index.html
```

## 状态管理

使用事件订阅模式管理状态：

```javascript
// 订阅状态变化
const unsubscribe = ConnectionStore.subscribe((connected) => {
  console.log('Connection:', connected);
});

// 取消订阅
unsubscribe();
```

Store 列表:
- `ConnectionStore` - Gateway 连接状态
- `SessionStore` - 当前会话和会话列表
- `MessagesStore` - 聊天消息

## 相关文档

- 设计规范: `docs/superpowers/specs/2026-05-02-web-ui-design.md`
- 实施计划: `docs/superpowers/plans/2026-05-02-web-ui-implementation.md`
- 移动端 Mockups: `mockups/jcode-mobile/`
- Config Workbench (参考): `tools/config-workbench/`