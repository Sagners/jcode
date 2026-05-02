# jcode Web UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desktop-capable Web UI for jcode with chat interaction, session management, and workbench features, using pure frontend communicating via Gateway API.

**Architecture:** Pure HTML/CSS/JS SPA that connects to jcode Gateway (port 7643) via WebSocket and HTTP. Follows official design system with mint accent (#4DD9A6) on dark background (#0F0F14).

**Tech Stack:** Vanilla HTML/CSS/JS, native WebSocket API, native fetch API, Google Fonts (Inter, Roboto Mono)

---

## File Structure

```
web-ui/
├── index.html              # Main entry - SPA shell
├── css/
│   ├── variables.css       # CSS variables (official design system)
│   ├── base.css            # Reset, typography, layout
│   ├── components.css      # Reusable UI components
│   └── pages/
│       ├── chat.css        # Chat page styles
│       ├── sessions.css    # Sessions page styles
│       └── settings.css    # Settings page styles
├── js/
│   ├── main.js             # App entry, router init
│   ├── api.js              # Gateway HTTP API client
│   ├── websocket.js        # WebSocket connection manager
│   ├── router.js           # Hash-based SPA routing
│   ├── components/
│   │   ├── header.js       # Header with connection status
│   │   ├── sidebar.js      # Navigation sidebar
│   │   ├── chat.js         # Chat view controller
│   │   ├── message.js      # Message bubble component
│   │   ├── composer.js     # Message input composer
│   │   └── tool-chain.js   # Tool execution chain display
│   └── stores/
│       ├── connection.js   # Gateway connection state
│       ├── session.js      # Current session state
│       └── messages.js     # Chat messages store
└── assets/
    └── icons/              # SVG icons (inline)
```

---

## Task 1: CSS Design System Foundation

**Files:**
- Create: `web-ui/css/variables.css`
- Create: `web-ui/css/base.css`
- Create: `web-ui/css/components.css`
- Create: `web-ui/css/pages/chat.css`

- [ ] **Step 1: Create variables.css with official design tokens**

```css
/* web-ui/css/variables.css */
:root {
  /* Official Colors from jcode-mobile-design-spec.md */
  --bg: #0F0F14;
  --surface: #1A1A1F;
  --surface-elevated: #242429;
  --border: rgba(255, 255, 255, 0.08);
  --accent: #4DD9A6;
  --accent-tint: rgba(77, 217, 166, 0.15);
  --text-primary: rgba(255, 255, 255, 0.92);
  --text-secondary: rgba(255, 255, 255, 0.55);
  --text-tertiary: rgba(255, 255, 255, 0.35);
  --warning: #F59E0B;
  --error: #D94D59;

  /* Typography */
  --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Roboto Mono', 'SF Mono', Consolas, monospace;

  /* Font Sizes */
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 14px;
  --text-lg: 15px;
  --text-xl: 17px;
  --text-2xl: 22px;
  --text-3xl: 28px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;

  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

- [ ] **Step 2: Create base.css with reset and typography**

```css
/* web-ui/css/base.css */
@import './variables.css';

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-ui);
  background: var(--bg);
  color: var(--text-primary);
  line-height: 1.5;
  min-height: 100vh;
}

/* Links */
a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--surface);
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
```

- [ ] **Step 3: Create components.css with reusable UI components**

```css
/* web-ui/css/components.css */

/* Layout */
.app-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: 56px 1fr;
  height: 100vh;
}

.header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.sidebar {
  padding: var(--space-4);
  background: var(--surface);
  border-right: 1px solid var(--border);
  overflow-y: auto;
}

.main-content {
  overflow-y: auto;
  padding: var(--space-4);
}

/* Connection Status */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.connected { background: var(--accent); }
.status-dot.connecting { background: var(--warning); animation: pulse 1s infinite; }
.status-dot.disconnected { background: var(--error); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn:hover {
  border-color: var(--accent);
  background: var(--accent-tint);
}

.btn.primary {
  background: var(--accent);
  color: var(--bg);
  border-color: var(--accent);
}

.btn.primary:hover {
  background: #3fc995;
}

/* Cards */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.card.elevated {
  background: var(--surface-elevated);
}

/* Navigation Items */
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-item:hover {
  background: var(--surface-elevated);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-tint);
  color: var(--accent);
}

