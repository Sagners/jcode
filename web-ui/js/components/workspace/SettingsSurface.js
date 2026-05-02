// web-ui/js/components/workspace/SettingsSurface.js

const SettingsSurface = {
  // Create and render the settings surface
  create(surfaceId) {
    const container = document.createElement('div');
    container.className = 'surface-container settings-surface';
    container.id = `surface-${surfaceId}`;
    container.dataset.surfaceId = surfaceId;

    container.innerHTML = `
      <div class="surface-header">
        <span class="surface-icon">&#9881;</span>
        <span class="surface-title">Settings</span>
        <div class="surface-actions">
          <button class="surface-action-btn" title="Close" data-action="close">&#10005;</button>
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

  // Render API settings tab content
  renderApiSettings() {
    const settings = this.loadSettings();
    return `
      <div class="settings-section">
        <h4 class="settings-section-title">API Configuration</h4>
        <div class="settings-field">
          <label class="settings-label">Provider</label>
          <select class="settings-input" id="settingsProvider">
            <option value="anthropic" ${settings.provider === 'anthropic' ? 'selected' : ''}>Anthropic</option>
            <option value="openai" ${settings.provider === 'openai' ? 'selected' : ''}>OpenAI</option>
            <option value="custom" ${settings.provider === 'custom' ? 'selected' : ''}>Custom</option>
          </select>
        </div>
        <div class="settings-field">
          <label class="settings-label">API Key</label>
          <input type="password" class="settings-input" id="settingsApiKey" placeholder="sk-..." value="${this.escapeHtml(settings.apiKey || '')}"/>
        </div>
        <div class="settings-field">
          <label class="settings-label">Base URL</label>
          <input type="text" class="settings-input" id="settingsBaseUrl" placeholder="https://api.anthropic.com/v1" value="${this.escapeHtml(settings.baseUrl || 'https://api.anthropic.com/v1')}"/>
        </div>
        <div class="settings-field">
          <label class="settings-label">Default Model</label>
          <select class="settings-input" id="settingsModel">
            <option value="claude-opus-4-7" ${settings.model === 'claude-opus-4-7' ? 'selected' : ''}>Claude Opus 4</option>
            <option value="claude-sonnet-4-7" ${settings.model === 'claude-sonnet-4-7' ? 'selected' : ''}>Claude Sonnet 4</option>
            <option value="claude-haiku-4-7" ${settings.model === 'claude-haiku-4-7' ? 'selected' : ''}>Claude Haiku 4</option>
          </select>
        </div>
        <button class="btn btn-primary" id="saveApiSettings">Save Settings</button>
      </div>
    `;
  },

  // Render appearance settings tab content
  renderAppearanceSettings() {
    const settings = this.loadSettings();
    return `
      <div class="settings-section">
        <h4 class="settings-section-title">Appearance</h4>
        <div class="settings-field">
          <label class="settings-label">Theme</label>
          <select class="settings-input" id="settingsTheme">
            <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
            <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
            <option value="system" ${settings.theme === 'system' ? 'selected' : ''}>System</option>
          </select>
        </div>
        <div class="settings-field">
          <label class="settings-label">Font Size</label>
          <input type="range" class="settings-range" id="settingsFontSize" min="12" max="18" value="${settings.fontSize || 14}"/>
          <span class="settings-range-value" id="fontSizeValue">${settings.fontSize || 14}px</span>
        </div>
        <div class="settings-field">
          <label class="settings-label">Font Family</label>
          <select class="settings-input" id="settingsFontFamily">
            <option value="Inter" ${settings.fontFamily === 'Inter' ? 'selected' : ''}>Inter</option>
            <option value="SF Mono" ${settings.fontFamily === 'SF Mono' ? 'selected' : ''}>SF Mono</option>
            <option value="JetBrains Mono" ${settings.fontFamily === 'JetBrains Mono' ? 'selected' : ''}>JetBrains Mono</option>
          </select>
        </div>
      </div>
    `;
  },

  // Render shortcuts settings tab content
  renderShortcutsSettings() {
    const shortcuts = [
      { action: 'New Lane', key: 'Ctrl+L' },
      { action: 'New Session', key: 'Ctrl+N' },
      { action: 'Close Surface', key: 'Ctrl+W' },
      { action: 'Toggle File Tree', key: 'Ctrl+B' },
      { action: 'Open Settings', key: 'Ctrl+,' },
      { action: 'Quick Switch Session', key: 'Ctrl+1-9' },
      { action: 'Next Surface', key: 'Ctrl+Tab' },
      { action: 'Previous Surface', key: 'Ctrl+Shift+Tab' },
      { action: 'Send Message', key: 'Enter' },
      { action: 'New Line', key: 'Shift+Enter' }
    ];

    return `
      <div class="settings-section">
        <h4 class="settings-section-title">Keyboard Shortcuts</h4>
        <div class="shortcuts-list">
          ${shortcuts.map(s => `
            <div class="shortcut-item">
              <span class="shortcut-action">${s.action}</span>
              <kbd class="shortcut-key">${s.key}</kbd>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Render about settings tab content
  renderAboutSettings() {
    return `
      <div class="settings-section">
        <h4 class="settings-section-title">About</h4>
        <p class="about-title">jcode Web UI</p>
        <p class="about-version">Version 1.0.0</p>
        <p class="about-description">A modern workspace for AI-assisted coding.</p>
        <div class="about-links">
          <a href="#" class="about-link">Documentation</a>
          <a href="#" class="about-link">GitHub</a>
          <a href="#" class="about-link">Report Issue</a>
        </div>
      </div>
    `;
  },

  // Load settings from localStorage
  loadSettings() {
    try {
      const stored = localStorage.getItem('jcode-settings');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  },

  // Save settings to localStorage
  saveSettings(settings) {
    try {
      localStorage.setItem('jcode-settings', JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return false;
    }
  },

  // Apply settings to the UI
  applySettings(settings) {
    // Apply font size
    if (settings.fontSize) {
      document.documentElement.style.setProperty('--font-size-base', `${settings.fontSize}px`);
    }

    // Apply font family
    if (settings.fontFamily) {
      document.documentElement.style.setProperty('--font-family-ui', settings.fontFamily);
    }

    // Apply theme
    if (settings.theme) {
      document.body.setAttribute('data-theme', settings.theme);
    }
  },

  // Attach event listeners
  attachEvents(container, surfaceId) {
    const closeBtn = container.querySelector('[data-action="close"]');
    const tabs = container.querySelectorAll('.settings-tab');
    const contentEl = container.querySelector(`#settingsContent-${surfaceId}`);

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.handleClose(surfaceId);
      });
    }

    // Tab switching
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;

        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Render tab content
        switch (tabName) {
          case 'api':
            contentEl.innerHTML = this.renderApiSettings();
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

    // Save API settings button
    const saveBtn = container.querySelector('#saveApiSettings');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.handleSaveApiSettings();
      });
    }
  },

  // Attach appearance-specific events (font size preview)
  attachAppearanceEvents(container) {
    const fontSizeInput = container.querySelector('#settingsFontSize');
    const fontSizeValue = container.querySelector('#fontSizeValue');

    if (fontSizeInput && fontSizeValue) {
      fontSizeInput.addEventListener('input', () => {
        const size = fontSizeInput.value;
        fontSizeValue.textContent = `${size}px`;

        // Real-time preview
        document.documentElement.style.setProperty('--font-size-base', `${size}px`);
      });

      // Save on change
      fontSizeInput.addEventListener('change', () => {
        this.handleSaveAppearanceSettings();
      });
    }

    const themeSelect = container.querySelector('#settingsTheme');
    if (themeSelect) {
      themeSelect.addEventListener('change', () => {
        this.handleSaveAppearanceSettings();
      });
    }

    const fontFamilySelect = container.querySelector('#settingsFontFamily');
    if (fontFamilySelect) {
      fontFamilySelect.addEventListener('change', () => {
        this.handleSaveAppearanceSettings();
      });
    }
  },

  // Handle save API settings
  handleSaveApiSettings() {
    const provider = document.getElementById('settingsProvider')?.value;
    const apiKey = document.getElementById('settingsApiKey')?.value;
    const baseUrl = document.getElementById('settingsBaseUrl')?.value;
    const model = document.getElementById('settingsModel')?.value;

    const settings = this.loadSettings();
    const newSettings = {
      ...settings,
      provider,
      apiKey,
      baseUrl,
      model
    };

    if (this.saveSettings(newSettings)) {
      this.showToast('Settings saved successfully');
    } else {
      this.showToast('Failed to save settings', 'error');
    }
  },

  // Handle save appearance settings
  handleSaveAppearanceSettings() {
    const theme = document.getElementById('settingsTheme')?.value;
    const fontSize = document.getElementById('settingsFontSize')?.value;
    const fontFamily = document.getElementById('settingsFontFamily')?.value;

    const settings = this.loadSettings();
    const newSettings = {
      ...settings,
      theme,
      fontSize: parseInt(fontSize, 10),
      fontFamily
    };

    this.saveSettings(newSettings);
    this.applySettings(newSettings);
  },

  // Handle close action
  handleClose(surfaceId) {
    const event = new CustomEvent('settings:close', {
      detail: { surfaceId }
    });
    document.dispatchEvent(event);
  },

  // Show toast notification
  showToast(message, type = 'success') {
    const existing = document.querySelector('.settings-toast');
    if (existing) {
      existing.remove();
    }

    const toast = document.createElement('div');
    toast.className = `settings-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto remove after 2 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  },

  // Utility: escape HTML to prevent XSS
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

window.SettingsSurface = SettingsSurface;
