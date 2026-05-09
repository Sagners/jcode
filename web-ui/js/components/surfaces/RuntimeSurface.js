// web-ui/js/components/surfaces/RuntimeSurface.js

const RuntimeSurface = {
  render(surface) {
    const container = document.createElement('div');
    container.className = 'runtime-surface-body';
    container.dataset.surfaceId = surface.id;
    container.innerHTML = `
      <div class="runtime-summary-grid">
        <div class="runtime-summary-item">
          <span class="runtime-summary-label">Phase</span>
          <strong id="runtimePhase_${surface.id}">idle</strong>
        </div>
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
      </div>
      <div class="runtime-event-list" id="runtimeEvents_${surface.id}">
        <div class="runtime-empty">
          <span class="status-dot disconnected"></span>
          <span>Waiting for gateway events.</span>
        </div>
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
    const eventsEl = container.querySelector(`#runtimeEvents_${surface.id}`);

    RuntimeStore.subscribe(({ events, metrics }) => {
      if (phaseEl) phaseEl.textContent = metrics.phase || 'idle';
      if (transportEl) transportEl.textContent = metrics.connectionType || 'unknown';
      if (providerEl) providerEl.textContent = metrics.provider || 'unknown';
      if (tokensEl) tokensEl.textContent = `${metrics.inputTokens || 0} / ${metrics.outputTokens || 0}`;

      if (!eventsEl) return;
      if (!events.length) {
        eventsEl.innerHTML = `
          <div class="runtime-empty">
            <span class="status-dot disconnected"></span>
            <span>Waiting for gateway events.</span>
          </div>
        `;
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

  escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }
};

window.RuntimeSurface = RuntimeSurface;
