// web-ui/js/main.js

const App = {
  async init() {
    console.log('jcode Web UI initializing...');

    // Initialize connection monitoring
    this.initConnection();

    // Register routes
    this.registerRoutes();

    // Start router
    Router.init();

    // Load initial data
    await this.loadInitialData();

    console.log('jcode Web UI ready');
  },

  initConnection() {
    // Update connection status indicator
    ConnectionStore.subscribe((state) => {
      const dot = document.getElementById('connectionDot');
      const status = document.getElementById('connectionStatus');

      if (state.connected) {
        dot.className = 'status-dot connected';
        status.textContent = 'Connected';
      } else if (state.connecting) {
        dot.className = 'status-dot connecting';
        status.textContent = 'Connecting...';
      } else {
        dot.className = 'status-dot disconnected';
        status.textContent = 'Disconnected';
      }
    });

    // Connect WebSocket
    WS.on('open', () => {
      ConnectionStore.setConnected(true);
      console.log('Connected to jcode Gateway');
    });

    WS.on('close', () => {
      ConnectionStore.setConnected(false);
      console.log('Disconnected from jcode Gateway');
    });

    WS.on('error', (error) => {
      console.error('WebSocket error:', error);
      ConnectionStore.setConnected(false);
    });

    // Try to connect
    this.checkConnection();
  },

  async checkConnection() {
    ConnectionStore.setConnecting(true);

    try {
      // Try HTTP health check
      const health = await API.health();
      console.log('Gateway health:', health);
      ConnectionStore.setConnected(true);
    } catch (e) {
      console.log('Gateway not available via HTTP, trying WebSocket...');
      ConnectionStore.setConnected(false);
    }

    // Always try WebSocket
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
      main.innerHTML = '';
      main.appendChild(this.renderSessionsPage());
    });

    // Register memory route
    Router.register('memory', () => {
      const main = document.getElementById('mainContent');
      main.innerHTML = '';
      main.appendChild(this.renderMemoryPage());
    });

    // Register settings route
    Router.register('settings', () => {
      const main = document.getElementById('mainContent');
      main.innerHTML = '';
      main.appendChild(this.renderSettingsPage());
    });

    // Set up sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page) Router.navigate(page);
      });
    });
  },

  renderSessionsPage() {
    const container = document.createElement('div');
    container.className = 'sessions-view';

    const header = document.createElement('div');
    header.className = 'session-header';
    header.innerHTML = '<h2>Sessions</h2>';
    container.appendChild(header);

    const list = document.createElement('div');
    list.className = 'session-list';
    list.id = 'sessionList';

    // Subscribe to session store
    SessionStore.subscribe(({ sessions, currentSession }) => {
      list.innerHTML = '';
      if (sessions.length === 0) {
        list.innerHTML = `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            <p>No sessions yet</p>
            <p>Start a conversation in Chat to create your first session.</p>
          </div>
        `;
        return;
      }

      sessions.forEach(session => {
        const item = document.createElement('div');
        item.className = `session-item${currentSession?.id === session.id ? ' active' : ''}`;
        item.innerHTML = `
          <div class="session-info">
            <div class="session-name">${session.name || session.id}</div>
            <div class="session-meta">${session.model || 'Unknown model'} · ${session.status || 'active'}</div>
          </div>
          <div class="session-actions">
            <button class="btn btn-sm" data-action="select" data-id="${session.id}">Select</button>
            <button class="btn btn-sm" data-action="delete" data-id="${session.id}">Delete</button>
          </div>
        `;
        list.appendChild(item);
      });
    });

    container.appendChild(list);
    return container;
  },

  renderMemoryPage() {
    const container = document.createElement('div');
    container.className = 'card';

    const title = document.createElement('h3');
    title.textContent = 'Memory Panel';
    container.appendChild(title);

    const content = document.createElement('p');
    content.className = 'mono';
    content.style.color = 'var(--text-secondary)';
    content.textContent = 'Memory visualization coming soon. This panel will show jcode memory context and knowledge graph.';
    container.appendChild(content);

    return container;
  },

  renderSettingsPage() {
    const container = document.createElement('div');
    container.className = 'settings-view';

    // Connection section
    const connectionSection = document.createElement('div');
    connectionSection.className = 'settings-section';
    connectionSection.innerHTML = `
      <h3 class="settings-section-title">Connection</h3>
      <div class="settings-field">
        <label class="settings-label">Gateway URL</label>
        <input type="text" class="settings-input" id="gatewayUrl" value="http://127.0.0.1:7643" placeholder="http://127.0.0.1:7643">
      </div>
      <div class="settings-field">
        <label class="settings-label">Status</label>
        <div id="settingsConnectionStatus">
          <span class="status-dot disconnected"></span>
          <span>Disconnected</span>
        </div>
      </div>
      <button class="btn" id="reconnectBtn">Reconnect</button>
    `;
    container.appendChild(connectionSection);

    // Model section
    const modelSection = document.createElement('div');
    modelSection.className = 'settings-section';
    modelSection.innerHTML = `
      <h3 class="settings-section-title">Model</h3>
      <div class="settings-field">
        <label class="settings-label">Default Model</label>
        <select class="settings-input" id="defaultModel">
          <option value="claude-opus-4-7">Opus 4</option>
          <option value="claude-sonnet-4-7">Sonnet 4</option>
          <option value="claude-opus-4">Opus</option>
          <option value="claude-sonnet-4">Sonnet</option>
        </select>
      </div>
    `;
    container.appendChild(modelSection);

    // About section
    const aboutSection = document.createElement('div');
    aboutSection.className = 'settings-section';
    aboutSection.innerHTML = `
      <h3 class="settings-section-title">About</h3>
      <p style="color: var(--text-secondary)">jcode Web UI v1.0.0</p>
      <p class="mono" style="color: var(--text-tertiary); font-size: var(--text-sm)">Pure frontend + Gateway API</p>
    `;
    container.appendChild(aboutSection);

    // Event listeners
    setTimeout(() => {
      const reconnectBtn = document.getElementById('reconnectBtn');
      if (reconnectBtn) {
        reconnectBtn.addEventListener('click', () => {
          WS.disconnect();
          setTimeout(() => WS.connect(), 100);
        });
      }

      // Update connection status
      ConnectionStore.subscribe((state) => {
        const statusEl = document.getElementById('settingsConnectionStatus');
        if (statusEl) {
          statusEl.innerHTML = `
            <span class="status-dot ${state.connected ? 'connected' : 'disconnected'}"></span>
            <span>${state.connected ? 'Connected' : 'Disconnected'}</span>
          `;
        }
      });
    }, 0);

    return container;
  },

  async loadInitialData() {
    try {
      // Load sessions
      const sessions = await API.listSessions();
      SessionStore.setSessions(sessions.sessions || []);
    } catch (e) {
      console.log('Could not load initial data:', e.message);
    }
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());