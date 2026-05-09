// web-ui/js/protocol.js

const GatewayProtocol = {
  normalizeRuntimeEvent(message) {
    if (!message?.type) return null;

    const definition = this.eventDefinition(message);
    return {
      type: message.type,
      title: definition.title,
      status: definition.status,
      detail: this.eventDetail(message),
      timestamp: Date.now(),
      metricUpdates: this.metricUpdates(message),
      meta: {
        id: message.id || null,
        name: message.name || null
      }
    };
  },

  eventDefinition(message) {
    const definitions = {
      ack: ['Request acknowledged', 'info'],
      history: ['History synchronized', 'success'],
      tool_start: ['Tool started', 'running'],
      tool_input: ['Tool input streaming', 'running'],
      tool_exec: ['Tool executing', 'running'],
      batch_progress: ['Batch progress', 'running'],
      tokens: ['Token usage updated', 'info'],
      connection_type: ['Transport selected', 'info'],
      connection_phase: ['Connection phase', 'running'],
      status_detail: ['Provider status', 'info'],
      upstream_provider: ['Upstream provider', 'info'],
      swarm_status: ['Swarm status updated', 'info'],
      swarm_plan: ['Swarm plan synchronized', 'info'],
      memory_injected: ['Memory injected', 'success'],
      memory_activity: ['Memory activity', 'info'],
      compaction: ['Context compacted', 'warning'],
      mcp_status: ['MCP status updated', 'info'],
      generated_image: ['Generated image', 'success'],
      interrupted: ['Turn interrupted', 'warning'],
      done: ['Turn completed', 'success'],
      error: ['Gateway error', 'error']
    };

    if (message.type === 'tool_done') {
      return {
        title: message.error ? 'Tool failed' : 'Tool completed',
        status: message.error ? 'error' : 'success'
      };
    }

    const definition = definitions[message.type];
    if (!definition) {
      return { title: `Event: ${message.type}`, status: 'info' };
    }
    return { title: definition[0], status: definition[1] };
  },

  eventDetail(message) {
    switch (message.type) {
      case 'tool_start':
      case 'tool_exec':
      case 'tool_done':
        return [message.name, message.error || message.output]
          .filter(Boolean)
          .join(' - ')
          .slice(0, 220);
      case 'tool_input':
        return this.compact(message.delta);
      case 'tokens':
        return `input ${message.input || 0}, output ${message.output || 0}`;
      case 'connection_type':
        return message.connection || '';
      case 'connection_phase':
        return message.phase || '';
      case 'status_detail':
        return message.detail || '';
      case 'upstream_provider':
        return message.provider || '';
      case 'mcp_status':
        return (message.servers || []).join(', ');
      case 'swarm_status':
        return `${message.members?.length || 0} members`;
      case 'swarm_plan':
        return `${message.items?.length || 0} items`;
      case 'memory_injected':
        return `${message.count || 0} memories, ${message.prompt_chars || 0} chars`;
      case 'memory_activity':
        return message.activity?.status || '';
      case 'compaction':
        return [
          message.trigger,
          message.tokens_saved ? `${message.tokens_saved} tokens saved` : null,
          message.messages_compacted ? `${message.messages_compacted} messages compacted` : null
        ].filter(Boolean).join(' - ');
      case 'generated_image':
        return [message.output_format, message.path].filter(Boolean).join(' - ');
      case 'error':
        return message.message || '';
      case 'history':
        return `${message.messages?.length || 0} messages`;
      default:
        return '';
    }
  },

  metricUpdates(message) {
    switch (message.type) {
      case 'pong':
        return { phase: 'online' };
      case 'history':
        return {
          provider: message.provider_name || message.provider_model,
          inputTokens: message.total_tokens?.[0],
          outputTokens: message.total_tokens?.[1],
          phase: message.activity?.is_processing ? 'processing' : 'ready',
          messageCount: Array.isArray(message.messages) ? message.messages.length : undefined
        };
      case 'tokens':
        return {
          inputTokens: message.input || 0,
          outputTokens: message.output || 0,
          cacheReadTokens: message.cache_read_input || 0,
          cacheCreationTokens: message.cache_creation_input || 0
        };
      case 'connection_type':
        return { connectionType: message.connection };
      case 'connection_phase':
        return { phase: message.phase || 'connecting' };
      case 'upstream_provider':
        return { provider: message.provider };
      case 'mcp_status':
        return { mcpServers: message.servers || [] };
      case 'swarm_status':
        return { swarmMembers: message.members || [] };
      case 'swarm_plan':
        return { planItems: message.items || [] };
      case 'tool_start':
      case 'tool_exec':
        return {
          phase: 'running tool',
          activeTool: this.toolMetric(message)
        };
      case 'tool_done':
        return {
          phase: message.error ? 'tool error' : 'processing',
          completedTool: this.toolMetric(message),
          lastError: message.error || undefined
        };
      case 'memory_injected':
        return {
          memoryCount: message.count || 0,
          memoryChars: message.prompt_chars || 0
        };
      case 'compaction':
        return {
          compaction: {
            trigger: message.trigger,
            tokensSaved: message.tokens_saved || 0,
            preTokens: message.pre_tokens || null,
            postTokens: message.post_tokens || null
          }
        };
      case 'done':
        return { phase: 'ready' };
      case 'error':
        return { phase: 'error', lastError: message.message || 'Gateway error' };
      default:
        return {};
    }
  },

  toolMetric(message) {
    return {
      id: message.id || message.name || `tool-${Date.now()}`,
      name: message.name || 'tool',
      status: message.type === 'tool_done' ? (message.error ? 'error' : 'done') : 'running'
    };
  },

  compact(value) {
    if (!value) return '';
    const singleLine = String(value).replace(/\s+/g, ' ').trim();
    return singleLine.length > 220 ? `${singleLine.slice(0, 220)}...` : singleLine;
  }
};

window.GatewayProtocol = GatewayProtocol;
