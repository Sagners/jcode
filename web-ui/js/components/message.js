// web-ui/js/components/message.js

const MessageComponent = {
  render(message, container) {
    const div = document.createElement('div');
    div.className = `message ${message.role || 'assistant'}`;
    div.dataset.messageId = message.id;

    // Role label
    const role = document.createElement('div');
    role.className = 'message-role';
    role.textContent = this.getRoleLabel(message.role);
    div.appendChild(role);

    // Content
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = this.formatContent(message.content || '');
    div.appendChild(content);

    // Render tool chains if present
    if (message.tools && message.tools.length > 0) {
      const toolChain = ToolChainComponent.render(message.tools);
      div.appendChild(toolChain);
    }

    // Render live tool if in progress
    if (message.isStreaming) {
      const liveTool = ToolChainComponent.renderLive(message.streamingTool);
      div.appendChild(liveTool);
    }

    container.appendChild(div);
    return div;
  },

  getRoleLabel(role) {
    switch (role) {
      case 'user': return 'You';
      case 'assistant': return 'jcode';
      case 'system': return 'System';
      default: return role || 'Assistant';
    }
  },

  formatContent(content) {
    if (!content) return '';

    // Escape HTML first
    let html = this.escapeHtml(content);

    // Code blocks
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Create a streaming message that updates
  createStreamingMessage(container) {
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.dataset.messageId = 'streaming';

    const role = document.createElement('div');
    role.className = 'message-role';
    role.textContent = 'jcode';
    div.appendChild(role);

    const content = document.createElement('div');
    content.className = 'message-content';
    div.appendChild(content);

    const liveTool = document.createElement('div');
    liveTool.className = 'tool-live';
    liveTool.innerHTML = `
      <span class="tool-indicator-live">◉</span>
      <span class="tool-name">streaming...</span>
    `;
    div.appendChild(liveTool);

    container.appendChild(div);
    return { container: div, content, liveTool };
  },

  updateStreamingMessage(streamingMsg, content) {
    if (streamingMsg.content) {
      streamingMsg.content.innerHTML = this.formatContent(content);
    }
  },

  finalizeStreamingMessage(streamingMsg, message, hasTools) {
    // Remove live indicator
    if (streamingMsg.liveTool) {
      streamingMsg.liveTool.remove();
    }

    // Update content
    if (streamingMsg.content) {
      streamingMsg.content.innerHTML = this.formatContent(message.content || '');
    }

    // Add tools if present
    if (message.tools && message.tools.length > 0) {
      const toolChain = ToolChainComponent.render(message.tools);
      streamingMsg.container.appendChild(toolChain);
    }

    // Update message ID
    streamingMsg.container.dataset.messageId = message.id;
  }
};

window.MessageComponent = MessageComponent;