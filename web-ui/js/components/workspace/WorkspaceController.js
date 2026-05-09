// web-ui/js/components/workspace/WorkspaceController.js

const WorkspaceController = {
  container: null,
  initialized: false,

  init() {
    if (this.initialized) return;
    this.container = document.getElementById('laneContent');
    if (!this.container) {
      console.error('WorkspaceController: laneContent container not found');
      return;
    }
    this.initialized = true;

    this.initLaneNavigator();
    this.initToolbar();
    this.loadWorkspace();
    this.setupKeyboardShortcuts();
    this.setupBeforeUnload();
  },

  initLaneNavigator() {
    // Subscribe to LaneStore for lane list updates
    LaneStore.subscribe(({ lanes, activeLane }) => {
      this.renderLaneList(lanes, activeLane);
    });

    // Bind add lane button
    const addBtn = document.getElementById('addLaneBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.handleAddLane());
    }
  },

  renderLaneList(lanes, activeLane) {
    const container = document.getElementById('laneList');
    if (!container) return;

    container.innerHTML = '';

    if (!lanes || lanes.length === 0) {
      container.innerHTML = `
        <div class="lane-list-empty" style="padding: var(--space-4); text-align: center; color: var(--text-tertiary);">
          No lanes yet
        </div>
      `;
      return;
    }

    lanes.forEach(lane => {
      const item = document.createElement('button');
      item.className = 'lane-item';
      item.dataset.laneId = lane.id;

      const isActive = activeLane && activeLane.id === lane.id;
      if (isActive) {
        item.classList.add('active');
      }

      item.innerHTML = `
        <svg class="lane-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
        <span class="lane-item-title">${lane.name || 'Untitled Lane'}</span>
        <span class="lane-item-status ${lane.status || 'idle'}"></span>
      `;

      // Click to select lane
      item.addEventListener('click', () => this.handleLaneClick(lane));

      // Right-click to delete
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.handleLaneContextMenu(lane, e);
      });

      container.appendChild(item);
    });
  },

  renderActiveLane() {
    const { lanes, activeLane } = LaneStore;

    if (!lanes || lanes.length === 0) {
      this.renderEmptyState();
      return;
    }

    // Get the current active lane
    const currentLane = activeLane || lanes[0];
    if (currentLane) {
      this.renderLaneContent(currentLane);
    } else {
      this.renderEmptyState();
    }
  },

  renderLaneContent(lane) {
    // Clear container
    this.container.innerHTML = '';

    if (!lane.columns || lane.columns.length === 0) {
      this.renderLaneEmptyState(lane);
      return;
    }

    // Render columns
    lane.columns.forEach((column, colIndex) => {
      const columnEl = this.createColumnElement(column, colIndex);
      this.container.appendChild(columnEl);
    });
  },

  createColumnElement(column, colIndex) {
    const columnEl = document.createElement('div');
    columnEl.className = 'column';
    columnEl.dataset.columnIndex = colIndex;

    if (!column.surfaces || column.surfaces.length === 0) {
      columnEl.innerHTML = `
        <div class="column-placeholder" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          border: 1px dashed var(--border);
          border-radius: var(--radius-md);
          color: var(--text-tertiary);
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5">
            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <span style="margin-top: var(--space-2); font-size: var(--text-sm);">Add surface</span>
        </div>
      `;
      return columnEl;
    }

    // Render surfaces based on kind
    column.surfaces.forEach((surface, surfIndex) => {
      const surfaceEl = this.createSurfaceElement(surface, surfIndex);
      columnEl.appendChild(surfaceEl);
    });

    return columnEl;
  },

  createSurfaceElement(surface, surfIndex) {
    const surfaceEl = document.createElement('div');
    surfaceEl.className = `surface-container ${surface.kind}-surface`;
    surfaceEl.dataset.surfaceIndex = surfIndex;
    surfaceEl.dataset.surfaceKind = surface.kind || 'unknown';
    surfaceEl.dataset.surfaceId = surface.id;

    // Common header
    const header = document.createElement('div');
    header.className = 'surface-header';
    header.innerHTML = `
      <span class="surface-status ${surface.status || 'idle'}"></span>
      <span class="surface-title">${surface.title || 'Untitled'}</span>
      <div class="surface-actions">
        <button class="surface-action-btn" data-action="minimize" title="Minimize">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button class="surface-action-btn danger" data-action="close" title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
    surfaceEl.appendChild(header);

    // Render content based on surface kind
    const body = document.createElement('div');
    body.className = 'surface-body';

    switch (surface.kind) {
      case 'settings':
        body.appendChild(SettingsSurface.render(surface));
        break;

      case 'agent-session':
        body.appendChild(AgentSessionSurface.render(surface));
        break;

      case 'workspace-files':
        body.appendChild(WorkspaceFilesSurface.render(surface));
        break;

      default:
        body.innerHTML = `
          <div class="empty-state">
            <span style="font-size: var(--text-xs); text-transform: uppercase; color: var(--text-tertiary);">
              ${surface.kind || 'surface'}
            </span>
            <p style="color: var(--text-tertiary);">Surface content not implemented</p>
          </div>
        `;
    }
    surfaceEl.appendChild(body);

    // Add event listeners
    this.setupSurfaceEventListeners(surfaceEl, surface);

    return surfaceEl;
  },

  renderAgentSessionSurface(surface) {
    return `
      <div class="session-body">
        <div class="session-messages">
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p>Start a conversation</p>
            <p style="font-size: var(--text-sm); color: var(--text-tertiary);">
              Send a message to begin a session
            </p>
          </div>
        </div>
        <div class="composer">
          <textarea class="composer-input" placeholder="Type your message..."
            rows="1" id="msgInput_${surface.id}"></textarea>
          <button class="composer-send" id="sendBtn_${surface.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `;
  },

  renderWorkspaceFilesSurface(surface) {
    return `
      <div class="file-tree">
        <div class="file-tree-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="file-tree-empty-text">No workspace opened</span>
        </div>
      </div>
    `;
  },

  setupSurfaceEventListeners(surfaceEl, surface) {
    // Close button
    const closeBtn = surfaceEl.querySelector('[data-action="close"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        SurfaceStore.deleteSurface(surface.id);
        this.renderActiveLane();
      });
    }

    // Minimize button
    const minBtn = surfaceEl.querySelector('[data-action="minimize"]');
    if (minBtn) {
      minBtn.addEventListener('click', () => {
        SurfaceStore.toggleMinimized(surface.id);
      });
    }

    // Session send button
    if (surface.kind === 'agent-session') {
      const sendBtn = surfaceEl.querySelector(`#sendBtn_${surface.id}`);
      const input = surfaceEl.querySelector(`#msgInput_${surface.id}`);

      if (sendBtn && input) {
        sendBtn.addEventListener('click', () => {
          const content = input.value.trim();
          if (content) {
            this.sendMessage(surface.id, content);
            input.value = '';
          }
        });

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
          }
        });
      }
    }
  },

  sendMessage(sessionId, content) {
    if (WS.getState() === 'open') {
      WS.send({
        type: 'message',
        session_id: sessionId,
        content: content
      });
    }
  },

  renderEmptyState() {
    this.container.innerHTML = `
      <div class="lane-content-empty">
        <svg class="lane-content-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
          <line x1="15" y1="3" x2="15" y2="21"></line>
        </svg>
        <span class="lane-content-empty-text">No lanes available</span>
        <p style="color: var(--text-tertiary); font-size: var(--text-sm);">
          Click the + button above to create your first lane
        </p>
      </div>
    `;
  },

  renderLaneEmptyState(lane) {
    this.container.innerHTML = `
      <div class="lane-content-empty">
        <svg class="lane-content-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <span class="lane-content-empty-text">${lane.name || 'This lane'} is empty</span>
        <p style="color: var(--text-tertiary); font-size: var(--text-sm);">
          Add columns and surfaces to get started
        </p>
      </div>
    `;
  },

  loadWorkspace() {
    // Load from localStorage first
    WorkspaceStore.load();
    LaneStore.load();
    SurfaceStore.load();

    // Create defaults if empty
    if (WorkspaceStore.workspaces.length === 0) {
      const defaultWorkspace = WorkspaceStore.createWorkspace({
        name: 'Default Workspace'
      });
      WorkspaceStore.setActiveWorkspace(defaultWorkspace);
    }

    // Check if we need to create default lane
    if (LaneStore.lanes.length === 0) {
      const mainLane = LaneStore.createLane({
        name: 'Main',
        columns: [
          { surfaces: [], width: 100, isActive: true }
        ]
      });
      LaneStore.setActiveLane(mainLane);
      this.createDefaultSurfaceForLane(mainLane.id);
    }

    // Initial render
    this.renderActiveLane();
  },

  handleAddLane() {
    const name = prompt('Enter lane name:', 'New Lane');
    if (!name || !name.trim()) return;

    const newLane = LaneStore.createLane({
      name: name.trim()
    });
    LaneStore.setActiveLane(newLane);
    this.renderActiveLane();
  },

  handleLaneClick(lane) {
    LaneStore.setActiveLane(lane);
    this.renderActiveLane();
  },

  handleLaneContextMenu(lane, event) {
    // Show native context menu behavior - could be enhanced with custom menu
    const confirmed = confirm(`Delete lane "${lane.name || 'Untitled'}"?`);
    if (confirmed) {
      LaneStore.deleteLane(lane.id);
      // If deleted the active lane, select another
      if (LaneStore.activeLane?.id === lane.id) {
        const remainingLanes = LaneStore.lanes;
        if (remainingLanes.length > 0) {
          LaneStore.setActiveLane(remainingLanes[0]);
        }
      }
    }
  },

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      if (!ctrlKey) return;

      // Ctrl/Cmd+L: New Lane
      if ((e.key === 'l' || e.key === 'L') && !e.shiftKey) {
        e.preventDefault();
        const name = prompt('Lane name:', `Lane ${LaneStore.lanes.length + 1}`);
        if (name) {
          const lane = LaneStore.createLane(name);
          this.createDefaultSurfaceForLane(lane.id);
        }
      }

      // Ctrl/Cmd+N: New Session Surface
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        this.createSessionSurface();
      }

      // Ctrl/Cmd+W: Close current surface
      if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (SurfaceStore.activeSurface) {
          SurfaceStore.deleteSurface(SurfaceStore.activeSurface.id);
          this.renderActiveLane();
        }
      }

      // Ctrl/Cmd+B: Toggle file tree
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        this.toggleFileTree();
      }

      // Ctrl/Cmd+,: Open settings
      if (e.key === ',') {
        e.preventDefault();
        this.openSettingsSurface();
      }

      // Ctrl/Cmd+1-9: Quick switch to session N
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        const sessions = SurfaceStore.surfaces.filter(s => s.kind === 'agent-session');
        if (sessions[index]) {
          SurfaceStore.setActiveSurface(sessions[index].id);
          this.renderActiveLane();
        }
      }

      // Ctrl+Tab: Next surface
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        this.cycleSurface(1);
      }

      // Ctrl+Shift+Tab: Previous surface
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        this.cycleSurface(-1);
      }
    });
  },

  initToolbar() {
    document.getElementById('newSessionBtn')?.addEventListener('click', () => {
      this.createSessionSurface();
    });

    document.getElementById('toggleFilesBtn')?.addEventListener('click', () => {
      this.toggleFileTree();
    });

    document.getElementById('openSettingsBtn')?.addEventListener('click', () => {
      this.openSettingsSurface();
    });
  },

  createDefaultSurfaceForLane(laneId) {
    const lane = LaneStore.getLane(laneId);
    if (!lane) return;

    // Ensure lane has at least one column
    if (lane.columns.length === 0) {
      lane.columns.push({
        id: `col-${Date.now()}`,
        surfaces: [],
        width: 100,
        isActive: true
      });
    }

    const column = lane.columns[0];
    const surface = SurfaceStore.createSurface({
      kind: 'agent-session',
      title: `Session 1`
    });
    column.surfaces.push(surface);
    LaneStore.updateLane(laneId, { columns: lane.columns });
  },

  createSessionSurface() {
    const lane = LaneStore.activeLane;
    if (!lane) {
      // Create a new lane if none exists
      const newLane = LaneStore.createLane({ name: `Lane ${LaneStore.lanes.length + 1}` });
      LaneStore.setActiveLane(newLane);
      return this.createSessionSurface();
    }

    // Ensure lane has at least one column
    if (lane.columns.length === 0) {
      lane.columns.push({
        id: `col-${Date.now()}`,
        surfaces: [],
        width: 100,
        isActive: true
      });
      LaneStore.updateLane(lane.id, { columns: lane.columns });
    }

    const column = lane.columns[0];
    const sessionCount = column.surfaces.filter(s => s.kind === 'agent-session').length;
    const surface = SurfaceStore.createSurface({
      kind: 'agent-session',
      title: `Session ${sessionCount + 1}`
    });
    column.surfaces.push(surface);
    LaneStore.updateLane(lane.id, { columns: lane.columns });
    this.renderActiveLane();
  },

  toggleFileTree() {
    const lane = LaneStore.activeLane;
    if (!lane?.columns[0]) return;

    const fileTreeSurface = lane.columns[0].surfaces.find(s => s.kind === 'workspace-files');
    if (fileTreeSurface) {
      SurfaceStore.deleteSurface(fileTreeSurface.id);
      // Also remove from lane
      lane.columns[0].surfaces = lane.columns[0].surfaces.filter(s => s.id !== fileTreeSurface.id);
      LaneStore.updateLane(lane.id, { columns: lane.columns });
    } else {
      const surface = SurfaceStore.createSurface({
        kind: 'workspace-files',
        title: 'Files'
      });
      lane.columns[0].surfaces.push(surface);
      LaneStore.updateLane(lane.id, { columns: lane.columns });
    }
    this.renderActiveLane();
  },

  openSettingsSurface(initialTab = 'general') {
    if (typeof SettingsSurface !== 'undefined') {
      SettingsSurface.activeTab = initialTab;
    }

    const lane = LaneStore.activeLane;
    if (!lane?.columns[0]) {
      // Create lane if none exists
      const newLane = LaneStore.createLane({ name: 'Settings' });
      LaneStore.setActiveLane(newLane);
      return this.openSettingsSurface(initialTab);
    }

    // Check if settings already open
    const existing = lane.columns[0].surfaces.find(s => s.kind === 'settings');
    if (existing) {
      SurfaceStore.setActiveSurface(existing.id);
    } else {
      const surface = SurfaceStore.createSurface({
        kind: 'settings',
        title: 'Settings'
      });
      lane.columns[0].surfaces.push(surface);
      LaneStore.updateLane(lane.id, { columns: lane.columns });
    }
    this.renderActiveLane();
  },

  cycleSurface(direction) {
    const surfaces = SurfaceStore.surfaces;
    if (surfaces.length < 2) return;

    const currentIndex = surfaces.findIndex(s => s.id === SurfaceStore.activeSurfaceId);
    const nextIndex = (currentIndex + direction + surfaces.length) % surfaces.length;
    SurfaceStore.setActiveSurface(surfaces[nextIndex].id);
    this.renderActiveLane();
  },

  setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      WorkspaceStore.save();
      LaneStore.save();
      SurfaceStore.save();
    });
  }
};

window.WorkspaceController = WorkspaceController;
