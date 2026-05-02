# jcode Web UI - Workspace Phase 1 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Niri 风格的工作区系统，支持 Lane/Column/Surface 分层结构，多会话管理，文件树和设置面板。

**Architecture:** 基于现有的原生 JS store 模式进行扩展，新增 workspace、lanes、surfaces store，复用现有 session store。布局采用 CSS Flexbox/Grid，支持拖拽调整。

**Tech Stack:** Vanilla JS (无框架), CSS Variables, LocalStorage

---

## 文件结构

```
web-ui/
├── index.html                    # 修改: 添加 workspace 布局结构
├── css/
│   ├── base.css                  # 修改: 添加 workspace 布局样式
│   ├── variables.css             # 修改: 新增 workspace 相关变量
│   └── pages/
│       └── workspace.css         # 新建: workspace 专属样式
└── js/
    ├── main.js                   # 修改: WorkspaceController 初始化
    ├── router.js                 # 修改: 注册 workspace 路由
    ├── stores/
    │   ├── workspace.js          # 新建: Workspace 状态管理
    │   ├── lanes.js              # 新建: Lane 状态管理
    │   └── surfaces.js           # 新建: Surface 状态管理
    └── components/
        ├── workspace/
        │   ├── LaneNavigator.js # 新建: 左侧 Lane 导航
        │   ├── Lane.js           # 新建: Lane 内容容器
        │   ├── Column.js         # 新建: Column 容器
        │   ├── SurfaceContainer.js  # 新建: Surface 包装器
        │   ├── AgentSessionSurface.js  # 新建: 会话面板
        │   ├── WorkspaceFilesSurface.js  # 新建: 文件树面板
        │   └── SettingsSurface.js  # 新建: 设置面板
        └── existing components   # 复用现有组件
```

---

## Task 1: 核心 Store 实现

**Files:**
- Create: `web-ui/js/stores/workspace.js`
- Create: `web-ui/js/stores/lanes.js`
- Create: `web-ui/js/stores/surfaces.js`

- [ ] **Step 1: 创建 Workspace Store**

```javascript
// web-ui/js/stores/workspace.js

const WorkspaceStore = {
  workspaces: [],
  activeWorkspace: null,
  listeners: [],

  setWorkspaces(workspaces) {
    this.workspaces = workspaces || [];
    this.notify();
  },

  setActiveWorkspace(workspace) {
    this.activeWorkspace = workspace;
    this.notify();
  },

  createWorkspace(name, projectPath = null) {
    const workspace = {
      id: `ws-${Date.now()}`,
      name: name || `Workspace ${this.workspaces.length + 1}`,
      projectPath,
      lanes: [],
      activeLaneIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.workspaces.push(workspace);
    this.activeWorkspace = workspace;
    this.notify();
    return workspace;
  },

  deleteWorkspace(workspaceId) {
    this.workspaces = this.workspaces.filter(w => w.id !== workspaceId);
    if (this.activeWorkspace?.id === workspaceId) {
      this.activeWorkspace = this.workspaces[0] || null;
    }
    this.notify();
  },

  updateWorkspace(workspaceId, updates) {
    const index = this.workspaces.findIndex(w => w.id === workspaceId);
    if (index !== -1) {
      this.workspaces[index] = {
        ...this.workspaces[index],
        ...updates,
        updatedAt: Date.now()
      };
      if (this.activeWorkspace?.id === workspaceId) {
        this.activeWorkspace = this.workspaces[index];
      }
      this.notify();
    }
  },

  subscribe(callback) {
    this.listeners.push(callback);
    callback({ workspaces: this.workspaces, activeWorkspace: this.activeWorkspace });
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notify() {
    const state = { workspaces: this.workspaces, activeWorkspace: this.activeWorkspace };
    this.listeners.forEach(cb => cb(state));
  }
};

window.WorkspaceStore = WorkspaceStore;
```

- [ ] **Step 2: 创建 Lane Store**

```javascript
// web-ui/js/stores/lanes.js

const LaneStore = {
  lanes: [],
  activeLaneIndex: 0,
  listeners: [],

  setLanes(lanes) {
    this.lanes = lanes || [];
    this.notify();
  },

  setActiveLaneIndex(index) {
    this.activeLaneIndex = Math.max(0, Math.min(index, this.lanes.length - 1));
    this.notify();
  },

  createLane(name) {
    const lane = {
      id: `lane-${Date.now()}`,
      name: name || `Lane ${this.lanes.length + 1}`,
      columns: [],
      activeColumnIndex: 0,
      isCollapsed: false
    };
    this.lanes.push(lane);
    this.notify();
    return lane;
  },

  deleteLane(laneId) {
    this.lanes = this.lanes.filter(l => l.id !== laneId);
    if (this.activeLaneIndex >= this.lanes.length) {
      this.activeLaneIndex = Math.max(0, this.lanes.length - 1);
    }
    this.notify();
  },

  updateLane(laneId, updates) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (lane) {
      Object.assign(lane, updates);
      this.notify();
    }
  },

  reorderLanes(fromIndex, toIndex) {
    const [lane] = this.lanes.splice(fromIndex, 1);
    this.lanes.splice(toIndex, 0, lane);
    this.notify();
  },

  subscribe(callback) {
    this.listeners.push(callback);
    callback({ lanes: this.lanes, activeLaneIndex: this.activeLaneIndex });
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notify() {
    const state = { lanes: this.lanes, activeLaneIndex: this.activeLaneIndex };
    this.listeners.forEach(cb => cb(state));
  }
};

window.LaneStore = LaneStore;
```

