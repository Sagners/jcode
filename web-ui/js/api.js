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
      const text = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${text}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
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

  // Workspaces
  async listWorkspaces() {
    return this.request('/api/workspaces');
  },

  async saveWorkspace(name, path) {
    return this.request('/api/workspaces/save', {
      method: 'POST',
      body: JSON.stringify({ name, path }),
    });
  },

  async selectWorkspace(path) {
    return this.request('/api/workspaces/select', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  },

  // Gateway
  async gatewayHealth() {
    return this.request('/api/gateway/health', { method: 'POST' });
  },

  async gatewayPair() {
    return this.request('/api/gateway/pair', { method: 'POST' });
  },

  async gatewayStatus() {
    return this.request('/api/gateway');
  },

  // Configuration
  async getState() {
    return this.request('/api/state');
  },

  async saveConfig(config) {
    return this.request('/api/save', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  async validate() {
    return this.request('/api/validate', { method: 'POST' });
  }
};

window.API = API;