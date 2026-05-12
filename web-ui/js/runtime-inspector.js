// web-ui/js/runtime-inspector.js

const RuntimeInspector = {
  initialized: false,
  root: null,
  runtimeUnsubscribe: null,
  routingUnsubscribe: null,

  init() {
    if (this.initialized) return;
    this.root = document.getElementById('runtimeInspector');
    if (!this.root) return;

    this.initialized = true;
    this.bindActions();

    if (window.RuntimeStore?.subscribe) {
      this.runtimeUnsubscribe = RuntimeStore.subscribe(snapshot => this.renderRuntime(snapshot));
    }

    if (window.ModelRoutingStore?.subscribe) {
      this.routingUnsubscribe = ModelRoutingStore.subscribe(state => this.renderRouting(state));
    }
  },

  bindActions() {
    document.getElementById('runtimeInspectorOpenRuntime')?.addEventListener('click', () => {
      window.WorkspaceController?.openRuntimeSurface?.();
    });

    document.getElementById('runtimeInspectorRouteSettings')?.addEventListener('click', () => {
      window.WorkspaceController?.openSettingsSurface?.('model');
    });
  },

  renderRuntime({ events = [], metrics = {} }) {
    const activeTools = Array.isArray(metrics.activeTools) ? metrics.activeTools : [];
    const recentTools = Array.isArray(metrics.recentTools) ? metrics.recentTools : [];
    const members = Array.isArray(metrics.swarmMembers) ? metrics.swarmMembers : [];
    const planItems = Array.isArray(metrics.planItems) ? metrics.planItems : [];
    const counts = this.collaborationCounts(members);

    this.setText('runtimeInspectorPhase', metrics.phase || 'idle');
    this.setText('runtimeInspectorLastEvent', this.lastEventLabel(events, metrics));
    this.setText('runtimeInspectorActiveTools', activeTools.length);
    this.setText('runtimeInspectorErrors', metrics.errorCount || 0);
    this.setText('runtimeInspectorMessages', metrics.messageCount || 0);
    this.setText('runtimeInspectorMembers', members.length);
    this.setText('runtimeInspectorBlocked', counts.blocked);
    this.setText('runtimeInspectorPlanItems', planItems.length);
    this.setText('runtimeInspectorCollabHint', counts.total ? `${counts.active} active` : '0 active');
    this.setText('runtimeInspectorToolHint', activeTools.length ? 'Running now' : `${recentTools.length} recent`);

    const dot = document.getElementById('runtimeInspectorDot');
    if (dot) {
      dot.className = `status-dot ${this.statusClass(metrics, activeTools)}`;
    }

    if (this.root) {
      this.root.dataset.runtimeStatus = this.statusClass(metrics, activeTools);
    }

    this.renderTools([...activeTools, ...recentTools].slice(0, 5));
  },

  renderRouting(state = {}) {
    const modelLabel = (value, compact = false) => window.ModelRoutingStore?.modelLabel?.(value, compact) || value || 'unset';
    const modeLabel = window.ModelRoutingStore?.modeLabel?.(state.routingMode) || state.routingMode || 'Role routing';

    this.setText('runtimeInspectorRouteMode', modeLabel);
    this.setText('runtimeInspectorDefaultModel', modelLabel(state.defaultModel, true));
    this.setText('runtimeInspectorExecutionModel', modelLabel(state.executionModel, true));
  },

  renderTools(tools) {
    const container = document.getElementById('runtimeInspectorToolList');
    if (!container) return;

    if (!tools.length) {
      container.innerHTML = '<span class="runtime-inspector-empty">No tools have run yet.</span>';
      return;
    }

    container.innerHTML = tools.map(tool => `
      <div class="runtime-inspector-tool runtime-inspector-tool-${this.classToken(tool.status)}">
        <span class="runtime-tool-dot"></span>
        <strong>${this.escapeHtml(tool.name || tool.id || 'tool')}</strong>
        <span>${this.escapeHtml(tool.status || 'running')}</span>
      </div>
    `).join('');
  },

  statusClass(metrics, activeTools) {
    if (metrics.errorCount || metrics.lastError) return 'disconnected';
    if (activeTools.length) return 'connecting';
    if (String(metrics.phase || '').toLowerCase() === 'offline') return 'disconnected';
    return 'connected';
  },

  lastEventLabel(events, metrics) {
    const latest = Array.isArray(events) ? events[0] : null;
    if (latest) {
      return `${latest.title || latest.type || 'Event'} - ${this.formatTime(latest.timestamp)}`;
    }
    if (metrics.lastEventAt) {
      return metrics.lastError
        ? `${metrics.lastError} - ${this.formatTime(metrics.lastEventAt)}`
        : `Last event - ${this.formatTime(metrics.lastEventAt)}`;
    }
    return 'Waiting for gateway events';
  },

  collaborationCounts(members) {
    return members.reduce((counts, member) => {
      const status = String(member.status || member.state || (member.active ? 'active' : 'idle')).toLowerCase();
      counts.total += 1;
      if (['active', 'running', 'working', 'busy'].includes(status)) counts.active += 1;
      if (['blocked', 'error', 'failed'].includes(status)) counts.blocked += 1;
      return counts;
    }, { total: 0, active: 0, blocked: 0 });
  },

  formatTime(timestamp) {
    return new Date(timestamp || Date.now()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },

  setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value == null ? '' : String(value);
  },

  classToken(value) {
    return String(value || 'info').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
  },

  escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }
};

document.addEventListener('DOMContentLoaded', () => RuntimeInspector.init());

window.RuntimeInspector = RuntimeInspector;