/* Code/Mono Text */
.mono {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-2);
  border-radius: 999px;
  font-size: var(--text-xs);
  font-weight: 500;
}

.badge.accent {
  background: var(--accent-tint);
  color: var(--accent);
}

.badge.warning {
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning);
}

.badge.error {
  background: rgba(217, 77, 89, 0.15);
  color: var(--error);
}
```

- [ ] **Step 4: Create chat.css for chat page styles**

```css
/* web-ui/css/pages/chat.css */

/* Chat Container */
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 800px;
  margin: 0 auto;
}

/* Messages Area */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* Message Bubbles */
.message {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

.message-content {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  line-height: 1.6;
}

.message.user .message-content {
  background: var(--accent-tint);
  border: 1px solid var(--accent);
}

.message.assistant .message-content {
  background: var(--surface-elevated);
  border: 1px solid var(--border);
}

.message-role {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-bottom: var(--space-1);
}

/* Tool Chain */
.tool-chain {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-top: var(--space-2);
  overflow: hidden;
}

.tool-chain-summary {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--surface);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.tool-chain-summary:hover {
  background: var(--surface-elevated);
}

.tool-indicator {
  color: var(--accent);
}

.tool-chain-detail {
  padding: var(--space-3);
  background: var(--bg);
  border-top: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

/* Live Tool (in progress) */
.tool-live {
  padding: var(--space-2) var(--space-3);
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-sm);
  margin-top: var(--space-2);
}

.tool-indicator-live {
  color: var(--warning);
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Composer */
.composer {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.composer-input {
  flex: 1;
  padding: var(--space-3);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-base);
  resize: none;
  min-height: 44px;
  max-height: 200px;
}

.composer-input:focus {
  outline: none;
  border-color: var(--accent);
}

.composer-input::placeholder {
  color: var(--text-tertiary);
}

.composer-send {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
}
```

- [ ] **Step 5: Commit**

```bash
cd E:/Projects/jcode
git add web-ui/css/
git commit -m "web-ui: add CSS design system foundation

- Official design tokens from jcode-mobile-design-spec
- Base styles with reset and typography
- Reusable component styles
- Chat page styles
"
```

---

## Task 2: HTML Shell and Router

**Files:**
- Create: `web-ui/index.html`
- Create: `web-ui/js/router.js`

- [ ] **Step 1: Create index.html main entry point**

```html
<!-- web-ui/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>jcode Web UI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/pages/chat.css">
</head>
<body>
  <div class="app-layout">
    <!-- Header -->
    <header class="header">
      <div class="header-brand">
        <strong>jcode</strong>
      </div>
      <div class="header-center">
        <span class="status-dot disconnected" id="connectionDot"></span>
        <span id="connectionStatus">Disconnected</span>
      </div>
      <div class="header-actions">
        <select id="modelSelect" class="model-select">
          <option value="claude-opus-4-7">Opus 4</option>
          <option value="claude-sonnet-4-7">Sonnet 4</option>
          <option value="claude-opus-4">Opus</option>
        </select>
      </div>
    </header>

    <!-- Sidebar -->
    <nav class="sidebar" id="sidebar">
      <div class="nav-item active" data-page="chat">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Chat</span>
      </div>
      <div class="nav-item" data-page="sessions">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
        <span>Sessions</span>
      </div>
      <div class="nav-item" data-page="memory">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
        <span>Memory</span>
      </div>
      <div class="nav-item" data-page="settings">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        <span>Settings</span>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content" id="mainContent">
      <!-- Dynamic content loaded here -->
    </main>
  </div>

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
</html>
```

- [ ] **Step 2: Create router.js for SPA routing**

```javascript
// web-ui/js/router.js

const Router = {
  routes: {},
  currentPage: null,

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  register(page, handler) {
    this.routes[page] = handler;
  },

  navigate(page) {
    window.location.hash = page;
  },

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'chat';
    const page = Object.keys(this.routes).includes(hash) ? hash : 'chat';

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Call page handler
    if (this.routes[page] && page !== this.currentPage) {
      this.routes[page]();
      this.currentPage = page;
    }
  }
};

window.Router = Router;
```

- [ ] **Step 3: Commit**

```bash
cd E:/Projects/jcode
git add web-ui/index.html web-ui/js/router.js
git commit -m "web-ui: add HTML shell and SPA router

- Main HTML entry with official design layout
- Header with connection status
- Sidebar navigation
- Hash-based SPA routing
"
```

---

## Task 3: Gateway API Client

**Files:**
- Create: `web-ui/js/api.js`
- Create: `web-ui/js/websocket.js`

- [ ] **Step 1: Create api.js for HTTP API client**

```javascript
// web-ui/js/api.js

const API = {
  baseUrl: 'http://127.0.0.1:7643',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  // Health check
  async health() {
    return this.request('/api/health');
  },

  // Session operations
  async listSessions() {
    return this.request('/api/sessions');
  },

  async createSession(params = {}) {
    return this.request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getSession(sessionId) {
    return this.request(`/api/sessions/${sessionId}`);
  },

  async deleteSession(sessionId) {
    return this.request(`/api/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  // Messages
  async sendMessage(sessionId, content) {
    return this.request(`/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async getMessages(sessionId) {
    return this.request(`/api/sessions/${sessionId}/messages`);
  },
};

window.API = API;
```

- [ ] **Step 2: Create websocket.js for WebSocket connection**

```javascript
// web-ui/js/websocket.js

const WS = {
  socket: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  listeners: new Map(),

  connect() {
    const wsUrl = 'ws://127.0.0.1:7643/ws';
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      ConnectionStore.setConnected(true);
      this.emit('open');
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      ConnectionStore.setConnected(false);
      this.emit('close');
      this.attemptReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('message', data);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };
  },

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connect();
    }, delay);
  },

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  },

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  },

  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  },

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
};