- [ ] **Step 3: 创建 Surface Store**

```javascript
// web-ui/js/stores/surfaces.js

const SurfaceStore = {
  surfaces: [],
  activeSurfaceId: null,
  listeners: [],

  setSurfaces(surfaces) {
    this.surfaces = surfaces || [];
    this.notify();
  },

  setActiveSurface(surfaceId) {
    this.activeSurfaceId = surfaceId;
    this.notify();
  },

  createSurface(kind, title, options = {}) {
    const surface = {
      id: `surface-${Date.now()}`,
      kind, // 'agent-session' | 'workspace-files' | 'settings'
      title: title || kind,
      isActive: true,
      isMinimized: false,
      localState: options.localState || {}
    };
    this.surfaces.push(surface);
    this.activeSurfaceId = surface.id;
    this.notify();
    return surface;
  },

  deleteSurface(surfaceId) {
    this.surfaces = this.surfaces.filter(s => s.id !== surfaceId);
    if (this.activeSurfaceId === surfaceId) {
      this.activeSurfaceId = this.surfaces[0]?.id || null;
    }
    this.notify();
  },

  updateSurface(surfaceId, updates) {
    const surface = this.surfaces.find(s => s.id === surfaceId);
    if (surface) {
      Object.assign(surface, updates);
      this.notify();
    }
  },

  getSurface(surfaceId) {
    return this.surfaces.find(s => s.id === surfaceId);
  },

  subscribe(callback) {
    this.listeners.push(callback);
    callback({ surfaces: this.surfaces, activeSurfaceId: this.activeSurfaceId });
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notify() {
    const state = { surfaces: this.surfaces, activeSurfaceId: this.activeSurfaceId };
    this.listeners.forEach(cb => cb(state));
  }
};

window.SurfaceStore = SurfaceStore;
```

- [ ] **Step 4: 在 index.html 中添加 store 引用**

在 `<head>` 中添加（如果不存在），在 `</body>` 前添加 script 引用：
```html
<script src="js/stores/workspace.js"></script>
<script src="js/stores/lanes.js"></script>
<script src="js/stores/surfaces.js"></script>
```

- [ ] **Step 5: 提交代码**

```bash
git add web-ui/js/stores/workspace.js web-ui/js/stores/lanes.js web-ui/js/stores/surfaces.js
git commit -m "feat(workspace): add core stores for workspace, lanes, surfaces"
```

---

## Task 2: 布局基础结构

**Files:**
- Modify: `web-ui/index.html`
- Modify: `web-ui/css/variables.css`
- Create: `web-ui/css/pages/workspace.css`
- Modify: `web-ui/css/base.css`

- [ ] **Step 1: 更新 CSS Variables**

在 `web-ui/css/variables.css` 末尾添加：

```css
/* Workspace Layout */
--lane-nav-width: 140px;
--header-height: 52px;
--surface-header-height: 36px;
--surface-min-width: 280px;
--surface-max-ratio: 50%;

/* Surface Status Colors */
--status-idle: #22c55e;
--status-running: #f59e0b;
--status-error: #ef4444;
```

- [ ] **Step 2: 创建 Workspace CSS**

```css
/* web-ui/css/pages/workspace.css */

/* Workspace Layout */
.workspace-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg);
}

.workspace-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Lane Navigator (Left Sidebar) */
.lane-navigator {
  width: var(--lane-nav-width);
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.lane-navigator-header {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lane-navigator-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.lane-navigator-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.lane-item {
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-bottom: var(--space-1);
  color: var(--text-secondary);
  transition: all 0.15s ease;
}

.lane-item:hover {
  background: var(--surface-elevated);
  color: var(--text-primary);
}

.lane-item.active {
  background: var(--accent-tint);
  color: var(--accent);
}

.lane-item-name {
  flex: 1;
  font-size: var(--text-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lane-navigator-footer {
  padding: var(--space-2);
  border-top: 1px solid var(--border);
}

.lane-add-btn {
  width: 100%;
  padding: var(--space-2);
  background: transparent;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.lane-add-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-tint);
}

/* Lane Content Area */
.lane-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: var(--bg);
}

.column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: var(--surface-min-width);
  overflow: hidden;
}

/* Surface Container */
.surface-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin: var(--space-2);
}

.surface-header {
  height: var(--surface-header-height);
  padding: 0 var(--space-3);
  background: var(--surface-elevated);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.surface-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.surface-status.idle { background: var(--status-idle); }
.surface-status.running { background: var(--status-running); }
.surface-status.error { background: var(--status-error); }

.surface-title {
  flex: 1;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.surface-actions {
  display: flex;
  gap: var(--space-1);
}

.surface-action-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.surface-action-btn:hover {
  background: var(--surface);
  color: var(--text-primary);
}

.surface-body {
  flex: 1;
  overflow: auto;
}

.surface-footer {
  padding: var(--space-3);
  border-top: 1px solid var(--border);
  background: var(--surface-elevated);
}

/* Resize Handle */
.resize-handle {
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s ease;
  flex-shrink: 0;
}

.resize-handle:hover,
.resize-handle.active {
  background: var(--accent);
}
```

- [ ] **Step 3: 更新 index.html**

