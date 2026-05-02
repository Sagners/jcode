// web-ui/js/websocket.js

const WS = {
  socket: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  listeners: new Map(),

  connect() {
    const wsUrl = 'ws://127.0.0.1:7643/ws';
    console.log('WebSocket: Connecting to', wsUrl);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket: Connected');
      this.reconnectAttempts = 0;
      ConnectionStore.setConnected(true);
      this.emit('open');
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket: Disconnected', event.code, event.reason);
      ConnectionStore.setConnected(false);
      this.emit('close', { code: event.code, reason: event.reason });
      if (!event.wasClean) {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket: Error', error);
      this.emit('error', error);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('message', data);
      } catch (e) {
        console.error('WebSocket: Failed to parse message', e);
        this.emit('raw', event.data);
      }
    };
  },

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('WebSocket: Max reconnection attempts reached');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`WebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  },

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      return true;
    }
    console.warn('WebSocket: Cannot send, not connected');
    return false;
  },

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  },

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  },

  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => {
      try {
        cb(data);
      } catch (e) {
        console.error('WebSocket: Event handler error', e);
      }
    });
  },

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
  },

  getState() {
    if (!this.socket) return 'closed';
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }
};

window.WS = WS;