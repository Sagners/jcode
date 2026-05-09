// web-ui/js/stores/connection.js

const ConnectionStore = {
  connected: false,
  connecting: false,
  gatewayReachable: false,
  authenticated: false,
  status: 'idle',
  detail: 'Not connected',
  version: null,
  listeners: [],

  setConnected(value) {
    this.connected = value;
    this.connecting = false;
    this.status = value ? 'connected' : 'disconnected';
    if (value) {
      this.detail = 'WebSocket connected';
    }
    this.notify();
  },

  setConnecting(value) {
    this.connecting = value;
    this.status = value ? 'connecting' : this.status;
    this.notify();
  },

  setGatewayHealth({ reachable, version = null, detail = null }) {
    this.gatewayReachable = reachable;
    this.version = version;
    if (detail) this.detail = detail;
    this.notify();
  },

  setAuthenticated(value, detail = null) {
    this.authenticated = value;
    if (detail) this.detail = detail;
    this.notify();
  },

  setStatus(status, detail = null) {
    this.status = status;
    if (detail) this.detail = detail;
    this.connected = status === 'connected';
    this.connecting = status === 'connecting';
    this.notify();
  },

  subscribe(callback) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.snapshot());
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  snapshot() {
    return {
      connected: this.connected,
      connecting: this.connecting,
      gatewayReachable: this.gatewayReachable,
      authenticated: this.authenticated,
      status: this.status,
      detail: this.detail,
      version: this.version
    };
  },

  notify() {
    const state = this.snapshot();
    this.listeners.forEach(cb => cb(state));
  }
};

window.ConnectionStore = ConnectionStore;