替换 `<body>` 内容为 workspace 布局：

```html
<body>
  <div class="workspace-layout">
    <!-- Header (reuse existing) -->
    <header class="header">
      <div class="header-brand">jcode</div>
      <div class="header-center">
        <span class="status-dot disconnected" id="connectionDot"></span>
        <span id="connectionStatus">Disconnected</span>
      </div>
      <div class="header-actions">
        <select id="modelSelect" class="model-select">
          <option value="claude-opus-4-7">Opus 4</option>
          <option value="claude-sonnet-4-7">Sonnet 4</option>
        </select>
      </div>
    </header>

    <!-- Workspace Body -->
    <div class="workspace-body">
      <!-- Lane Navigator -->
      <nav class="lane-navigator" id="laneNavigator">
        <div class="lane-navigator-header">
          <span class="lane-navigator-title">Lanes</span>
        </div>
        <div class="lane-navigator-list" id="laneList">
          <!-- Lanes rendered here -->
        </div>
        <div class="lane-navigator-footer">
          <button class="lane-add-btn" id="addLaneBtn">+ New Lane</button>
        </div>
      </nav>

      <!-- Lane Content -->
      <main class="lane-content" id="laneContent">
        <!-- Active lane content rendered here -->
      </main>
    </div>
  </div>

  <!-- Load stores first -->
  <script src="js/stores/workspace.js"></script>
  <script src="js/stores/lanes.js"></script>
  <script src="js/stores/surfaces.js"></script>

  <!-- Then components -->
  <script src="js/router.js"></script>
  <script src="js/api.js"></script>
  <script src="js/websocket.js"></script>
  <script src="js/stores/connection.js"></script>
  <script src="js/stores/session.js"></script>
  <script src="js/stores/messages.js"></script>
  <script src="js/components/message.js"></script>
  <script src="js/components/composer.js"></script>
  <script src="js/components/tool-chain.js"></script>
  <script src="js/components/chat.js"></script>
  <script src="js/main.js"></script>
</body>
```

- [ ] **Step 4: 提交代码**

```bash
git add web-ui/css/variables.css web-ui/css/pages/workspace.css web-ui/index.html
git commit -m "feat(workspace): add workspace layout structure and CSS"
```

---

## Task 3: WorkspaceController 实现

**Files:**
- Create: `web-ui/js/components/workspace/WorkspaceController.js`
- Modify: `web-ui/js/main.js`

- [ ] **Step 1: 创建 WorkspaceController**

```javascript
// web-ui/js/components/workspace/WorkspaceController.js

const WorkspaceController = {
  container: null,

  init() {
    this.container = document.getElementById('laneContent');
    this.initLaneNavigator();
    this.loadWorkspace();
    this.setupKeyboardShortcuts();
  },

  initLaneNavigator() {
    const laneList = document.getElementById('laneList');
    const addLaneBtn = document.getElementById('addLaneBtn');

    // Subscribe to lane store
    LaneStore.subscribe(({ lanes, activeLaneIndex }) => {
      this.renderLaneList(laneList, lanes, activeLaneIndex);
    });

    // Add lane button
    addLaneBtn?.addEventListener('click', () => {
      const name = prompt('Lane name:', `Lane ${LaneStore.lanes.length + 1}`);
      if (name) {
        const lane = LaneStore.createLane(name);
        this.createDefaultSurfaceForLane(lane.id);
      }
    });
  },

  renderLaneList(container, lanes, activeIndex) {
    container.innerHTML = '';
    lanes.forEach((lane, index) => {
      const item = document.createElement('div');
      item.className = `lane-item${index === activeIndex ? ' active' : ''}`;
      item.innerHTML = `<span class="lane-item-name">${lane.name}</span>`;
      item.addEventListener('click', () => {
        LaneStore.setActiveLaneIndex(index);
        this.renderActiveLane();
      });
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (confirm(`Delete lane "${lane.name}"?`)) {
          LaneStore.deleteLane(lane.id);
          this.renderActiveLane();
        }
      });
      container.appendChild(item);
    });
  },

  renderActiveLane() {
    const lane = LaneStore.lanes[LaneStore.activeLaneIndex];
    if (!lane) {
      this.container.innerHTML = `
        <div class="empty-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
          <p>No lanes yet</p>
          <p style="color: var(--text-tertiary)">Click "+ New Lane" to create one</p>
        </div>
      `;
      return;
    }
    this.renderLaneContent(lane);
  },

  renderLaneContent(lane) {
    this.container.innerHTML = '';

    lane.columns.forEach(column => {
      const columnEl = document.createElement('div');
      columnEl.className = 'column';
      columnEl.innerHTML = '<div class="surface-container"><div class="surface-body">Select or create a surface</div></div>';
      this.container.appendChild(columnEl);

      column.surfaces.forEach(surface => {
        this.renderSurfaceInColumn(columnEl, surface);
      });
    });

    // Add default column if none
    if (lane.columns.length === 0) {
      this.addDefaultColumn(lane.id);
    }
  },

  renderSurfaceInColumn(columnEl, surface) {
    const container = columnEl.querySelector('.surface-container');
    // TODO: Render specific surface type
    container.innerHTML = `
      <div class="surface-header">
        <span class="surface-status idle"></span>
        <span class="surface-title">${surface.title}</span>
        <div class="surface-actions">
          <button class="surface-action-btn" title="Minimize">─</button>
          <button class="surface-action-btn" title="Close">✕</button>
        </div>
      </div>
      <div class="surface-body">
        <p style="padding: 16px; color: var(--text-secondary);">Surface: ${surface.kind}</p>
      </div>
    `;
  },

  addDefaultColumn(laneId) {
    const lane = LaneStore.lanes.find(l => l.id === laneId);
    if (!lane) return;

    const column = {
      id: `col-${Date.now()}`,
      surfaces: [],
      width: 100
    };
    lane.columns.push(column);
    LaneStore.updateLane(laneId, { columns: lane.columns });
    this.renderActiveLane();
  },

  createDefaultSurfaceForLane(laneId) {
    const lane = LaneStore.lanes.find(l => l.id === laneId);
    if (!lane || lane.columns.length === 0) {
      this.addDefaultColumn(laneId);
    }
    // Create a default AgentSession surface
    const column = lane.columns[0];
    const surface = SurfaceStore.createSurface('agent-session', `Session ${SurfaceStore.surfaces.length + 1}`);
    column.surfaces.push(surface);
    LaneStore.updateLane(laneId, { columns: lane.columns });
    this.renderActiveLane();
  },

  loadWorkspace() {
    // Create default workspace if none exists
    if (WorkspaceStore.workspaces.length === 0) {
      WorkspaceStore.createWorkspace('Default Workspace');
    }
    if (LaneStore.lanes.length === 0) {
      const lane = LaneStore.createLane('Main');
      this.createDefaultSurfaceForLane(lane.id);
    }
    this.renderActiveLane();
  },

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+L: New Lane
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        const name = prompt('Lane name:', `Lane ${LaneStore.lanes.length + 1}`);
        if (name) {
          const lane = LaneStore.createLane(name);
          this.createDefaultSurfaceForLane(lane.id);
        }
      }
    });
  },

  getElement() {
    return this.container;
  }
};

window.WorkspaceController = WorkspaceController;
```