window.WS = WS;
```

- [ ] **Step 3: Commit**

```bash
cd E:/Projects/jcode
git add web-ui/js/api.js web-ui/js/websocket.js
git commit -m "web-ui: add Gateway API client and WebSocket manager

- HTTP API client for REST operations
- WebSocket connection with auto-reconnect
- Event-based message handling
"
```

---

## Task 4: State Stores

**Files:**
- Create: `web-ui/js/stores/connection.js`
- Create: `web-ui/js/stores/session.js`
- Create: `web-ui/js/stores/messages.js`

- [ ] **Step 1: Create connection.js store**

```javascript
// web-ui/js/stores/connection.js

const ConnectionStore = {
  connected: false,
  listeners: [],

  setConnected(value) {
    this.connected = value;
    this.notify();
  },

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notify() {
    this.listeners.forEach(cb => cb(this.connected));
  }
};

window.ConnectionStore = ConnectionStore;
```

- [ ] **Step 2: Create session.js store**

```javascript
// web-ui/js/stores/session.js

const SessionStore = {
  sessions: [],
  currentSession: null,
  listeners: [],

  setSessions(sessions) {
    this.sessions = sessions;
    this.notify();
  },

  setCurrentSession(session) {
    this.currentSession = session;
    this.notify();
  },

  addSession(session) {
    this.sessions.push(session);
    this.notify();
  },

  removeSession(sessionId) {
    this.sessions = this.sessions.filter(s => s.id !== sessionId);
    if (this.currentSession?.id === sessionId) {
      this.currentSession = null;
    }
    this.notify();
  },

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notify() {
    this.listeners.forEach(cb => cb({
      sessions: this.sessions,
      currentSession: this.currentSession
    }));
  }
};

window.SessionStore = SessionStore;
```

- [ ] **Step 3: Create messages.js store**

```javascript
// web-ui/js/stores/messages.js

const MessagesStore = {
  messages: [],
  listeners: [],

  setMessages(messages) {
    this.messages = messages;
    this.notify();
  },

  addMessage(message) {
    this.messages.push(message);
    this.notify();
  },

  updateMessage(id, updates) {
    const index = this.messages.findIndex(m => m.id === id);
    if (index !== -1) {
      this.messages[index] = { ...this.messages[index], ...updates };
      this.notify();
    }
  },

  clearMessages() {
    this.messages = [];
    this.notify();
  },

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notify() {
    this.listeners.forEach(cb => cb(this.messages));
  }
};

window.MessagesStore = MessagesStore;
```

- [ ] **Step 4: Commit**

```bash
cd E:/Projects/jcode
git add web-ui/js/stores/
git commit -m "web-ui: add state management stores

