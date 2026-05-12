// web-ui/js/components/surfaces/RuntimeSurface.js

const RuntimeSurface = {
  activeFilter: 'all',
  unsubscribe: null,

  render(surface) {
    this.teardown();
    const container = document.createElement('div');
    container.className = 'runtime-surface-body';
    container.dataset.surfaceId = surface.id;
    container.innerHTML = `
      <div class="runtime-overview">
        <div class="runtime-current">
          <span class="runtime-kicker">Runtime</span>
          <strong id="runtimePhase_${surface.id}">idle</strong>
          <span id="runtimeLastEvent_${surface.id}">Waiting for gateway events</span>
        </div>
        <div class="runtime-health-strip">
          <div>
            <span class="runtime-summary-label">Active tools</span>
            <strong id="runtimeActiveTools_${surface.id}">0</strong>
          </div>
          <div>
            <span class="runtime-summary-label">Errors</span>
            <strong id="runtimeErrors_${surface.id}">0</strong>
          </div>
          <div>
            <span class="runtime-summary-label">Messages</span>
            <strong id="runtimeMessages_${surface.id}">0</strong>
          </div>
        </div>
      </div>
      <div class="runtime-summary-grid">
        <div class="runtime-summary-item">
          <span class="runtime-summary-label">Transport</span>
          <strong id="runtimeTransport_${surface.id}">unknown</strong>
        </div>
        <div class="runtime-summary-item">
          <span class="runtime-summary-label">Provider</span>
          <strong id="runtimeProvider_${surface.id}">unknown</strong>
        </div>
        <div class="runtime-summary-item">
          <span class="runtime-summary-label">Tokens</span>
          <strong id="runtimeTokens_${surface.id}">0 / 0</strong>
        </div>
        <div class="runtime-summary-item">
          <span class="runtime-summary-label">MCP</span>
          <strong id="runtimeMcp_${surface.id}">0 servers</strong>
        </div>
      </div>
      <div class="runtime-inspector-grid">
        <section class="runtime-inspector-panel">
          <div class="runtime-panel-head">
            <h4>Tool Activity</h4>
            <span id="runtimeToolHint_${surface.id}">No active tools</span>
          </div>
          <div class="runtime-tool-list" id="runtimeTools_${surface.id}">
            ${this.renderEmpty('No tools have run yet.')}
          </div>
        </section>
        <section class="runtime-inspector-panel">
          <div class="runtime-panel-head">
            <h4>Context Signals</h4>
            <span id="runtimeContextHint_${surface.id}">No context activity</span>
          </div>
          <div class="runtime-context-grid" id="runtimeContext_${surface.id}">
            ${this.renderContextMetrics({})}
          </div>
        </section>
      </div>
      <div class="runtime-inspector-grid">
        <section class="runtime-inspector-panel">
          <div class="runtime-panel-head">
            <h4>Collaboration</h4>
            <span id="runtimeCollabHint_${surface.id}">No collaborators</span>
          </div>
          <div class="runtime-collab-board" id="runtimeCollab_${surface.id}">
            ${this.renderCollaboration({})}
          </div>
        </section>
        <section class="runtime-inspector-panel">
          <div class="runtime-panel-head">
            <h4>Workspace Performance</h4>
            <span id="runtimePerfHint_${surface.id}">Waiting for samples</span>
          </div>
          <div class="runtime-performance-grid" id="runtimePerformance_${surface.id}">
            ${this.renderPerformance({})}
          </div>
        </section>
      </div>
      <div class="runtime-filter-bar" id="runtimeFilters_${surface.id}">
        ${this.renderFilterButton('all', 'All')}
        ${this.renderFilterButton('running', 'Running')}
        ${this.renderFilterButton('warning', 'Warnings')}
        ${this.renderFilterButton('error', 'Errors')}
        ${this.renderFilterButton('success', 'Complete')}
        ${this.renderFilterButton('memory', 'Memory')}
        ${this.renderFilterButton('compaction', 'Compaction')}
      </div>
      <div class="runtime-event-list" id="runtimeEvents_${surface.id}">
        ${this.renderEmpty('Waiting for gateway events.')}
      </div>
    `;

    this.bind(container, surface);
    container.__surfaceCleanup = () => this.teardown();
    return container;
  },

  bind(container, surface) {
    const phaseEl = container.querySelector(`#runtimePhase_${surface.id}`);
    const transportEl = container.querySelector(`#runtimeTransport_${surface.id}`);
    const providerEl = container.querySelector(`#runtimeProvider_${surface.id}`);
    const tokensEl = container.querySelector(`#runtimeTokens_${surface.id}`);
    const lastEventEl = container.querySelector(`#runtimeLastEvent_${surface.id}`);
    const activeToolsEl = container.querySelector(`#runtimeActiveTools_${surface.id}`);
    const errorsEl = container.querySelector(`#runtimeErrors_${surface.id}`);
    const messagesEl = container.querySelector(`#runtimeMessages_${surface.id}`);
    const mcpEl = container.querySelector(`#runtimeMcp_${surface.id}`);
    const toolsEl = container.querySelector(`#runtimeTools_${surface.id}`);
    const toolHintEl = container.querySelector(`#runtimeToolHint_${surface.id}`);
    const contextEl = container.querySelector(`#runtimeContext_${surface.id}`);
    const contextHintEl = container.querySelector(`#runtimeContextHint_${surface.id}`);
    const collabEl = container.querySelector(`#runtimeCollab_${surface.id}`);
    const collabHintEl = container.querySelector(`#runtimeCollabHint_${surface.id}`);
    const perfEl = container.querySelector(`#runtimePerformance_${surface.id}`);
    const perfHintEl = container.querySelector(`#runtimePerfHint_${surface.id}`);
    const filtersEl = container.querySelector(`#runtimeFilters_${surface.id}`);
    const eventsEl = container.querySelector(`#runtimeEvents_${surface.id}`);

    this.unsubscribe = RuntimeStore.subscribe(({ events, metrics }) => {
      if (phaseEl) phaseEl.textContent = metrics.phase || 'idle';
      if (transportEl) transportEl.textContent = metrics.connectionType || 'unknown';
      if (providerEl) providerEl.textContent = metrics.provider || 'unknown';
      if (tokensEl) tokensEl.textContent = this.formatTokens(metrics);
      if (lastEventEl) lastEventEl.textContent = this.lastEventLabel(metrics);
      if (activeToolsEl) activeToolsEl.textContent = String(metrics.activeTools?.length || 0);
      if (errorsEl) errorsEl.textContent = String(metrics.errorCount || 0);
      if (messagesEl) messagesEl.textContent = String(metrics.messageCount || 0);
      if (mcpEl) mcpEl.textContent = `${metrics.mcpServers?.length || 0} servers`;

      if (toolsEl) {
        const tools = [...(metrics.activeTools || []), ...(metrics.recentTools || [])];
        toolsEl.innerHTML = tools.length ? tools.map(tool => this.renderTool(tool)).join('') : this.renderEmpty('No tools have run yet.');
      }
      if (toolHintEl) {
        toolHintEl.textContent = metrics.activeTools?.length ? 'Running now' : `${metrics.recentTools?.length || 0} recent`;
      }
      if (contextEl) contextEl.innerHTML = this.renderContextMetrics(metrics);
      if (contextHintEl) {
        contextHintEl.textContent = metrics.compaction ? 'Compaction recorded' : `${metrics.memoryCount || 0} memories`;
      }
      if (collabEl) collabEl.innerHTML = this.renderCollaboration(metrics);
      if (collabHintEl) {
        const counts = this.collaborationCounts(metrics.swarmMembers || []);
        collabHintEl.textContent = counts.total ? `${counts.active} active / ${counts.total} total` : 'No collaborators';
      }
      if (perfEl) perfEl.innerHTML = this.renderPerformance(metrics);
      if (perfHintEl) {
        const eventTotal = Object.values(metrics.eventCounts || {}).reduce((sum, count) => sum + count, 0);
        perfHintEl.textContent = eventTotal ? `${eventTotal} gateway events` : 'Waiting for samples';
      }

      if (!eventsEl) return;
      const filteredEvents = this.filterEvents(events);
      if (!filteredEvents.length) {
        eventsEl.innerHTML = this.renderEmpty('Waiting for gateway events.');
        return;
      }

      eventsEl.innerHTML = filteredEvents.map(event => this.renderEvent(event)).join('');

      if (filtersEl) {
        filtersEl.querySelectorAll('[data-runtime-filter]').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.runtimeFilter === this.activeFilter);
        });
      }
    });

    filtersEl?.querySelectorAll('[data-runtime-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeFilter = btn.dataset.runtimeFilter || 'all';
        const state = RuntimeStore.snapshot();
        const events = this.filterEvents(state.events);
        if (eventsEl) {
          eventsEl.innerHTML = events.length ? events.map(event => this.renderEvent(event)).join('') : this.renderEmpty('Waiting for gateway events.');
        }
        filtersEl.querySelectorAll('[data-runtime-filter]').forEach(node => {
          node.classList.toggle('active', node.dataset.runtimeFilter === this.activeFilter);
        });
      });
    });
  },

  renderEvent(event) {
    const time = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const detail = event.detail ? `<p>${this.escapeHtml(event.detail)}</p>` : '';
    return `
      <div class="runtime-event runtime-event-${this.classToken(event.status)}">
        <span class="runtime-event-pin"></span>
        <div class="runtime-event-main">
          <div class="runtime-event-head">
            <strong>${this.escapeHtml(event.title)}</strong>
            <time>${time}</time>
          </div>
          ${detail}
        </div>
      </div>
    `;
  },

  renderFilterButton(value, label) {
    return `
      <button type="button" class="runtime-filter${value === this.activeFilter ? ' active' : ''}" data-runtime-filter="${this.escapeHtml(value)}">
        ${this.escapeHtml(label)}
      </button>
    `;
  },

  renderTool(tool) {
    return `
      <div class="runtime-tool runtime-tool-${this.classToken(tool.status)}">
        <span class="runtime-tool-dot"></span>
        <strong>${this.escapeHtml(tool.name)}</strong>
        <span>${this.escapeHtml(tool.status)}</span>
      </div>
    `;
  },

  renderContextMetrics(metrics) {
    const compaction = metrics.compaction;
    const items = [
      ['Memory', `${metrics.memoryCount || 0} items`, `${metrics.memoryChars || 0} chars`],
      ['Swarm', `${metrics.swarmMembers?.length || 0} members`, `${metrics.planItems?.length || 0} plan items`],
      ['Cache', `${metrics.cacheReadTokens || 0} read`, `${metrics.cacheCreationTokens || 0} created`],
      ['Compaction', compaction ? `${compaction.tokensSaved || 0} saved` : 'none', compaction?.trigger || 'idle']
    ];

    return items.map(([label, value, detail]) => `
      <div class="runtime-context-item">
        <span>${this.escapeHtml(label)}</span>
        <strong>${this.escapeHtml(value)}</strong>
        <small>${this.escapeHtml(detail)}</small>
      </div>
    `).join('');
  },

  renderCollaboration(metrics) {
    const members = Array.isArray(metrics.swarmMembers) ? metrics.swarmMembers : [];
    const planItems = Array.isArray(metrics.planItems) ? metrics.planItems : [];
    const counts = this.collaborationCounts(members);
    const planPreview = planItems.slice(0, 4);

    return `
      <div class="runtime-collab-stats">
        ${this.renderStatPill('Members', counts.total)}
        ${this.renderStatPill('Active', counts.active)}
        ${this.renderStatPill('Blocked', counts.blocked)}
        ${this.renderStatPill('Plan', planItems.length)}
      </div>
      <div class="runtime-member-list">
        ${members.length ? members.slice(0, 5).map(member => this.renderMember(member)).join('') : this.renderEmpty('No collaboration status yet.')}
      </div>
      <div class="runtime-plan-list">
        ${planPreview.length ? planPreview.map(item => this.renderPlanItem(item)).join('') : ''}
      </div>
    `;
  },

  renderPerformance(metrics) {
    const eventTotal = Object.values(metrics.eventCounts || {}).reduce((sum, count) => sum + count, 0);
    const activeTools = metrics.activeTools?.length || 0;
    const recentTools = metrics.recentTools?.length || 0;
    const lastAge = metrics.lastEventAt ? this.formatAge(Date.now() - metrics.lastEventAt) : 'none';
    const cacheTokens = (metrics.cacheReadTokens || 0) + (metrics.cacheCreationTokens || 0);

    return [
      ['Events', eventTotal, 'gateway total'],
      ['Tools', `${activeTools}/${recentTools}`, 'active/recent'],
      ['Messages', metrics.messageCount || 0, 'loaded session'],
      ['Errors', metrics.errorCount || 0, metrics.lastError || 'clear'],
      ['Cache', cacheTokens, 'tokens'],
      ['Last event', lastAge, metrics.phase || 'idle']
    ].map(([label, value, detail]) => `
      <div class="runtime-performance-item">
        <span>${this.escapeHtml(label)}</span>
        <strong>${this.escapeHtml(value)}</strong>
        <small>${this.escapeHtml(detail)}</small>
      </div>
    `).join('');
  },

  renderStatPill(label, value) {
    return `
      <div class="runtime-collab-pill">
        <span>${this.escapeHtml(label)}</span>
        <strong>${this.escapeHtml(value)}</strong>
      </div>
    `;
  },

  renderMember(member) {
    const name = member.name || member.id || member.role || 'agent';
    const status = member.status || member.state || (member.active ? 'active' : 'idle');
    const detail = member.model || member.role || member.task || '';
    return `
      <div class="runtime-member runtime-member-${this.classToken(status)}">
        <span class="runtime-tool-dot"></span>
        <strong>${this.escapeHtml(name)}</strong>
        <small>${this.escapeHtml([status, detail].filter(Boolean).join(' - '))}</small>
      </div>
    `;
  },

  renderPlanItem(item) {
    const title = item.title || item.task || item.step || item.name || 'Plan item';
    const status = item.status || item.state || 'pending';
    return `
      <div class="runtime-plan-item runtime-plan-${this.classToken(status)}">
        <span>${this.escapeHtml(status)}</span>
        <strong>${this.escapeHtml(title)}</strong>
      </div>
    `;
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

  formatAge(ms) {
    const seconds = Math.max(0, Math.round(ms / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.round(minutes / 60)}h ago`;
  },

  renderEmpty(text) {
    return `
      <div class="runtime-empty">
        <span class="status-dot disconnected"></span>
        <span>${this.escapeHtml(text)}</span>
      </div>
    `;
  },

  formatTokens(metrics) {
    const input = metrics.inputTokens || 0;
    const output = metrics.outputTokens || 0;
    const cache = (metrics.cacheReadTokens || 0) + (metrics.cacheCreationTokens || 0);
    return cache ? `${input} / ${output} + ${cache} cache` : `${input} / ${output}`;
  },

  lastEventLabel(metrics) {
    if (!metrics.lastEventAt) return 'Waiting for gateway events';
    const time = new Date(metrics.lastEventAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return metrics.lastError ? `Last event ${time} - ${metrics.lastError}` : `Last event ${time}`;
  },

  filterEvents(events) {
    if (!Array.isArray(events)) return [];
    switch (this.activeFilter) {
      case 'running':
        return events.filter(event => event.status === 'running');
      case 'warning':
        return events.filter(event => event.status === 'warning');
      case 'error':
        return events.filter(event => event.status === 'error');
      case 'success':
        return events.filter(event => event.status === 'success');
      case 'memory':
        return events.filter(event => event.type === 'memory_injected' || event.type === 'memory_activity');
      case 'compaction':
        return events.filter(event => event.type === 'compaction');
      default:
        return events;
    }
  },

  classToken(value) {
    return String(value || 'info').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
  },

  teardown() {
    if (typeof this.unsubscribe === 'function') {
      this.unsubscribe();
    }
    this.unsubscribe = null;
  },

  escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }
};

window.RuntimeSurface = RuntimeSurface;