- [ ] **Step 2: 更新 main.js 注册 workspace 路由**

在 `web-ui/js/main.js` 中，修改 `registerRoutes` 方法：

```javascript
// 在 registerRoutes 中添加
Router.register('workspace', () => {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="workspace-layout">
      <div class="workspace-body">
        <nav class="lane-navigator" id="laneNavigator">
          <!-- ... -->
        </nav>
        <main class="lane-content" id="laneContent"></main>
      </div>
    </div>
  `;
  WorkspaceController.init();
});
```

- [ ] **Step 3: 提交代码**

```bash
git add web-ui/js/components/workspace/WorkspaceController.js web-ui/js/main.js
git commit -m "feat(workspace): add WorkspaceController and lane navigation"
```

---

## Task 4: AgentSession Surface 实现

**Files:**
- Create: `web-ui/js/components/workspace/AgentSessionSurface.js`

- [ ] **Step 1: 创建 AgentSessionSurface 组件**

```javascript
// web-ui/js/components/workspace/AgentSessionSurface.js

const AgentSessionSurface = {
  surface: null,

  create(surfaceId, sessionId) {
    const surface = SurfaceStore.getSurface(surfaceId);
    if (!surface) return null;

    this.surface = surface;
    const container = document.createElement('div');
    container.className = 'surface-container';
    container.id = `surface-${surfaceId}`;

    container.innerHTML = `
      <div class="surface-header">
        <span class="surface-status idle" id="status-${surfaceId}"></span>
        <span class="surface-title" id="title-${surfaceId}">${surface.title}</span>
        <div class="surface-actions">
          <button class="surface-action-btn" title="Minimize" data-action="minimize">
            <span style="font-size: 10px">─</span>
          </button>
          <button class="surface-action-btn" title="Close" data-action="close">✕</button>
        </div>
      </div>
      <div class="surface-body" id="body-${surfaceId}">
        ${this.renderContent(sessionId)}
      </div>
      <div class="surface-footer" id="footer-${surfaceId}">
        ${this.renderComposer(surfaceId)}
      </div>
    `;

    this.attachEvents(container, surfaceId, sessionId);
    return container;
  },

  renderContent(sessionId) {
    return `
      <div class="session-messages" id="messages-${sessionId}">
        <div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-secondary);">
          <p>No messages yet</p>
          <p style="color: var(--text-tertiary); font-size: 12px;">Start a conversation below</p>
        </div>
      </div>
    `;
  },

  renderComposer(surfaceId) {
    return `
      <div class="composer">
        <button class="composer-attachment" title="Attach files">📎</button>
        <textarea
          class="composer-input"
          id="input-${surfaceId}"
          placeholder="Type a message..."
          rows="1"
        ></textarea>
        <button class="composer-send" id="send-${surfaceId}">▶</button>
      </div>
      <div class="surface-meta">
        <span class="meta-item" id="lastActive-${surfaceId}">last active: never</span>
        <span class="meta-item" id="tokens-${surfaceId}">tokens: 0</span>
      </div>
    `;
  },

  attachEvents(container, surfaceId, sessionId) {
    const input = container.querySelector(`#input-${surfaceId}`);
    const sendBtn = container.querySelector(`#send-${surfaceId}`);

    // Auto-resize textarea
    input?.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 150) + 'px';
    });

    // Send message
    const sendMessage = () => {
      const content = input?.value.trim();
      if (!content) return;

      // Add user message to UI immediately
      this.addMessage(surfaceId, sessionId, 'user', content);
      input.value = '';
      input.style.height = 'auto';

      // Update status
      this.setStatus(surfaceId, 'running');

      // Send via API
      this.sendToAPI(sessionId, content);
    };

    sendBtn?.addEventListener('click', sendMessage);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Action buttons
    container.querySelectorAll('.surface-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'close') {
          SurfaceStore.deleteSurface(surfaceId);
        } else if (action === 'minimize') {
          SurfaceStore.updateSurface(surfaceId, { isMinimized: true });
        }
      });
    });
  },

  addMessage(surfaceId, sessionId, role, content) {
    const messagesEl = document.getElementById(`messages-${sessionId}`);
    if (!messagesEl) return;

    // Remove empty state if present
    const empty = messagesEl.querySelector('.empty-state');
    if (empty) empty.remove();

    const msgEl = document.createElement('div');
    msgEl.className = `message message-${role}`;
    msgEl.innerHTML = `
      <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      <div class="message-content">${this.escapeHtml(content)}</div>
    `;
    messagesEl.appendChild(msgEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  },

  setStatus(surfaceId, status) {
    const statusEl = document.getElementById(`status-${surfaceId}`);
    if (statusEl) {
      statusEl.className = `surface-status ${status}`;
    }
  },

  updateLastActive(surfaceId, time) {
    const el = document.getElementById(`lastActive-${surfaceId}`);
    if (el) {
      el.textContent = `last active: ${time}`;
    }
  },

  async sendToAPI(sessionId, content) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: content })
      });
      // Handle response...
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

