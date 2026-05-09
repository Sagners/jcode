// web-ui/js/stores/runtime.js

const RuntimeStore = {
  events: [],
  metrics: {
    inputTokens: 0,
    outputTokens: 0,
    connectionType: null,
    provider: null,
    phase: 'idle',
    mcpServers: []
  },
  listeners: [],
  maxEvents: 160,

  addEvent(event) {
    const item = {
      id: event.id || `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: event.type || 'event',
      title: event.title || event.type || 'Event',
      detail: event.detail || '',
      status: event.status || 'info',
      timestamp: event.timestamp || Date.now(),
      meta: event.meta || null
    };
    this.events = [item, ...this.events].slice(0, this.maxEvents);
    this.notify();
    return item;
  },

  updateMetrics(updates) {
    this.metrics = { ...this.metrics, ...updates };
    this.notify();
  },

  snapshot() {
    return {
      events: [...this.events],
      metrics: { ...this.metrics }
    };
  },

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.snapshot());
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notify() {
    const snapshot = this.snapshot();
    this.listeners.forEach(cb => cb(snapshot));
  }
};

window.RuntimeStore = RuntimeStore;
