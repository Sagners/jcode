// web-ui/js/components/workspace/AgentSessionSurface.js

const AgentSessionSurface = {
  // Create and render the surface component
  create(surfaceId, sessionId) {
    const container = document.createElement('div');
    container.className = 'surface-container agent-session-surface';
    container.id = `surface-${surfaceId}`;
    container.dataset.surfaceId = surfaceId;
    container.dataset.sessionId = sessionId;

    container.innerHTML = `
      <div class="surface-header">
        <span class="surface-status idle" id="status-${surfaceId}"></span>
        <span class="surface-title" id="title-${surfaceId}">Session</span>
        <div class="surface-actions">
          <button class="surface-action-btn" id="reload-${surfaceId}" title="Reload">↻</button>
          <button class="surface-action-btn" id="minimize-${surfaceId}" title="Minimize">─</button>
          <button class="surface-action-btn danger" id="close-${surfaceId}" title="Close" data-action="close">✕</button>
        </div>
      </div>
      <div class="surface-body session-body" id="body-${surfaceId}">
        ${this.renderMessages(sessionId)}
      </div>
      <div class="surface-footer" id="footer-${surfaceId}">
        ${this.renderComposer(surfaceId)}
      </div>
      <div class="surface-meta">
        <span class="meta-item" id="lastActive-${surfaceId}">last active: never</span>
        <span class="meta-item" id="tokens-${surfaceId}">tokens: 0</span>
      </div>
    `;

    this.attachEvents(container, surfaceId, sessionId);
    return container;
  },

  // Render the messages area
  renderMessages(sessionId) {
    const session = SessionStore.getSession(sessionId);
    const messages = session ? MessagesStore.messages.filter(m => m.sessionId === sessionId) : [];

    if (!messages || messages.length === 0) {
      return `
        <div class="session-messages" id="messages-${sessionId}">
          <div class="empty-state">
            <p>No messages yet</p>
            <p style="color: var(--text-tertiary)">Start a conversation below</p>
          </div>
        </div>
      `;
    }

    const messagesHtml = messages.map(msg => this.renderMessage(msg)).join('');
    return `
      <div class="session-messages" id="messages-${sessionId}">
        ${messagesHtml}
      </div>
    `;
  },

  // Render a single message
  renderMessage(message) {
    const time = new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    const roleClass = message.role === 'user' ? 'message-user' : 'message-assistant';
    const roleLabel = message.role === 'user' ? 'You' : (message.role === 'assistant' ? 'Claude' : message.role);

    return `
      <div class="message ${roleClass}" data-message-id="${message.id}">
        <div class="message-header">
          <span class="message-role">${roleLabel}</span>
          <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${this.escapeHtml(message.content || '')}</div>
        ${message.tool ? `<div class="message-tool">◉ ${message.tool}</div>` : ''}
      </div>
    `;
  },

  // Render the input composer
  renderComposer(surfaceId) {
    return `
      <div class="composer">
        <button class="composer-attachment" id="attachment-${surfaceId}" title="Attach files">📎</button>
        <textarea
          class="composer-input"
          id="input-${surfaceId}"
          placeholder="Type a message..."
          rows="1"
        ></textarea>
        <button class="composer-send" id="send-${surfaceId}">▶</button>
      </div>
    `;
  },

  // Attach event listeners
  attachEvents(container, surfaceId, sessionId) {
    const textarea = container.querySelector(`#input-${surfaceId}`);
    const sendBtn = container.querySelector(`#send-${surfaceId}`);
    const closeBtn = container.querySelector(`#close-${surfaceId}`);
    const reloadBtn = container.querySelector(`#reload-${surfaceId}`);
    const minimizeBtn = container.querySelector(`#minimize-${surfaceId}`);
    const attachmentBtn = container.querySelector(`#attachment-${surfaceId}`);

    // Textarea auto-resize
    if (textarea) {
      textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
      });

      // Enter to send (Shift+Enter for newline)
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSend(surfaceId, sessionId);
        }
      });
    }

    // Send button
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        this.handleSend(surfaceId, sessionId);
      });
    }

    // Action buttons
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.handleClose(surfaceId);
      });
    }

    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        this.handleReload(surfaceId, sessionId);
      });
    }

    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => {
        this.handleMinimize(surfaceId);
      });
    }

    if (attachmentBtn) {
      attachmentBtn.addEventListener('click', () => {
        this.handleAttachment(surfaceId);
      });
    }
  },

  // Handle send message
  handleSend(surfaceId, sessionId) {
    const input = document.getElementById(`input-${surfaceId}`);
    if (!input) return;

    const content = input.value.trim();
    if (!content) return;

    // Add user message
    this.addMessage(surfaceId, sessionId, 'user', content);

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Update last active
    this.updateLastActive(surfaceId, new Date());

    // Trigger custom event for external handling (placeholder for API)
    const event = new CustomEvent('agent-session:send', {
      detail: { surfaceId, sessionId, content }
    });
    document.dispatchEvent(event);
  },

  // Handle close action
  handleClose(surfaceId) {
    const event = new CustomEvent('agent-session:close', {
      detail: { surfaceId }
    });
    document.dispatchEvent(event);

    // Notify store to remove surface
    SurfaceStore.deleteSurface(surfaceId);
  },

  // Handle reload action
  handleReload(surfaceId, sessionId) {
    const event = new CustomEvent('agent-session:reload', {
      detail: { surfaceId, sessionId }
    });
    document.dispatchEvent(event);
  },

  // Handle minimize action
  handleMinimize(surfaceId) {
    SurfaceStore.toggleMinimized(surfaceId);
  },

  // Handle attachment
  handleAttachment(surfaceId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        const event = new CustomEvent('agent-session:attachment', {
          detail: { surfaceId, files }
        });
        document.dispatchEvent(event);
      }
    });
    input.click();
  },

  // Add a message to the message stream
  addMessage(surfaceId, sessionId, role, content, options = {}) {
    const messagesContainer = document.getElementById(`messages-${sessionId}`);
    if (!messagesContainer) return;

    // Remove empty state if present
    const emptyState = messagesContainer.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }

    // Create message object
    const message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      sessionId,
      role,
      content,
      timestamp: Date.now(),
      ...options
    };

    // Add to store
    MessagesStore.addMessage(message);

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.innerHTML = this.renderMessage(message);
    const messageDiv = messageEl.firstElementChild;

    // Append to messages container
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    const bodyContainer = document.getElementById(`body-${surfaceId}`);
    if (bodyContainer) {
      bodyContainer.scrollTop = bodyContainer.scrollHeight;
    }

    return message;
  },

  // Update status indicator
  setStatus(surfaceId, status) {
    const statusEl = document.getElementById(`status-${surfaceId}`);
    if (statusEl) {
      statusEl.className = `surface-status ${status}`;
    }
  },

  // Update last active time
  updateLastActive(surfaceId, time) {
    const lastActiveEl = document.getElementById(`lastActive-${surfaceId}`);
    if (lastActiveEl) {
      const now = new Date();
      const diff = now - time;
      let displayTime;

      if (diff < 60000) {
        displayTime = '刚刚';
      } else if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        displayTime = `${mins} 分钟前`;
      } else {
        displayTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      lastActiveEl.textContent = `last active: ${displayTime}`;
    }
  },

  // Update token count
  updateTokens(surfaceId, tokens) {
    const tokensEl = document.getElementById(`tokens-${surfaceId}`);
    if (tokensEl) {
      tokensEl.textContent = `tokens: ~${(tokens / 1000).toFixed(1)}k`;
    }
  },

  // Update session title
  setTitle(surfaceId, title) {
    const titleEl = document.getElementById(`title-${surfaceId}`);
    if (titleEl) {
      titleEl.textContent = title || 'Session';
    }
  },

  // Utility: escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

window.AgentSessionSurface = AgentSessionSurface;