window.AgentSessionSurface = AgentSessionSurface;
```

- [ ] **Step 2: 提交代码**

```bash
git add web-ui/js/components/workspace/AgentSessionSurface.js
git commit -m "feat(workspace): add AgentSession surface component"
```

---

## Task 5: WorkspaceFiles Surface 实现

**Files:**
- Create: `web-ui/js/components/workspace/WorkspaceFilesSurface.js`

- [ ] **Step 1: 创建 WorkspaceFilesSurface**

```javascript
// web-ui/js/components/workspace/WorkspaceFilesSurface.js

const WorkspaceFilesSurface = {
  surface: null,
  fileTree: [],

  create(surfaceId) {
    const surface = SurfaceStore.getSurface(surfaceId);
    if (!surface) return null;

    this.surface = surface;
    const container = document.createElement('div');
    container.className = 'surface-container';
    container.id = `surface-${surfaceId}`;

    container.innerHTML = `
      <div class="surface-header">
        <span class="surface-title">Files</span>
        <div class="surface-actions">
          <button class="surface-action-btn" title="Collapse All">⊞</button>
          <button class="surface-action-btn" title="Close" data-action="close">✕</button>
        </div>
      </div>
      <div class="surface-body">
        <div class="file-tree" id="fileTree-${surfaceId}">
          ${this.renderFileTree()}
        </div>
      </div>
    `;

    this.attachEvents(container, surfaceId);
    return container;
  },

  renderFileTree() {
    if (this.fileTree.length === 0) {
      return `
        <div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-secondary);">
          <p>No files</p>
          <p style="color: var(--text-tertiary); font-size: 12px;">Configure project path in settings</p>
        </div>
      `;
    }

    return this.fileTree.map(item => this.renderFileItem(item)).join('');
  },

  renderFileItem(item) {
    const icon = item.type === 'folder' ? '📁' : '📄';
    const children = item.type === 'folder' && item.children
      ? `<div class="file-tree-children">${item.children.map(c => this.renderFileItem(c)).join('')}</div>`
      : '';

    return `
      <div class="file-tree-item" data-path="${item.path}" data-type="${item.type}">
        <span class="file-icon">${icon}</span>
        <span class="file-name">${item.name}</span>
        ${children}
      </div>
    `;
  },

  attachEvents(container, surfaceId) {
    // Toggle folder
    container.querySelectorAll('.file-tree-item[data-type="folder"]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        item.classList.toggle('expanded');
      });
    });

    // Open file
    container.querySelectorAll('.file-tree-item[data-type="file"]').forEach(item => {
      item.addEventListener('dblclick', () => {
        const path = item.dataset.path;
        console.log('Open file:', path);
        // TODO: Open in CodeView or external editor
      });
    });

    // Close button
    container.querySelector('[data-action="close"]')?.addEventListener('click', () => {
      SurfaceStore.deleteSurface(surfaceId);
    });
  },

  loadFileTree(projectPath) {
 // TODO: Fetch from API
    this.fileTree = [
      {
        name: 'src',
        type: 'folder',
        path: 'src/',
        children: [
          { name: 'main.js', type: 'file', path: 'src/main.js' },
          { name: 'components', type: 'folder', path: 'src/components/',
            children: [
              { name: 'App.js', type: 'file', path: 'src/components/App.js' }
            ]
          }
        ]
      },
      { name: 'package.json', type: 'file', path: 'package.json' },
      { name: 'README.md', type: 'file', path: 'README.md' }
    ];
  }
};

window.WorkspaceFilesSurface = WorkspaceFilesSurface;
```

- [ ] **Step 2: 提交代码**

```bash
git add web-ui/js/components/workspace/WorkspaceFilesSurface.js
git commit -m "feat(workspace): add WorkspaceFiles surface component"
```

---

## Task 6: Settings Surface 实现

**Files:**
- Create: `web-ui/js/components/workspace/SettingsSurface.js`

- [ ] **Step 1: 创建 SettingsSurface**

```javascript
// web-ui/js/components/workspace/SettingsSurface.js

