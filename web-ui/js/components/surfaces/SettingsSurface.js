// web-ui/js/components/surfaces/SettingsSurface.js

const SettingsSurface = {
  activeTab: 'general',
  cleanup: null,

  render(surface) {
    this.teardown();
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
    container.__surfaceCleanup = () => this.teardown();

    return container;
  },

  switchTab(tabName, container) {
    this.activeTab = tabName;
    this.teardown();

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
    const snapshot = ConnectionStore.snapshot();
    const connectionStatus = snapshot.connected ? 'Connected' : snapshot.gatewayReachable ? 'Needs pairing' : 'Gateway offline';
    const statusClass = snapshot.connected ? 'connected' : snapshot.connecting ? 'connecting' : 'disconnected';
    const desktop = snapshot.desktop || DesktopBridge?.snapshot?.() || {};
    const runtimeLabel = desktop.isTauri ? 'Tauri desktop' : 'Browser';
    const jcodePath = desktop.jcodePath || 'Not detected on PATH';

    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Connection</h3>

        <div class="settings-field">
          <label class="settings-label">Gateway HTTP URL</label>
          <input type="text" class="settings-input" id="settingGatewayUrl"
            value="${API.baseUrl}" placeholder="http://127.0.0.1:7643">
        </div>

        <div class="settings-field">
          <label class="settings-label">Status</label>
          <div class="connection-status-row">
            <span class="status-dot ${statusClass}"></span>
            <span id="connectionStatusLabel">${connectionStatus}</span>
            <span class="connection-detail" id="connectionDetail">${snapshot.detail || ''}</span>
          </div>
        </div>

        <div class="settings-field">
          <label class="settings-label">Pairing Code</label>
          <div class="pairing-row">
            <input type="text" class="settings-input pairing-code-input" id="pairingCode"
              inputmode="numeric" maxlength="6" placeholder="Run jcode pair, then enter code">
            <button class="btn primary" id="pairBtn">Pair</button>
          </div>
          <p class="settings-help">Pairing stores a local browser token. Guest WebSocket access is disabled by default.</p>
        </div>

        <div class="settings-field">
          <label class="settings-label">Saved Token</label>
          <div class="token-row">
            <input type="password" class="settings-input" id="savedToken"
              value="${localStorage.getItem('jcode_auth_token') || ''}" placeholder="64-character token">
            <button class="btn" id="saveTokenBtn">Save</button>
            <button class="btn" id="clearTokenBtn">Clear</button>
          </div>
        </div>

        <button class="btn" id="reconnectBtn" style="margin-top: var(--space-4);">
          Reconnect
        </button>
      </div>

      <div class="settings-section">
        <h3 class="settings-section-title">Desktop Runtime</h3>
        <div class="desktop-runtime-grid">
          <div class="runtime-item">
            <span class="runtime-label">Shell</span>
            <span class="runtime-value">${this.escapeHtml(runtimeLabel)}</span>
          </div>
          <div class="runtime-item">
            <span class="runtime-label">Platform</span>
            <span class="runtime-value">${this.escapeHtml(desktop.platform || 'web')}</span>
          </div>
          <div class="runtime-item runtime-item-wide">
            <span class="runtime-label">jcode binary</span>
            <span class="runtime-value">${this.escapeHtml(jcodePath)}</span>
          </div>
          <div class="runtime-item runtime-item-wide">
            <span class="runtime-label">Start command</span>
            <span class="runtime-value">${this.escapeHtml(desktop.jcodePath ? `"${desktop.jcodePath}" serve` : 'jcode serve')}</span>
          </div>
        </div>
      </div>
    `;
  },

  renderModelTab() {
    const routing = window.ModelRoutingStore?.snapshot?.() || {};
    const modelOptions = this.modelOptions();
    const renderModelOptions = value => modelOptions.map(option => `
      <option value="${this.escapeHtml(option.value)}"${option.value === value ? ' selected' : ''}>${this.escapeHtml(option.label)}</option>
    `).join('');

    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Model Routing</h3>
        <p class="settings-help">
          Local routing plan for multi-agent work. The gateway can consume these route hints when model-aware dispatch is enabled.
        </p>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label class="model-routing-mode ${routing.routingMode === 'single' ? 'active' : ''}">
            <input type="radio" name="routingMode" value="single" ${routing.routingMode === 'single' ? 'checked' : ''}>
            <span>Single</span>
            <small>Use default model everywhere</small>
          </label>
          <label class="model-routing-mode ${routing.routingMode === 'role' ? 'active' : ''}">
            <input type="radio" name="routingMode" value="role" ${routing.routingMode === 'role' ? 'checked' : ''}>
            <span>Role routing</span>
            <small>Plan, execute, and review separately</small>
          </label>
          <label class="model-routing-mode ${routing.routingMode === 'fallback' ? 'active' : ''}">
            <input type="radio" name="routingMode" value="fallback" ${routing.routingMode === 'fallback' ? 'checked' : ''}>
            <span>Fallback first</span>
            <small>Prefer default with a named fallback</small>
          </label>
        </div>

        <div class="model-routing-grid">
          ${this.renderModelField('Default', 'defaultModel', routing.defaultModel, renderModelOptions)}
          ${this.renderModelField('Planning', 'planningModel', routing.planningModel, renderModelOptions)}
          ${this.renderModelField('Execution', 'executionModel', routing.executionModel, renderModelOptions)}
          ${this.renderModelField('Review', 'reviewModel', routing.reviewModel, renderModelOptions)}
          ${this.renderModelField('Fallback', 'fallbackModel', routing.fallbackModel, renderModelOptions)}
        </div>

        <div class="model-routing-preview">
          <span>Route hints</span>
          <code id="modelRoutePreview">${this.escapeHtml(JSON.stringify(window.ModelRoutingStore?.routeHints?.() || {}, null, 2))}</code>
        </div>

        <div class="settings-actions">
          <button class="settings-btn primary" id="saveModelRoutingBtn">Save Routing</button>
          <button class="settings-btn" id="copyModelRoutingBtn">Copy Hints</button>
          <button class="settings-btn" id="resetModelRoutingBtn">Reset</button>
        </div>
      </div>
    `;
  },

  renderModelField(label, key, value, renderModelOptions) {
    return `
      <div class="settings-field model-routing-field">
        <label class="settings-label" for="setting_${this.escapeHtml(key)}">${this.escapeHtml(label)} Model</label>
        <select class="settings-input" id="setting_${this.escapeHtml(key)}" data-model-route="${this.escapeHtml(key)}">
          ${renderModelOptions(value)}
        </select>
      </div>
    `;
  },

  modelOptions() {
    return window.ModelRoutingStore?.modelOptions?.() || [
      { value: 'claude-opus-4-7', label: 'Claude Opus 4' },
      { value: 'claude-sonnet-4-7', label: 'Claude Sonnet 4' }
    ];
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
          App.checkConnection();
        });
      }

      const pairBtn = content.querySelector('#pairBtn');
      const pairingCode = content.querySelector('#pairingCode');
      pairBtn?.addEventListener('click', async () => {
        const code = pairingCode?.value.trim();
        if (!code) {
          this.showToast('Enter the pairing code from jcode pair.', true);
          return;
        }
        try {
          pairBtn.disabled = true;
          const result = await API.pair(code);
          if (!result.token) throw new Error('Pairing response did not include a token');
          WS.setToken(result.token);
          ConnectionStore.setAuthenticated(true, 'Pairing token saved');
          this.showToast('Paired. Reconnecting...');
          WS.disconnect();
          App.checkConnection();
        } catch (e) {
          this.showToast(e.message, true);
        } finally {
          pairBtn.disabled = false;
        }
      });

      const savedToken = content.querySelector('#savedToken');
      content.querySelector('#saveTokenBtn')?.addEventListener('click', () => {
        const token = savedToken?.value.trim();
        if (!token) {
          this.showToast('Token is empty.', true);
          return;
        }
        WS.setToken(token);
        this.showToast('Token saved. Reconnecting...');
        WS.disconnect();
        App.checkConnection();
      });

      content.querySelector('#clearTokenBtn')?.addEventListener('click', () => {
        WS.setToken(null);
        ConnectionStore.setAuthenticated(false, 'Pairing token cleared');
        this.showToast('Token cleared.');
        WS.disconnect();
        App.checkConnection();
      });

      const gatewayUrl = content.querySelector('#settingGatewayUrl');
      gatewayUrl?.addEventListener('change', () => {
        const value = gatewayUrl.value.trim().replace(/\/$/, '');
        if (value) {
          API.baseUrl = value;
          localStorage.setItem('jcode_gateway_url', value);
          this.showToast('Gateway URL saved. Rechecking...');
          App.checkConnection();
        }
      });

      this.fetchGatewayVersion().then(version => {
        const versionEl = content.querySelector('#gatewayVersion');
        if (versionEl) {
          versionEl.textContent = version || 'Unknown';
        }
      });
    }

    // Model tab listeners
    if (tabName === 'model') {
      const preview = content.querySelector('#modelRoutePreview');
      const collectRouting = () => {
        const values = {};
        content.querySelectorAll('[data-model-route]').forEach(input => {
          values[input.dataset.modelRoute] = input.value;
        });
        values.routingMode = content.querySelector('input[name="routingMode"]:checked')?.value || 'role';
        return values;
      };
      const refreshPreview = () => {
        const routing = collectRouting();
        const routeHints = {
          mode: routing.routingMode,
          roles: {
            default: routing.defaultModel,
            planning: routing.planningModel,
            execution: routing.executionModel,
            review: routing.reviewModel,
            fallback: routing.fallbackModel
          }
        };
        if (preview) preview.textContent = JSON.stringify(routeHints, null, 2);
        content.querySelectorAll('.model-routing-mode').forEach(label => {
          const input = label.querySelector('input[name="routingMode"]');
          label.classList.toggle('active', input?.checked);
        });
      };

      content.querySelectorAll('[data-model-route], input[name="routingMode"]').forEach(input => {
        input.addEventListener('change', refreshPreview);
      });

      content.querySelector('#saveModelRoutingBtn')?.addEventListener('click', () => {
        window.ModelRoutingStore?.save?.(collectRouting());
        this.showToast('Model routing saved.');
      });

      content.querySelector('#copyModelRoutingBtn')?.addEventListener('click', async () => {
        try {
          await this.copyText(preview?.textContent || JSON.stringify(window.ModelRoutingStore?.routeHints?.() || {}, null, 2));
          this.showToast('Route hints copied.');
        } catch (e) {
          this.showToast('Could not copy route hints.', true);
        }
      });

      content.querySelector('#resetModelRoutingBtn')?.addEventListener('click', () => {
        const next = window.ModelRoutingStore?.reset?.();
        if (next) {
          this.switchTab('model', content.closest('.settings-body'));
        }
        this.showToast('Model routing reset.');
      });

      refreshPreview();
    }

    // Subscribe to connection store for real-time status updates
    if (tabName === 'connection') {
      this.cleanup = ConnectionStore.subscribe((state) => {
        const statusEl = content.querySelector('.status-dot');
        const statusText = content.querySelector('#connectionStatusLabel');
        const detailText = content.querySelector('#connectionDetail');
        if (statusEl) {
          statusEl.className = `status-dot ${state.connecting ? 'connecting' : state.connected ? 'connected' : 'disconnected'}`;
        }
        if (statusText) {
          statusText.textContent = state.connected ? 'Connected' : state.gatewayReachable ? 'Needs pairing' : 'Gateway offline';
        }
        if (detailText) {
          detailText.textContent = state.detail || '';
        }
      });
    }
  },

  teardown() {
    if (typeof this.cleanup === 'function') {
      this.cleanup();
    }
    this.cleanup = null;
  },

  async fetchGatewayVersion() {
    try {
      const data = await API.health();
      return data.version || 'Unknown';
    } catch (e) {
      return 'Gateway unreachable';
    }
  },

  escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  },

  async copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    if (!ok) throw new Error('copy failed');
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
