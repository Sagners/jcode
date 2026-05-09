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

  // Health check (gateway uses /health, not /api/health)
  async health() {
    return this.request('/health');
  },

  async pair(code, deviceName = 'jcode Web UI') {
    const deviceId = localStorage.getItem('jcode_device_id') || `web-ui-${crypto.randomUUID?.() || Date.now()}`;
    localStorage.setItem('jcode_device_id', deviceId);
    return this.request('/pair', {
      method: 'POST',
      body: JSON.stringify({
        code,
        device_id: deviceId,
        device_name: deviceName
      }),
    });
  },

  websocketUrl(path = '/ws') {
    const url = new URL(this.baseUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = path;
    url.search = '';
    return url.toString();
  }
};

window.API = API;
