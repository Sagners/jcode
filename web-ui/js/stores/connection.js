// web-ui/js/stores/connection.js

const ConnectionStore = {
  connected: false,
  connecting: false,
  listeners: [],

  setConnected(value) {
    this.connected = value;
    this.connecting = false;
    this.notify();
  },

  setConnecting(value) {
    this.connecting = value;
    this.notify();
  },

  subscribe(callback) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback({
      connected: this.connected,
      connecting: this.connecting
    });
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notify() {
    const state = {
      connected: this.connected,
      connecting: this.connecting
    };
    this.listeners.forEach(cb => cb(state));
  }
};

window.ConnectionStore = ConnectionStore;