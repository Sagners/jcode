// web-ui/js/stores/runtime.js

const RuntimeStore = {
  events: [],
  metrics: {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    connectionType: null,
    provider: null,
    phase: 'idle',
    mcpServers: [],
    swarmMembers: [],
    planItems: [],
    messageCount: 0,
    memoryCount: 0,
    memoryChars: 0,
    compaction: null,
    activeTools: [],
    recentTools: [],
    eventCounts: {},
    errorCount: 0,
    lastError: null,
    lastEventAt: null
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

  recordGatewayMessage(message) {
    if (typeof GatewayProtocol === 'undefined') return null;
    const normalized = GatewayProtocol.normalizeRuntimeEvent(message);
    if (!normalized) return null;

    this.applyMetrics(normalized);
    return this.addEvent(normalized);
  },

  applyMetrics(event) {
    const updates = event.metricUpdates || {};
    const next = { ...this.metrics };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        next[key] = value;
      }
    });

    if (updates.activeTool) {
      next.activeTools = [
        updates.activeTool,
        ...next.activeTools.filter(tool => tool.id !== updates.activeTool.id)
      ].slice(0, 6);
    }

    if (updates.completedTool) {
      next.activeTools = next.activeTools.filter(tool => tool.id !== updates.completedTool.id);
      next.recentTools = [updates.completedTool, ...next.recentTools].slice(0, 8);
    }

    next.eventCounts = {
      ...next.eventCounts,
      [event.type]: (next.eventCounts[event.type] || 0) + 1
    };
    next.lastEventAt = event.timestamp;

    if (event.status === 'error') {
      next.errorCount = (next.errorCount || 0) + 1;
      next.lastError = event.detail || event.title;
    }

    this.metrics = next;
    this.notify();
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