- ConnectionStore for gateway connection state
- SessionStore for session management
- MessagesStore for chat messages
- Event-based subscription pattern
"
```

---

## Task 5: Chat Components

**Files:**
- Create: `web-ui/js/components/message.js`
- Create: `web-ui/js/components/composer.js`
- Create: `web-ui/js/components/tool-chain.js`
- Create: `web-ui/js/components/chat.js`

- [ ] **Step 1: Create message.js component**

```javascript
// web-ui/js/components/message.js

const MessageComponent = {
  render(message, container) {
    const div = document.createElement('div');
    div.className = `message ${message.role}`;
    div.dataset.messageId = message.id;

    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = this.formatContent(message.content);

    const role = document.createElement('div');
    role.className = 'message-role';
    role.textContent = message.role === 'user' ? 'You' : 'jcode';

    div.appendChild(role);
    div.appendChild(content);

    // Render tool chains if present
    if (message.tools && message.tools.length > 0) {
      const toolChain = ToolChainComponent.render(message.tools);
      div.appendChild(toolChain);
    }

    container.appendChild(div);
  },

  formatContent(content) {
    // Basic markdown-like formatting
    return content
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }
};

window.MessageComponent = MessageComponent;
```

- [ ] **Step 2: Create composer.js component**

```javascript
// web-ui/js/components/composer.js

const ComposerComponent = {
  container: null,

  init() {
    this.container = document.createElement('div');
    this.container.className = 'composer';

    const textarea = document.createElement('textarea');
    textarea.className = 'composer-input';
    textarea.placeholder = 'Message jcode...';
    textarea.rows = 1;

    const sendBtn = document.createElement('button');
    sendBtn.className = 'btn composer-send';
    sendBtn.innerHTML = '&#8593;';
    sendBtn.title = 'Send message';

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    });

    sendBtn.addEventListener('click', () => this.send());

    // Auto-resize textarea
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    });

    this.container.appendChild(textarea);
    this.container.appendChild(sendBtn);
  },

  getElement() {
    return this.container;
  },

  send() {
    const textarea = this.container.querySelector('.composer-input');
    const content = textarea.value.trim();

    if (!content) return;

    // Emit custom event for chat.js to handle
    const event = new CustomEvent('composer:send', { detail: { content } });
    this.container.dispatchEvent(event);

    textarea.value = '';
    textarea.style.height = 'auto';
  }
};

window.ComposerComponent = ComposerComponent;
```

- [ ] **Step 3: Create tool-chain.js component**

```javascript
// web-ui/js/components/tool-chain.js

const ToolChainComponent = {
  render(tools) {
    const container = document.createElement('div');
    container.className = 'tool-chains';

    tools.forEach(tool => {
      const toolDiv = document.createElement('div');
      toolDiv.className = 'tool-chain';

      const summary = document.createElement('details');
      summary.className = 'tool-chain-summary';

      const summaryContent = document.createElement('summary');
      summaryContent.innerHTML = `
        <span class="tool-indicator">●</span>
        ${tool.name}
        <span class="tool-count">${tool.inputs ? Object.keys(tool.inputs).length : 0} params</span>
      `;

      const detail = document.createElement('div');
      detail.className = 'tool-chain-detail mono';
      detail.innerHTML = this.formatToolDetail(tool);

      summary.appendChild(summaryContent);
      summary.appendChild(detail);
      toolDiv.appendChild(summary);
      container.appendChild(toolDiv);
    });

    return container;
  },

  formatToolDetail(tool) {
    let html = '';
    html += `<div class="tool-detail-line"><span class="tool-indicator">●</span> ${tool.name}</div>`;

    if (tool.inputs) {
      html += `<div class="tool-meta">${JSON.stringify(tool.inputs)}</div>`;
    }

    if (tool.output) {
      html += `<div class="tool-detail-out">${this.escapeHtml(String(tool.output))}</div>`;
    }

    return html;
  },

  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
};

window.ToolChainComponent = ToolChainComponent;
```

- [ ] **Step 4: Create chat.js controller**

```javascript
// web-ui/js/components/chat.js

