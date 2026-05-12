// web-ui/js/stores/model-routing.js

const ModelRoutingStore = {
  storageKey: 'jcode_model_routing',
  defaults: {
    routingMode: 'role',
    defaultModel: 'claude-sonnet-4-7',
    planningModel: 'claude-opus-4-7',
    executionModel: 'claude-sonnet-4-7',
    reviewModel: 'claude-opus-4-7',
    fallbackModel: 'claude-sonnet-4'
  },
  allowedRoutingModes: ['single', 'role', 'fallback'],
  options: [
    { value: 'claude-opus-4-7', label: 'Claude Opus 4', shortLabel: 'Opus 4' },
    { value: 'claude-sonnet-4-7', label: 'Claude Sonnet 4', shortLabel: 'Sonnet 4' },
    { value: 'claude-opus-4', label: 'Claude Opus 4 (Legacy)', shortLabel: 'Opus Legacy' },
    { value: 'claude-sonnet-4', label: 'Claude Sonnet 4 (Legacy)', shortLabel: 'Sonnet Legacy' },
    { value: 'gpt-5.5', label: 'GPT-5.5', shortLabel: 'GPT-5.5' },
    { value: 'gpt-5.4', label: 'GPT-5.4', shortLabel: 'GPT-5.4' },
    { value: 'gpt-5.3-codex-spark', label: 'GPT-5.3 Codex Spark', shortLabel: 'Spark' }
  ],
  modeLabels: {
    single: 'Single',
    role: 'Role routing',
    fallback: 'Fallback first'
  },
  listeners: [],

  snapshot() {
    return { ...this.defaults, ...this.sanitize(this.readStored()) };
  },

  readStored() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  },

  save(updates) {
    const next = { ...this.snapshot(), ...this.sanitize(updates) };
    localStorage.setItem(this.storageKey, JSON.stringify(next));
    this.notify(next);
    return next;
  },

  reset() {
    localStorage.removeItem(this.storageKey);
    const next = this.snapshot();
    this.notify(next);
    return next;
  },

  sanitize(updates = {}) {
    const clean = {};
    Object.keys(this.defaults).forEach(key => {
      const value = updates[key];
      if (typeof value === 'string' && value.trim()) {
        if (key === 'routingMode' && !this.allowedRoutingModes.includes(value.trim())) {
          return;
        }
        clean[key] = value.trim();
      }
    });
    return clean;
  },

  routeHints() {
    const state = this.snapshot();
    return {
      mode: state.routingMode,
      roles: {
        default: state.defaultModel,
        planning: state.planningModel,
        execution: state.executionModel,
        review: state.reviewModel,
        fallback: state.fallbackModel
      }
    };
  },

  modelOptions() {
    return this.options.map(option => ({ ...option }));
  },

  modelLabel(value, compact = false) {
    const match = this.options.find(option => option.value === value);
    if (!match) return value || 'Unknown';
    return compact ? match.shortLabel : match.label;
  },

  modeLabel(value) {
    return this.modeLabels[value] || this.modeLabels.role;
  },

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.snapshot());
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notify(state = this.snapshot()) {
    this.listeners.forEach(callback => callback({ ...state }));
  }
};

window.ModelRoutingStore = ModelRoutingStore;
