// web-ui/js/components/tool-chain.js

const ToolChainComponent = {
  render(tools) {
    const container = document.createElement('div');
    container.className = 'tool-chains';

    if (!tools || tools.length === 0) return container;

    tools.forEach(tool => {
      const toolDiv = this.renderTool(tool);
      container.appendChild(toolDiv);
    });

    return container;
  },

  renderTool(tool) {
    const toolDiv = document.createElement('div');
    toolDiv.className = 'tool-chain';

    // Create details/summary element
    const details = document.createElement('details');
    details.className = 'tool-chain';

    const summary = document.createElement('summary');
    summary.className = 'tool-chain-summary';
    summary.innerHTML = this.renderSummary(tool);

    const detail = document.createElement('div');
    detail.className = 'tool-chain-detail mono';
    detail.innerHTML = this.renderDetail(tool);

    details.appendChild(summary);
    details.appendChild(detail);
    toolDiv.appendChild(details);

    return toolDiv;
  },

  renderSummary(tool) {
    const params = tool.inputs ? Object.keys(tool.inputs).length : 0;
    const statusIcon = tool.status === 'running' ? '◉' : '●';
    return `
      <span class="tool-indicator">${statusIcon}</span>
      ${this.escapeHtml(tool.name || 'Unknown Tool')}
      <span class="tool-count">${params} params</span>
    `;
  },

  renderDetail(tool) {
    let html = '';

    // Tool name
    html += `<div class="tool-detail-line"><span class="tool-indicator">●</span> ${this.escapeHtml(tool.name || 'Unknown')}</div>`;

    // Inputs
    if (tool.inputs) {
      html += `<div class="tool-meta">${this.formatJson(tool.inputs)}</div>`;
    }

    // Output
    if (tool.output !== undefined) {
      const output = typeof tool.output === 'object'
        ? JSON.stringify(tool.output, null, 2)
        : String(tool.output);
      html += `<div class="tool-detail-out">${this.escapeHtml(output)}</div>`;
    }

    // Error
    if (tool.error) {
      html += `<div class="tool-detail-out" style="color: var(--error)">Error: ${this.escapeHtml(tool.error)}</div>`;
    }

    return html;
  },

  renderLive(streamingTool) {
    const div = document.createElement('div');
    div.className = 'tool-live';
    div.innerHTML = `
      <span class="tool-indicator-live">◉</span>
      <span class="tool-name">${this.escapeHtml(streamingTool?.name || 'Processing...')}</span>
    `;
    return div;
  },

  formatJson(obj) {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  },

  escapeHtml(text) {
    if (typeof text !== 'string') text = String(text || '');
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};

window.ToolChainComponent = ToolChainComponent;