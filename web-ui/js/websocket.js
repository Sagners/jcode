// web-ui/js/websocket.js

const WS = {
  socket: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  listeners: new Map(),
  token: null,
  requestId: 0,
  pendingRequests: new Map(),
  manualDisconnect: false,

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.manualDisconnect = false;
    ConnectionStore.setStatus('connecting', 'Opening WebSocket');

    // Build WebSocket URL from the same gateway base URL used by HTTP health/pair.
    let wsUrl = API.websocketUrl('/ws');
    if (this.token) {
      wsUrl += `?token=${this.token}`;
    }
    console.log('WebSocket: Connecting to gateway');
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket: Connected');
      this.reconnectAttempts = 0;
      ConnectionStore.setAuthenticated(Boolean(this.token), this.token ? 'Authenticated with saved token' : 'Connected without token');
      ConnectionStore.setConnected(true);
      this.emit('open');
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket: Disconnected', event.code, event.reason);
      const authFailure = event.code === 1008 || event.code === 1006;
      ConnectionStore.setStatus('disconnected', authFailure && !this.token
        ? 'Gateway requires a pairing token. Run jcode pair, then add the token in Settings.'
        : 'WebSocket disconnected');
      this.emit('close', { code: event.code, reason: event.reason });
      if (!event.wasClean && !this.manualDisconnect) {
        this.attemptReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket: Error', error);
      ConnectionStore.setStatus('error', 'WebSocket error');
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

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('jcode_auth_token', token);
    } else {
      localStorage.removeItem('jcode_auth_token');
    }
  },

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Add id if not present
      if (!data.id) {
        data.id = ++this.requestId;
      }
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
      this.manualDisconnect = true;
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
