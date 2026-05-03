// web-ui/js/components/surfaces/SettingsSurface.js

const SettingsSurface = {
  activeTab: 'general',

  render(surface) {
    const container = document.createElement('div');
    container.className = 'settings-body';
    container.innerHTML = `
      <div class="settings-tabs">
        <button class="settings-tab active" data-tab="general">General</button>
        <button class="settings-tab" data-tab="connection">Connection</button>
        <button class="settings-tab" data-tab="model">Model</button>
        <button class="settings-tab" data-tab="shortcuts">Shortcuts</button>
        <button class="settings-tab" data-tab="about">About</button>
      </div>
      <div class="settings-content" id="settingsContent">
        <!-- Tab content rendered dynamically -->
      </div>
    `;

    // Add event listeners for tabs
    container.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName, container);
      });
    });

    // Render initial tab
    this.switchTab(this.activeTab, container);

    return container;
  },

  switchTab(tabName, container) {
    this.activeTab = tabName;

    // Update active tab styling
    container.querySelectorAll('.settings-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Render tab content
    const content = container.querySelector('#settingsContent');
    content.innerHTML = this.renderTabContent(tabName);

    // Add event listeners to new content
    this.attachTabListeners(content, tabName);
  },

  renderTabContent(tabName) {
    switch (tabName) {
      case 'general':
        return this.renderGeneralTab();
      case 'connection':
        return this.renderConnectionTab();
      case 'model':
        return this.renderModelTab();
      case 'shortcuts':
        return this.renderShortcutsTab();
      case 'about':
        return this.renderAboutTab();
      default:
        return '<p>Unknown tab</p>';
    }
  },

  renderGeneralTab() {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">General Settings</h3>

        <div class="settings-field">
          <label class="settings-label">Theme</label>
          <select class="settings-input" id="settingTheme">
            <option value="dark">Dark</option>
            <option value="light">Light (Coming Soon)</option>
            <option value="system">System</option>
          </select>
        </div>

        <div class="settings-field">
          <label class="settings-label">Font Size</label>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <input type="range" class="settings-input settings-range"
              id="settingFontSize" min="12" max="18" value="14">
            <span class="settings-range-value" id="fontSizeValue">14px</span>
          </div>
        </div>

        <div class="settings-field">
          <label class="settings-label">
            <input type="checkbox" id="settingAutoSave" checked>
            Auto-save workspace state
          </label>
        </div>

        <div class="settings-field">
          <label class="settings-label">
            <input type="checkbox" id="settingShowLineNumbers" checked>
            Show line numbers in code blocks
          </label>
        </div>
      </div>
    `;
  },

  renderConnectionTab() {
    const connectionStatus = ConnectionStore.connected ? 'Connected' : 'Disconnected';
    const statusClass = ConnectionStore.connected ? 'connected' : 'disconnected';

    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Connection</h3>

        <div class="settings-field">
          <label class="settings-label">Gateway URL</label>
          <input type="text" class="settings-input" id="settingGatewayUrl"
            value="ws://127.0.0.1:7643/ws" placeholder="ws://127.0.0.1:7643/ws">
        </div>

        <div class="settings-field">
          <label class="settings-label">Status</label>
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            <span class="status-dot ${statusClass}"></span>
            <span>${connectionStatus}</span>
          </div>
        </div>

        <div class="settings-field">
          <label class="settings-label">Auto-reconnect</label>
          <select class="settings-input" id="settingAutoReconnect">
            <option value="always">Always</option>
            <option value="wifi">Only on Wi-Fi</option>
            <option value="never">Never</option>
          </select>
        </div>

        <div class="settings-field">
          <label class="settings-label">Connection Timeout (seconds)</label>
          <input type="number" class="settings-input" id="settingTimeout"
            value="30" min="5" max="120">
        </div>

        <button class="btn" id="reconnectBtn" style="margin-top: var(--space-4);">
          Reconnect
        </button>
      </div>
    `;
  },

  renderModelTab() {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Model Configuration</h3>

        <div class="settings-field">
          <label class="settings-label">Default Model</label>
          <select class="settings-input" id="settingDefaultModel">
            <option value="claude-opus-4-7">Claude Opus 4</option>
            <option value="claude-sonnet-4-7">Claude Sonnet 4</option>
            <option value="claude-opus-4">Claude Opus 4 (Legacy)</option>
            <option value="claude-sonnet-4">Claude Sonnet 4 (Legacy)</option>
          </select>
        </div>

        <div class="settings-field">
          <label class="settings-label">Temperature</label>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <input type="range" class="settings-input settings-range"
              id="settingTemperature" min="0" max="100" value="70">
            <span class="settings-range-value" id="temperatureValue">0.7</span>
          </div>
        </div>

        <div class="settings-field">
          <label class="settings-label">Max Tokens</label>
          <input type="number" class="settings-input" id="settingMaxTokens"
            value="8192" min="256" max="200000" step="256">
        </div>

        <div class="settings-field">
          <label class="settings-label">
            <input type="checkbox" id="settingStreamResponse" checked>
            Enable streaming responses
          </label>
        </div>
      </div>
    `;
  },

  renderShortcutsTab() {
    const shortcuts = [
      { action: 'New Session', key: 'Ctrl+N' },
      { action: 'Toggle Files', key: 'Ctrl+B' },
      { action: 'Open Settings', key: 'Ctrl+,' },
      { action: 'New Lane', key: 'Ctrl+L' },
      { action: 'Close Surface', key: 'Ctrl+W' },
      { action: 'Next Surface', key: 'Ctrl+Tab' },
      { action: 'Prev Surface', key: 'Ctrl+Shift+Tab' },
      { action: 'Quick Switch Session 1-9', key: 'Ctrl+1-9' },
    ];

    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Keyboard Shortcuts</h3>

        <div class="shortcuts-list">
          ${shortcuts.map(s => `
            <div class="shortcut-item">
              <span class="shortcut-action">${s.action}</span>
              <span class="shortcut-key">${s.key}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderAboutTab() {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">About</h3>

        <div class="about-title">jcode Web UI</div>
        <div class="about-version">Version 1.0.0</div>

        <p class="about-description">
          A modern web interface for jcode, enabling AI-assisted coding through a
          intuitive lane-based workspace. Connect to the jcode gateway to start
          your coding sessions.
        </p>

        <div style="margin-top: var(--space-4);">
          <div class="settings-field">
            <label class="settings-label">Gateway Version</label>
            <span id="gatewayVersion" style="font-family: var(--font-mono); color: var(--text-secondary);">
              Loading...
            </span>
          </div>
        </div>

        <div class="about-links" style="margin-top: var(--space-6);">
          <a href="https://github.com/example/jcode" class="about-link" target="_blank">GitHub</a>
          <a href="https://jcode.dev/docs" class="about-link" target="_blank">Documentation</a>
          <a href="https://jcode.dev/discord" class="about-link" target="_blank">Discord</a>
        </div>
      </div>
    `;
  },

  attachTabListeners(content, tabName) {
    // General tab listeners
    if (tabName === 'general') {
      const fontSizeSlider = content.querySelector('#settingFontSize');
      const fontSizeValue = content.querySelector('#fontSizeValue');
      if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', (e) => {
          fontSizeValue.textContent = e.target.value + 'px';
          document.documentElement.style.setProperty('--text-base', (e.target.value - 2) + 'px');
        });
      }
    }

    // Connection tab listeners
    if (tabName === 'connection') {
      const reconnectBtn = content.querySelector('#reconnectBtn');
      if (reconnectBtn) {
        reconnectBtn.addEventListener('click', () => {
          this.showToast('Reconnecting...');
          WS.disconnect();
          setTimeout(() => WS.connect(), 500);
        });
      }

      // Update gateway version
      const versionEl = content.querySelector('#gatewayVersion');
      if (versionEl) {
        this.fetchGatewayVersion().then(version => {
          versionEl.textContent = version || 'Unknown';
        });
      }
    }

    // Model tab listeners
    if (tabName === 'model') {
      const tempSlider = content.querySelector('#settingTemperature');
      const tempValue = content.querySelector('#temperatureValue');
      if (tempSlider) {
        tempSlider.addEventListener('input', (e) => {
          tempValue.textContent = (e.target.value / 100).toFixed(2);
        });
      }
    }

    // Subscribe to connection store for real-time status updates
    if (tabName === 'connection') {
      ConnectionStore.subscribe((state) => {
        const statusEl = content.querySelector('.status-dot');
        const statusText = content.querySelector('.settings-field:nth-child(2) span:last-child');
        if (statusEl) {
          statusEl.className = 'status-dot ' + (state.connected ? 'connected' : 'disconnected');
        }
        if (statusText) {
          statusText.textContent = state.connected ? 'Connected' : 'Disconnected';
        }
      });
    }
  },

  async fetchGatewayVersion() {
    try {
      const response = await fetch('http://127.0.0.1:7643/health');
      const data = await response.json();
      return data.version || 'Unknown';
    } catch (e) {
      return 'Gateway unreachable';
    }
  },

  showToast(message, isError = false) {
    // Remove existing toast
    const existingToast = document.querySelector('.settings-toast');
    if (existingToast) existingToast.remove();

    // Create toast
    const toast = document.createElement('div');
    toast.className = `settings-toast ${isError ? 'error' : ''}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Show toast
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

window.SettingsSurface = SettingsSurface;