const SettingsSurface = {
  surface: null,

  create(surfaceId) {
    const surface = SurfaceStore.getSurface(surfaceId);
    if (!surface) return null;

    this.surface = surface;
    const container = document.createElement('div');
    container.className = 'surface-container';
    container.id = `surface-${surfaceId}`;

    container.innerHTML = `
      <div class="surface-header">
        <span class="surface-title">Settings</span>
        <div class="surface-actions">
          <button class="surface-action-btn" title="Close" data-action="close">✕</button>
        </div>
      </div>
      <div class="surface-body settings-body">
        <div class="settings-tabs">
          <button class="settings-tab active" data-tab="api">API</button>
          <button class="settings-tab" data-tab="appearance">Appearance</button>
          <button class="settings-tab" data-tab="shortcuts">Shortcuts</button>
          <button class="settings-tab" data-tab="about">About</button>
        </div>
        <div class="settings-content" id="settingsContent-${surfaceId}">
          ${this.renderApiSettings()}
        </div>
      </div>
    `;

    this.attachEvents(container, surfaceId);
    return container;
  },

  renderApiSettings() {
    return `
      <div class="settings-section">
        <h4 class="settings-section-title">API Configuration</h4>
        <div class="settings-field">
          <label class="settings-label">Provider</label>
          <select class="settings-input" id="settingsProvider">
            <option value="anthropic">Anthropic</option>
            <option value="openai">OpenAI</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div class="settings-field">
          <label class="settings-label">API Key</label>
          <input type="password" class="settings-input" id="settingsApiKey"
            placeholder="sk-..." value=""/>
        </div>
        <div class="settings-field">
          <label class="settings-label">Base URL</label>
          <input type="text" class="settings-input" id="settingsBaseUrl"
            placeholder="https://api.anthropic.com/v1" value="https://api.anthropic.com/v1"/>
        </div>
        <div class="settings-field">
          <label class="settings-label">Default Model</label>
          <select class="settings-input" id="settingsModel">
            <option value="claude-opus-4-7">Claude Opus 4</option>
            <option value="claude-sonnet-4-7">Claude Sonnet 4</option>
            <option value="claude-haiku-4-7">Claude Haiku 4</option>
          </select>
        </div>
        <button class="btn btn-primary" id="saveApiSettings">Save</button>
      </div>
    `;
  },

  renderAppearanceSettings() {
    return `
      <div class="settings-section">
        <h4 class="settings-section-title">Appearance</h4>
        <div class="settings-field">
          <label class="settings-label">Theme</label>
          <select class="settings-input" id="settingsTheme">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div class="settings-field">
          <label class="settings-label">Font Size</label>
          <input type="range" class="settings-range" id="settingsFontSize"
            min="12" max="18" value="14"/>
          <span id="fontSizeValue">14px</span>
        </div>
      </div>
    `;
  },

  renderShortcutsSettings() {
    return `
      <div class="settings-section">
        <h4 class="settings-section-title">Keyboard Shortcuts</h4>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <span class="shortcut-action">New Lane</span>
            <kbd class="shortcut-key">Ctrl+L</kbd>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-action">New Session</span>
            <kbd class="shortcut-key">Ctrl+N</kbd>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-action">Toggle File Tree</span>
            <kbd class="shortcut-key">Ctrl+B</kbd>
          </div>
          <div class="shortcut-item">
            <span class="shortcut-action">Open Settings</span>
            <kbd class="shortcut-key">Ctrl+,</kbd>
          </div>
        </div>
      </div>
    `;
  },

  renderAboutSettings() {
    return `
      <div class="settings-section">
        <h4 class="settings-section-title">About</h4>
        <p style="color: var(--text-secondary);">jcode Web UI</p>
        <p style="color: var(--text-tertiary);">Version 1.0.0</p>
        <p style="color: var(--text-tertiary); margin-top: 16px;">Built with vanilla JavaScript</p>
      </div>
    `;
  },

  attachEvents(container, surfaceId) {
    // Tab switching
    container.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const contentEl = container.querySelector(`#settingsContent-${surfaceId}`);
        const tabName = tab.dataset.tab;

        switch(tabName) {
          case 'api':
            contentEl.innerHTML = this.renderApiSettings();
            this.attachApiEvents(contentEl);
            break;
          case 'appearance':
            contentEl.innerHTML = this.renderAppearanceSettings();
            this.attachAppearanceEvents(contentEl);
            break;
          case 'shortcuts':
            contentEl.innerHTML = this.renderShortcutsSettings();
            break;
          case 'about':
            contentEl.innerHTML = this.renderAboutSettings();
            break;
        }
      });
    });

    // Initial API events
    this.attachApiEvents(container.querySelector(`#settingsContent-${surfaceId}`));

    // Close button
    container.querySelector('[data-action="close"]')?.addEventListener('click', () => {
      SurfaceStore.deleteSurface(surfaceId);
    });
  },

  attachApiEvents(container) {
    const saveBtn = container.querySelector('#saveApiSettings');
    saveBtn?.addEventListener('click', () => {
      const apiKey = container.querySelector('#settingsApiKey')?.value;
      const baseUrl = container.querySelector('#settingsBaseUrl')?.value;
      const model = container.querySelector('#settingsModel')?.value;

      // Save to localStorage
      localStorage.setItem('jcode-settings', JSON.stringify({ apiKey, baseUrl, model }));
      alert('Settings saved!');
    });
  },

  attachAppearanceEvents(container) {
    const fontSize = container.querySelector('#settingsFontSize');
    const fontSizeValue = container.querySelector('#fontSizeValue');

    fontSize?.addEventListener('input', () => {
      const size = fontSize.value;
      fontSizeValue.textContent = `${size}px`;
      document.documentElement.style.setProperty('--text-base', `${size}px`);
    });
  }
};

