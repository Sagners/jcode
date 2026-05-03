// web-ui/js/components/surfaces/AgentSessionSurface.js

const AgentSessionSurface = {
  // Store active surface IDs for message routing
  activeSurfaces: new Set(),

  render(surface) {
    // Track this surface
    this.activeSurfaces.add(surface.id);

    const container = document.createElement('div');
    container.className = 'session-body';
    container.dataset.surfaceId = surface.id;

    const messagesId = `messages_${surface.id}`;
    container.innerHTML = `
      <div class="session-messages" id="${messagesId}">
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <p>Start a conversation</p>
          <p style="font-size: var(--text-sm); color: var(--text-tertiary);">Send a message to begin</p>
        </div>
      </div>
      <div class="composer">
        <button class="composer-attachment" title="Attach file">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
        </button>
        <textarea class="composer-input" placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          rows="1" id="msgInput_${surface.id}"></textarea>
        <button class="composer-send" id="sendBtn_${surface.id}" title="Send message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    `;

    this.setupEventListeners(container, surface);
    this.subscribeToMessages(surface.id);

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
        session_id: sessionId,
        content: content
      });
      console.log('Message sent via WebSocket:', { session_id: sessionId, content });
    } else {
      this.addMessageToDisplay({
        role: 'system',
        content: 'Error: WebSocket not connected. Please refresh the page.',
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
    WS.on('message', (data) => {
      console.log('WebSocket message received:', data);
      if (data.type === 'message' || data.type === 'chunk' || data.type === 'assistant' || data.type === 'response') {
        if (data.session_id === sessionId || !data.session_id) {
          this.handleIncomingMessage(data, sessionId);
        }
      }
    });
  },

  handleIncomingMessage(data, sessionId) {
    console.log('Handling incoming message:', data.type, sessionId);

    if (data.type === 'chunk' || data.type === 'assistant' || data.type === 'response') {
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

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

window.AgentSessionSurface = AgentSessionSurface;