const ChatController = {
  container: null,
  messagesContainer: null,

  init() {
    this.container = document.createElement('div');
    this.container.className = 'chat-view';

    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'chat-messages';
    this.container.appendChild(this.messagesContainer);

    // Initialize composer
    ComposerComponent.init();
    this.container.appendChild(ComposerComponent.getElement());

    // Listen for send events
    ComposerComponent.getElement().addEventListener('composer:send', (e) => {
      this.handleSend(e.detail.content);
    });

    // Subscribe to messages store
    MessagesStore.subscribe((messages) => {
      this.renderMessages(messages);
    });

    // Load initial messages
    this.loadMessages();
  },

  getElement() {
    return this.container;
  },

  async loadMessages() {
    const session = SessionStore.currentSession;
    if (!session) return;

    try {
      const data = await API.getMessages(session.id);
      MessagesStore.setMessages(data.messages || []);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  },

  async handleSend(content) {
    const session = SessionStore.currentSession;
    if (!session) {
      alert('Please select a session first');
      return;
    }

    // Add user message
    MessagesStore.addMessage({
      id: Date.now().toString(),
      role: 'user',
      content,
    });

    // Send to API
    try {
      const response = await API.sendMessage(session.id, content);
      if (response.message) {
        MessagesStore.addMessage(response.message);
      }
    } catch (e) {
      console.error('Failed to send message:', e);
      alert('Failed to send message');
    }
  },

  renderMessages(messages) {
    this.messagesContainer.innerHTML = '';
    messages.forEach(msg => {
      MessageComponent.render(msg, this.messagesContainer);
    });

    // Scroll to bottom
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
};

window.ChatController = ChatController;
```

- [ ] **Step 5: Commit**

```bash
cd E:/Projects/jcode
git add web-ui/js/components/
git commit -m "web-ui: add chat components

- MessageComponent for rendering message bubbles
- ComposerComponent for message input
- ToolChainComponent for tool execution display
- ChatController for chat view management
"
```

---

## Task 6: Main Entry Point

**Files:**
- Create: `web-ui/js/main.js`
- Modify: `web-ui/index.html` (link main.js)

- [ ] **Step 1: Create main.js application entry**

```javascript
// web-ui/js/main.js

const App = {
  async init() {
    console.log('jcode Web UI initializing...');

    // Initialize connection
    await this.initConnection();

    // Register routes
    this.registerRoutes();

    // Start router
    Router.init();

    console.log('jcode Web UI ready');
  },

  async initConnection() {
    // Update connection status indicator
    ConnectionStore.subscribe((connected) => {
      const dot = document.getElementById('connectionDot');
      const status = document.getElementById('connectionStatus');

      if (connected) {
        dot.className = 'status-dot connected';
        status.textContent = 'Connected';
      } else {
        dot.className = 'status-dot disconnected';
        status.textContent = 'Disconnected';
      }
    });

    // Try to connect
    try {
      const health = await API.health();
      ConnectionStore.setConnected(true);
    } catch (e) {
      console.log('Gateway not available, will retry via WebSocket');
      ConnectionStore.setConnected(false);
    }

    // Connect WebSocket
    WS.on('open', () => ConnectionStore.setConnected(true));
    WS.on('close', () => ConnectionStore.setConnected(false));
    WS.connect();
  },

  registerRoutes() {
    // Register chat route
    Router.register('chat', () => {
      const main = document.getElementById('mainContent');
      main.innerHTML = '';
      ChatController.init();
      main.appendChild(ChatController.getElement());
    });

    // Register sessions route
    Router.register('sessions', () => {
      const main = document.getElementById('mainContent');
      main.innerHTML = '<div class="card"><p>Sessions page - coming soon</p></div>';
    });

    // Register memory route
    Router.register('memory', () => {
      const main = document.getElementById('mainContent');
      main.innerHTML = '<div class="card"><p>Memory page - coming soon</p></div>';
    });

    // Register settings route
    Router.register('settings', () => {
      const main = document.getElementById('mainContent');
      main.innerHTML = '<div class="card"><p>Settings page - coming soon</p></div>';
    });

    // Set up sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page) Router.navigate(page);
      });
    });
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
```

- [ ] **Step 2: Commit**

```bash
cd E:/Projects/jcode
git add web-ui/js/main.js
git commit -m "web-ui: add main application entry point