window.SettingsSurface = SettingsSurface;
```

- [ ] **Step 2: 添加 Settings 相关 CSS**

在 `web-ui/css/pages/workspace.css` 末尾添加：

```css
/* Settings Surface */
.settings-body {
  display: flex;
  flex-direction: column;
}

.settings-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  padding: 0 var(--space-3);
}

.settings-tab {
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.settings-tab:hover {
  color: var(--text-primary);
}

.settings-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.settings-content {
  flex: 1;
  padding: var(--space-4);
  overflow-y: auto;
}

.settings-section {
  margin-bottom: var(--space-6);
}

.settings-section-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-4);
}

.settings-field {
  margin-bottom: var(--space-4);
}

.settings-label {
  display: block;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.settings-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.settings-input:focus {
  outline: none;
  border-color: var(--accent);
}

.settings-range {
  width: calc(100% - 60px);
  margin-right: var(--space-2);
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2);
}

.shortcut-action {
  color: var(--text-primary);
}

.shortcut-key {
  padding: var(--space-1) var(--space-2);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}
```

- [ ] **Step 3: 提交代码**

```bash
git add web-ui/js/components/workspace/SettingsSurface.js web-ui/css/pages/workspace.css
git commit -m "feat(workspace): add Settings surface component"
```

---

## Task 7: 键盘快捷键和工具栏集成

**Files:**
- Modify: `web-ui/js/components/workspace/WorkspaceController.js`
- Modify: `web-ui/css/pages/workspace.css`

- [ ] **Step 1: 更新 WorkspaceController 添加更多快捷键**

在 `WorkspaceController.js` 的 `setupKeyboardShortcuts` 方法中添加：

```javascript
setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+L: New Lane
    if (e.ctrlKey && e.key === 'l' && !e.shiftKey) {
      e.preventDefault();
      const name = prompt('Lane name:', `Lane ${LaneStore.lanes.length + 1}`);
      if (name) {
        const lane = LaneStore.createLane(name);
        this.createDefaultSurfaceForLane(lane.id);
      }
    }

    // Ctrl+N: New Session (in active surface)
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      const activeSurface = SurfaceStore.surfaces.find(s => s.id === SurfaceStore.activeSurfaceId);
      if (activeSurface?.kind === 'agent-session') {
        // Create new session surface
        const lane = LaneStore.lanes[LaneStore.activeLaneIndex];
        if (lane?.columns[0]) {
          const surface = SurfaceStore.createSurface('agent-session', `Session ${SurfaceStore.surfaces.length + 1}`);
          lane.columns[0].surfaces.push(surface);
          LaneStore.updateLane(lane.id, { columns: lane.columns });
          this.renderActiveLane();
        }
      }
    }

    // Ctrl+W: Close current surface
    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault();
      if (SurfaceStore.activeSurfaceId) {
        SurfaceStore.deleteSurface(SurfaceStore.activeSurfaceId);
        this.renderActiveLane();
      }
    }

    // Ctrl+B: Toggle file tree
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      const lane = LaneStore.lanes[LaneStore.activeLaneIndex];
      if (lane) {
        const fileTreeSurface = lane.columns[0]?.surfaces.find(s => s.kind === 'workspace-files');
        if (fileTreeSurface) {
          SurfaceStore.deleteSurface(fileTreeSurface.id);
        } else {
          const surface = SurfaceStore.createSurface('workspace-files', 'Files');
          if (lane.columns[0]) {
            lane.columns[0].surfaces.push(surface);
            LaneStore.updateLane(lane.id, { columns: lane.columns });
          }
        }
        this.renderActiveLane();
      }
    }

    // Ctrl+,: Open settings
    if (e.ctrlKey && e.key === ',') {
      e.preventDefault();
      const lane = LaneStore.lanes[LaneStore.activeLaneIndex];
      if (lane?.columns[0]) {
        const surface = SurfaceStore.createSurface('settings', 'Settings');
        lane.columns[0].surfaces.push(surface);
        LaneStore.updateLane(lane.id, { columns: lane.columns });
        this.renderActiveLane();
      }
    }

    // Ctrl+1-9: Quick switch to session N
    if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const index = parseInt(e.key) - 1;
      const surfaces = SurfaceStore.surfaces.filter(s => s.kind === 'agent-session');
      if (surfaces[index]) {
        SurfaceStore.setActiveSurface(surfaces[index].id);
        this.renderActiveLane();
      }
    }

    // Ctrl+Tab: Next surface
    if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const surfaces = SurfaceStore.surfaces;
      const currentIndex = surfaces.findIndex(s => s.id === SurfaceStore.activeSurfaceId);
      const nextIndex = (currentIndex + 1) % surfaces.length;
      SurfaceStore.setActiveSurface(surfaces[nextIndex].id);
    }

    // Ctrl+Shift+Tab: Previous surface
    if (e.ctrlKey && e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      const surfaces = SurfaceStore.surfaces;
      const currentIndex = surfaces.findIndex(s => s.id === SurfaceStore.activeSurfaceId);
      const prevIndex = (currentIndex - 1 + surfaces.length) % surfaces.length;
      SurfaceStore.setActiveSurface(surfaces[prevIndex].id);
    }
  });
}
```

- [ ] **Step 2: 在 Header 添加快速操作按钮**

在 `web-ui/index.html` 的 header 中添加工具栏：

```html
<div class="header-toolbar">
  <button class="toolbar-btn" id="newSessionBtn" title="New Session (Ctrl+N)">+ Session</button>
  <button class="toolbar-btn" id="toggleFilesBtn" title="Toggle Files (Ctrl+B)">📁</button>
  <button class="toolbar-btn" id="openSettingsBtn" title="Settings (Ctrl+,)">⚙️</button>
