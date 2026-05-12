// web-ui/js/components/surfaces/AgentSessionSurface.js

const AgentSessionSurface = {
  // Store active surface IDs for message routing
  activeSurfaces: new Set(),
  cleanups: new Map(),

  render(surface) {
    this.teardown(surface.id);
    // Track this surface
    this.activeSurfaces.add(surface.id);

    const container = document.createElement('div');
    container.className = 'session-body';
    container.dataset.surfaceId = surface.id;

    const messagesId = `messages_${surface.id}`;
    container.innerHTML = `
      <div class="session-messages" id="${messagesId}">
        <div class="empty-state session-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <p>Start a conversation</p>
          <p class="session-empty-hint">Connect to the gateway, then send a message to begin.</p>
          <div class="session-empty-actions">
            <button class="session-empty-action" data-action="connection">Connection</button>
            <button class="session-empty-action" data-action="runtime">Runtime</button>
            <button class="session-empty-action" data-action="starter">Starter prompt</button>
          </div>
        </div>
      </div>
      <div class="session-connection-banner" id="connectionBanner_${surface.id}" hidden>
        <span class="status-dot disconnected"></span>
        <span class="session-connection-text">Gateway not connected.</span>
        <button class="inline-action" id="openConnectionSettings_${surface.id}">Connection settings</button>
      </div>
      <div class="composer">
        <div class="composer-route-plan" id="composerRoutePlan_${surface.id}">
          ${this.renderRoutePlan()}
        </div>
        <div class="composer-input-row">
          <button class="composer-attachment" title="Attach file">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>
          <textarea class="composer-input" placeholder="Connect to jcode Gateway to start messaging"
            rows="1" id="msgInput_${surface.id}"></textarea>
          <button class="composer-send" id="sendBtn_${surface.id}" title="Send message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `;

    this.setupEventListeners(container, surface);
    this.subscribeToMessages(surface.id);
    this.bindConnectionState(container, surface);
    this.bindRoutePlan(container, surface);
    container.__surfaceCleanup = () => this.teardown(surface.id);

    return container;
  },

  setupEventListeners(container, surface) {
    const sendBtn = container.querySelector(`#sendBtn_${surface.id}`);
    const input = container.querySelector(`#msgInput_${surface.id}`);

    if (sendBtn && input) {
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 150) + 'px';
      });

      sendBtn.addEventListener('click', () => {
        const content = input.value.trim();
        if (content) {
          this.sendMessage(surface.id, content);
          input.value = '';
          input.style.height = 'auto';
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendBtn.click();
        }
      });
    }

    container.querySelector('[data-action="connection"]')?.addEventListener('click', () => {
      if (typeof WorkspaceController !== 'undefined') {
        WorkspaceController.openSettingsSurface('connection');
      }
    });

    container.querySelector('[data-action="runtime"]')?.addEventListener('click', () => {
      if (typeof WorkspaceController !== 'undefined') {
        WorkspaceController.openRuntimeSurface();
      }
    });

    container.querySelector('[data-action="starter"]')?.addEventListener('click', () => {
      if (!input) return;
      input.value = 'Summarize the current workspace state and recommend the next action.';
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 150) + 'px';
      input.focus();
    });

    const settingsBtn = container.querySelector(`#openConnectionSettings_${surface.id}`);
    settingsBtn?.addEventListener('click', () => {
      if (typeof WorkspaceController !== 'undefined') {
        WorkspaceController.openSettingsSurface('connection');
      }
    });
  },

  bindRoutePlan(container, surface) {
    const routePlan = container.querySelector(`#composerRoutePlan_${surface.id}`);
    if (!routePlan || !window.ModelRoutingStore?.subscribe) return;

    const render = state => {
      routePlan.innerHTML = this.renderRoutePlan(state);
    };
    const unsubscribe = ModelRoutingStore.subscribe(render);
    routePlan.addEventListener('click', event => {
      const target = event.target.closest?.('[data-action="model-routing"]');
      if (!target) return;
      window.WorkspaceController?.openSettingsSurface?.('model');
    });
    this.addCleanup(surface.id, unsubscribe);
  },

  bindConnectionState(container, surface) {
    const input = container.querySelector(`#msgInput_${surface.id}`);
    const sendBtn = container.querySelector(`#sendBtn_${surface.id}`);
    const banner = container.querySelector(`#connectionBanner_${surface.id}`);
    const bannerText = banner?.querySelector('.session-connection-text');
    const dot = banner?.querySelector('.status-dot');

    const unsubscribe = ConnectionStore.subscribe((state) => {
      const canSend = state.connected;
      if (input) {
        input.disabled = !canSend;
        input.placeholder = canSend
          ? 'Type your message... (Enter to send, Shift+Enter for new line)'
          : 'Connect to jcode Gateway to start messaging';
      }
      if (sendBtn) {
        sendBtn.disabled = !canSend;
      }
      if (banner) {
        banner.hidden = canSend;
      }
      if (bannerText) {
        bannerText.textContent = state.gatewayReachable
          ? (state.detail || 'Gateway reachable. Pair this browser before sending.')
          : (state.detail || 'Gateway offline. Start jcode serve first.');
      }
      if (dot) {
        dot.className = `status-dot ${state.connecting ? 'connecting' : state.connected ? 'connected' : 'disconnected'}`;
      }
    });
    this.addCleanup(surface.id, unsubscribe);
  },

  sendMessage(sessionId, content) {
    // Add user message to display immediately
    this.addMessageToDisplay({
      role: 'user',
      content: content,
      timestamp: Date.now()
    }, sessionId);

    // Send via WebSocket
    if (WS.getState() === 'open') {
      WS.send({
        type: 'message',
        content,
        images: []
      });
      console.log('Message sent via WebSocket:', { content });
    } else {
      this.addMessageToDisplay({
        role: 'system',
        content: 'Gateway is not connected. Open Connection settings, pair this web UI, then try again.',
        timestamp: Date.now()
      }, sessionId);
    }
  },

  addMessageToDisplay(message, surfaceId) {
    const messagesId = `messages_${surfaceId}`;
    const messagesContainer = document.getElementById(messagesId);
    if (!messagesContainer) {
      console.log('Messages container not found:', messagesId);
      return;
    }

    // Remove empty state if present
    const emptyState = messagesContainer.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }

    const messageEl = document.createElement('div');
    const roleClass = message.role === 'user' ? 'user' : message.role === 'assistant' ? 'assistant' : 'system';
    messageEl.className = `message message-${roleClass}`;

    const roleLabel = message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Assistant' : 'System';
    const timeStr = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageEl.innerHTML = `
      <div class="message-header">
        <span class="message-role">${roleLabel}</span>
        <span class="message-time">${timeStr}</span>
      </div>
      <div class="message-content">${this.escapeHtml(message.content)}</div>
    `;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    console.log('Message added to display:', roleLabel, message.content.substring(0, 50));
  },

  subscribeToMessages(sessionId) {
    const unsubscribe = WS.on('message', (data) => {
      console.log('WebSocket message received:', data);
      if (data.type === 'message' || data.type === 'chunk' || data.type === 'assistant' || data.type === 'response') {
        if (data.session_id === sessionId || !data.session_id) {
          this.handleIncomingMessage(data, sessionId);
        }
      }
    });
    this.addCleanup(sessionId, unsubscribe);
  },

  addCleanup(surfaceId, cleanup) {
    if (typeof cleanup !== 'function') return;
    const cleanups = this.cleanups.get(surfaceId) || [];
    cleanups.push(cleanup);
    this.cleanups.set(surfaceId, cleanups);
  },

  teardown(surfaceId) {
    const cleanups = this.cleanups.get(surfaceId) || [];
    cleanups.forEach(cleanup => cleanup());
    this.cleanups.delete(surfaceId);
    this.activeSurfaces.delete(surfaceId);
  },

  handleIncomingMessage(data, sessionId) {
    console.log('Handling incoming message:', data.type, sessionId);

    if (data.type === 'chunk' || data.type === 'assistant' || data.type === 'response' || data.type === 'text' || data.type === 'text_delta' || data.type === 'stream_text') {
      this.addMessageToDisplay({
        role: 'assistant',
        content: data.content || data.delta || data.text || '',
        timestamp: Date.now()
      }, sessionId);
    } else if (data.type === 'message') {
      this.addMessageToDisplay({
        role: 'assistant',
        content: data.content || '',
        timestamp: Date.now()
      }, sessionId);
    }
  },

  renderRoutePlan(state = null) {
    const routing = state || window.ModelRoutingStore?.snapshot?.() || {};
    const modelLabel = (value, compact = false) => window.ModelRoutingStore?.modelLabel?.(value, compact) || value || 'unset';
    const modeLabel = window.ModelRoutingStore?.modeLabel?.(routing.routingMode) || routing.routingMode || 'Role routing';
    const chips = [
      ['Default', routing.defaultModel],
      ['Plan', routing.planningModel],
      ['Exec', routing.executionModel],
      ['Review', routing.reviewModel],
      ['Fallback', routing.fallbackModel]
    ];

    return `
      <button type="button" class="composer-route-summary" data-action="model-routing" title="Open model routing settings">
        <span>Route</span>
        <strong>${this.escapeHtml(modeLabel)}</strong>
      </button>
      <div class="composer-route-chips" aria-label="Current model route">
        ${chips.map(([label, value]) => `
          <span class="composer-route-chip">
            <span>${this.escapeHtml(label)}</span>
            <strong>${this.escapeHtml(modelLabel(value, true))}</strong>
          </span>
        `).join('')}
      </div>
    `;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

window.AgentSessionSurface = AgentSessionSurface;
