// web-ui/js/components/surfaces/RuntimeSurface.js

const RuntimeSurface = {
  render(surface) {
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
      <div class="runtime-event-list" id="runtimeEvents_${surface.id}">
        ${this.renderEmpty('Waiting for gateway events.')}
      </div>
    `;

    this.bind(container, surface);
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
    const eventsEl = container.querySelector(`#runtimeEvents_${surface.id}`);

    RuntimeStore.subscribe(({ events, metrics }) => {
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

      if (!eventsEl) return;
      if (!events.length) {
        eventsEl.innerHTML = this.renderEmpty('Waiting for gateway events.');
        return;
      }

      eventsEl.innerHTML = events.map(event => this.renderEvent(event)).join('');
    });
  },

  renderEvent(event) {
    const time = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const detail = event.detail ? `<p>${this.escapeHtml(event.detail)}</p>` : '';
    return `
      <div class="runtime-event runtime-event-${this.escapeHtml(event.status)}">
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

  renderTool(tool) {
    return `
      <div class="runtime-tool runtime-tool-${this.escapeHtml(tool.status)}">
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

  escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }
};

window.RuntimeSurface = RuntimeSurface;