- App initialization sequence
- Route registration
- Connection status handling
- Sidebar navigation setup
"
```

---

## Task 7: Additional CSS Pages (Sessions, Settings)

**Files:**
- Create: `web-ui/css/pages/sessions.css`
- Create: `web-ui/css/pages/settings.css`

- [ ] **Step 1: Create sessions.css**

```css
/* web-ui/css/pages/sessions.css */

.sessions-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 600px;
  margin: 0 auto;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.session-item:hover {
  border-color: var(--accent);
  background: var(--accent-tint);
}

.session-item.active {
  border-color: var(--accent);
  background: var(--accent-tint);
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.session-name {
  font-weight: 500;
}

.session-meta {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.session-actions {
  display: flex;
  gap: var(--space-2);
}
```

- [ ] **Step 2: Create settings.css**

```css
/* web-ui/css/pages/settings.css */

.settings-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 600px;
  margin: 0 auto;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.settings-section-title {
  font-size: var(--text-lg);
  font-weight: 600;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border);
}

.settings-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.settings-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.settings-input {
  padding: var(--space-3);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--text-base);
}

.settings-input:focus {
  outline: none;
  border-color: var(--accent);
}
```

- [ ] **Step 3: Add imports to index.html head**

```html
  <!-- Add these link tags in head after existing CSS links -->
  <link rel="stylesheet" href="css/pages/sessions.css">
  <link rel="stylesheet" href="css/pages/settings.css">
```

- [ ] **Step 4: Commit**

```bash
cd E:/Projects/jcode
git add web-ui/css/pages/ web-ui/index.html
git commit -m "web-ui: add sessions and settings page styles

- Sessions list page styles
- Settings page styles
- Import CSS in index.html
"
```

---

## Task 8: Run and Test

**Files:**
- Verify all files exist
- Test in browser

- [ ] **Step 1: Verify all files created**

```bash
cd E:/Projects/jcode
find web-ui -type f | sort
```

Expected output:
```
web-ui/assets/icons/
web-ui/css/base.css
web-ui/css/components.css
web-ui/css/variables.css
web-ui/css/pages/chat.css
web-ui/css/pages/settings.css
web-ui/css/pages/sessions.css
web-ui/index.html
web-ui/js/api.js
web-ui/js/main.js
web-ui/js/router.js
web-ui/js/websocket.js
web-ui/js/components/chat.js
web-ui/js/components/composer.js
web-ui/js/components/message.js
web-ui/js/components/tool-chain.js
web-ui/js/stores/connection.js
web-ui/js/stores/messages.js
web-ui/js/stores/session.js
```

- [ ] **Step 2: Open in browser**

Open `web-ui/index.html` directly in a browser (file:// protocol) or serve with a local server:

```bash
# Option 1: Python simple server
cd E:/Projects/jcode/web-ui
python -m http.server 8080

# Option 2: Node serve
npx serve .
```

Then open `http://localhost:8080` in browser.

- [ ] **Step 3: Verify in browser**

1. Page loads without errors
2. Connection status shows "Disconnected" (expected if jcode not running)
3. Sidebar navigation works
4. Chat view renders with composer

- [ ] **Step 4: Commit all changes**

```bash
cd E:/Projects/jcode
git add -A
git commit -m "web-ui: complete Phase 1 implementation

- Official design system with mint accent (#4DD9A6)
- SPA routing with hash-based navigation
- Gateway API client and WebSocket manager
- State management with event-based stores
- Chat UI with message bubbles and tool chain display
- Responsive layout with header, sidebar, and main content

Ready for testing with jcode Gateway"
```

---

## Verification Checklist

- [ ] All CSS files use official design tokens from variables.css
- [ ] HTML uses semantic elements
- [ ] WebSocket has auto-reconnect logic
- [ ] State stores use subscription pattern
- [ ] Chat can display messages with markdown formatting
- [ ] Tool chains render collapsed with expandable details
- [ ] Router works with browser back/forward
- [ ] Layout is responsive (desktop and tablet)

---

## Next Steps (Future Tasks)

1. **Sessions Page Implementation**
   - Session list with status indicators
   - Create/switch/delete sessions
   - Session persistence via API

2. **Memory Panel**
   - Memory context visualization
   - Memory graph display

3. **Settings Page**
   - Gateway URL configuration
   - Model selection

4. **Workbench Integration**
   - Workspace management from Config Workbench
   - Provider configuration display