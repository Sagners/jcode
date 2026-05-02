// web-ui/js/stores/workspace.js

const WorkspaceStore = {
  workspaces: [],
  activeWorkspace: null,
  listeners: [],

  setWorkspaces(workspaces) {
    this.workspaces = workspaces || [];
    this.notify();
  },

  setActiveWorkspace(workspace) {
    this.activeWorkspace = workspace;
    this.notify();
  },

  createWorkspace(data = {}) {
    const workspace = {
      id: `ws-${Date.now()}`,
      name: data.name || 'New Workspace',
      projectPath: data.projectPath || null,
      lanes: data.lanes || [],
      activeLaneIndex: data.activeLaneIndex || 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.workspaces.push(workspace);
    this.notify();
    return workspace;
  },

  deleteWorkspace(workspaceId) {
    this.workspaces = this.workspaces.filter(ws => ws.id !== workspaceId);
    if (this.activeWorkspace?.id === workspaceId) {
      this.activeWorkspace = this.workspaces[0] || null;
    }
    this.notify();
  },

  updateWorkspace(workspaceId, updates) {
    const index = this.workspaces.findIndex(ws => ws.id === workspaceId);
    if (index !== -1) {
      this.workspaces[index] = {
        ...this.workspaces[index],
        ...updates,
        updatedAt: Date.now()
      };
      if (this.activeWorkspace?.id === workspaceId) {
        this.activeWorkspace = this.workspaces[index];
      }
      this.notify();
    }
  },

  getWorkspace(workspaceId) {
    return this.workspaces.find(ws => ws.id === workspaceId);
  },

  addLane(workspaceId, lane) {
    const workspace = this.getWorkspace(workspaceId);
    if (workspace) {
      const newLane = {
        id: `lane-${Date.now()}`,
        name: lane.name || 'New Lane',
        columns: lane.columns || [],
        activeColumnIndex: lane.activeColumnIndex || 0,
        isCollapsed: lane.isCollapsed || false
      };
      workspace.lanes.push(newLane);
      this.updateWorkspace(workspaceId, { lanes: workspace.lanes });
      return newLane;
    }
  },

  subscribe(callback) {
    this.listeners.push(callback);
    callback({
      workspaces: this.workspaces,
      activeWorkspace: this.activeWorkspace
    });
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notify() {
    const state = {
      workspaces: this.workspaces,
      activeWorkspace: this.activeWorkspace
    };
    this.listeners.forEach(cb => cb(state));
  }
};

window.WorkspaceStore = WorkspaceStore;