</div>
```

- [ ] **Step 3: 在 WorkspaceController 中绑定工具栏事件**

```javascript
initToolbar() {
  document.getElementById('newSessionBtn')?.addEventListener('click', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }));
  });

  document.getElementById('toggleFilesBtn')?.addEventListener('click', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }));
  });

  document.getElementById('openSettingsBtn')?.addEventListener('click', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: ',', ctrlKey: true }));
  });
}
```

- [ ] **Step 4: 提交代码**

```bash
git add web-ui/js/components/workspace/WorkspaceController.js
git commit -m "feat(workspace): add keyboard shortcuts and toolbar"
```

---

## Task 8: 持久化实现

**Files:**
- Modify: `web-ui/js/components/workspace/WorkspaceController.js`
- Modify: `web-ui/js/stores/workspace.js`
- Modify: `web-ui/js/stores/lanes.js`
- Modify: `web-ui/js/stores/surfaces.js`

- [ ] **Step 1: 添加自动保存到 Store**

在每个 store 中添加保存逻辑：

```javascript
// 在 workspace.js 中添加
const STORAGE_KEY = 'jcode-workspace-v1';

const WorkspaceStore = {
  // ... 现有代码 ...

  // 新增方法
  save() {
    const data = {
      version: 1,
      workspaces: this.workspaces,
      activeWorkspaceId: this.activeWorkspace?.id
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (data && data.version === 1) {
        this.workspaces = data.workspaces || [];
        this.activeWorkspace = this.workspaces.find(w => w.id === data.activeWorkspaceId);
      }
    } catch (e) {
      console.log('Failed to load workspace:', e);
    }
  }
};

// 在 notify 中自动保存
notify() {
  const state = { workspaces: this.workspaces, activeWorkspace: this.activeWorkspace };
  this.listeners.forEach(cb => cb(state));
  this.save(); // 自动保存
}
```

- [ ] **Step 2: 同样更新 Lane 和 Surface Store**

为 LaneStore 和 SurfaceStore 添加相同的 STORAGE_KEY 和 save/load 方法。

- [ ] **Step 3: 页面卸载前保存**

```javascript
// 在 WorkspaceController.js 中
setupBeforeUnload() {
  window.addEventListener('beforeunload', () => {
    WorkspaceStore.save();
    LaneStore.save();
    SurfaceStore.save();
  });
}
```

- [ ] **Step 4: 提交代码**

```bash
git add web-ui/js/stores/workspace.js web-ui/js/stores/lanes.js web-ui/js/stores/surfaces.js
git commit -m "feat(workspace): add localStorage persistence"
```

---

## Task 9: 集成测试

**Files:**
- Test in browser

- [ ] **Step 1: 启动本地服务器**

```bash
cd web-ui
npx serve . -l 3000
# 或
python -m http.server 3000
```

- [ ] **Step 2: 验证功能**

1. 打开浏览器访问 http://localhost:3000
2. 验证：
   - [ ] Lane 导航显示在左侧
   - [ ] 可以创建新 Lane (Ctrl+L 或点击按钮)
   - [ ] 可以删除 Lane (右键)
   - [ ] Surface 面板显示在 Lane 内
   - [ ] 可以创建新 Session Surface
   - [ ] 会话输入框可以发送消息
   - [ ] 文件树可以显示/隐藏 (Ctrl+B)
   - [ ] 设置面板可以打开 (Ctrl+,)
   - [ ] 快捷键 Ctrl+1-9 切换会话
   - [ ] 刷新页面后布局保持

- [ ] **Step 3: 提交最终版本**

```bash
git add -A
git commit -m "feat(workspace): complete workspace phase 1 implementation"
```

---

## 依赖关系

```
Task 1 (Stores) → Task 2 (Layout) → Task 3 (Controller) → Task 4-6 (Surfaces)
                                                            ↓
                                              Task 7 (Shortcuts) ← Task 3
                                                            ↓
                                              Task 8 (Persistence)
                                                            ↓
                                              Task 9 (Testing)
```

---

## 自检清单

- [ ] 所有 TypeScript interfaces 对应到实际代码
- [ ] 所有快捷键功能已实现
- [ ] 所有 Surface 类型已创建组件
- [ ] CSS 变量正确使用
- [ ] LocalStorage 保存/加载正常
- [ ] 浏览器测试通过