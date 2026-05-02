// web-ui/js/components/chat.js

const ChatController = {
  container: null,
  messagesContainer: null,
  streamingMessage: null,
  isInitialized: false,

  init() {
    this.container = document.createElement('div');
    this.container.className = 'chat-view';

    // Messages area
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'chat-messages';
    this.container.appendChild(this.messagesContainer);

    // Initialize composer
    ComposerComponent.init();
    this.container.appendChild(ComposerComponent.getElement());

    // Composer callbacks
    ComposerComponent.onSend((content) => this.handleSend(content));

    // Subscribe to messages store
    MessagesStore.subscribe((messages) => {
      this.renderMessages(messages);
    });

    // Subscribe to connection state
    ConnectionStore.subscribe((state) => {
      if (!state.connected) {
        this.showConnectionWarning();
      }
    });

    // WebSocket message handling
    WS.on('message', (data) => this.handleWebSocketMessage(data));

    this.isInitialized = true;
  },

  getElement() {
    return this.container;
  },

  showConnectionWarning() {
    if (this.messagesContainer.children.length === 0) {
      const warning = document.createElement('div');
      warning.className = 'message system';
      warning.innerHTML = `
        <div class="message-content">
          Not connected to jcode Gateway. Make sure jcode is running on port 7643.
        </div>
      `;
      this.messagesContainer.appendChild(warning);
    }
  },

  handleSend(content) {
    const session = SessionStore.currentSession;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content
    };
    MessagesStore.addMessage(userMessage);

    // Set generating state
    ComposerComponent.setGenerating(true);

    // Check if we have a session
    if (!session) {
      this.createAndSendToSession(content);
    } else {
      this.sendToSession(session.id, content);
    }
  },

  async createAndSendToSession(content) {
    try {
      // Create new session
      const newSession = await API.createSession({});
      SessionStore.setCurrentSession(newSession);

      // Send message
      await this.sendToSession(newSession.id, content);
    } catch (e) {
      console.error('Failed to create session:', e);
      ComposerComponent.setGenerating(false);
      this.addSystemMessage('Failed to create session: ' + e.message);
    }
  },

  async sendToSession(sessionId, content) {
    try {
      // Send via WebSocket if connected
      if (WS.getState() === 'open') {
        this.streamingMessage = MessageComponent.createStreamingMessage(this.messagesContainer);
        this.scrollToBottom();

        WS.send({
          type: 'message',
          session_id: sessionId,
          content
        });
      } else {
        // Fallback to HTTP
        const response = await API.sendMessage(sessionId, content);
        ComposerComponent.setGenerating(false);

        if (response.message) {
          MessagesStore.addMessage(response.message);
        }
      }
    } catch (e) {
      console.error('Failed to send message:', e);
      ComposerComponent.setGenerating(false);
      this.addSystemMessage('Failed to send message: ' + e.message);
    }
  },

  handleWebSocketMessage(data) {
    ComposerComponent.setGenerating(false);

    // Handle different message types
    if (data.type === 'chunk' || data.type === 'streaming') {
      this.handleStreamingChunk(data);
    } else if (data.type === 'message' || data.message) {
      const message = data.message || data;
      MessagesStore.addMessage(message);

      if (this.streamingMessage) {
        MessageComponent.finalizeStreamingMessage(
          this.streamingMessage,
          message,
          message.tools?.length > 0
        );
        this.streamingMessage = null;
      }
    } else if (data.type === 'tool') {
      this.handleToolEvent(data);
    } else if (data.type === 'error') {
      console.error('WebSocket error:', data.error);
      this.addSystemMessage('Error: ' + (data.error || 'Unknown error'));
    }
  },

  handleStreamingChunk(data) {
    if (!this.streamingMessage) {
      // Create streaming message if it doesn't exist
      this.streamingMessage = MessageComponent.createStreamingMessage(this.messagesContainer);
    }

    const content = data.content || '';
    MessageComponent.updateStreamingMessage(this.streamingMessage, content);
    this.scrollToBottom();
  },

  handleToolEvent(data) {
    // Handle tool execution events
    console.log('Tool event:', data);
  },

  addSystemMessage(content) {
    const message = {
      id: Date.now().toString(),
      role: 'system',
      content
    };
    MessagesStore.addMessage(message);
  },

  renderMessages(messages) {
    if (!this.isInitialized) return;

    // Clear and re-render
    this.messagesContainer.innerHTML = '';

    messages.forEach(msg => {
      MessageComponent.render(msg, this.messagesContainer);
    });

    this.scrollToBottom();
  },

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  },

  async loadMessages() {
    const session = SessionStore.currentSession;
    if (!session) return;

    try {
      const data = await API.getMessages(session.id);
      MessagesStore.setMessages(data.messages || []);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  },

  clearChat() {
    MessagesStore.clearMessages();
  }
};

window.ChatController = ChatController;