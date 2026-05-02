// web-ui/js/stores/lanes.js

const LaneStore = {
  lanes: [],
  activeLane: null,
  listeners: [],

  setLanes(lanes) {
    this.lanes = lanes || [];
    this.notify();
  },

  setActiveLane(lane) {
    this.activeLane = lane;
    this.notify();
  },

  createLane(data = {}) {
    const lane = {
      id: `lane-${Date.now()}`,
      name: data.name || 'New Lane',
      columns: data.columns || [],
      activeColumnIndex: data.activeColumnIndex || 0,
      isCollapsed: data.isCollapsed || false
    };
    this.lanes.push(lane);
    this.notify();
    return lane;
  },

  deleteLane(laneId) {
    this.lanes = this.lanes.filter(l => l.id !== laneId);
    if (this.activeLane?.id === laneId) {
      this.activeLane = this.lanes[0] || null;
    }
    this.notify();
  },

  updateLane(laneId, updates) {
    const index = this.lanes.findIndex(l => l.id === laneId);
    if (index !== -1) {
      this.lanes[index] = { ...this.lanes[index], ...updates };
      if (this.activeLane?.id === laneId) {
        this.activeLane = this.lanes[index];
      }
      this.notify();
    }
  },

  getLane(laneId) {
    return this.lanes.find(l => l.id === laneId);
  },

  // Column operations within lanes
  addColumn(laneId, column) {
    const lane = this.getLane(laneId);
    if (lane) {
      const newColumn = {
        id: `col-${Date.now()}`,
        surfaces: column.surfaces || [],
        width: column.width || 33.33,
        isActive: column.isActive || false
      };
      lane.columns.push(newColumn);
      this.updateLane(laneId, { columns: lane.columns });
      return newColumn;
    }
  },

  deleteColumn(laneId, columnId) {
    const lane = this.getLane(laneId);
    if (lane) {
      lane.columns = lane.columns.filter(c => c.id !== columnId);
      this.updateLane(laneId, { columns: lane.columns });
    }
  },

  updateColumn(laneId, columnId, updates) {
    const lane = this.getLane(laneId);
    if (lane) {
      const colIndex = lane.columns.findIndex(c => c.id === columnId);
      if (colIndex !== -1) {
        lane.columns[colIndex] = { ...lane.columns[colIndex], ...updates };
        this.updateLane(laneId, { columns: lane.columns });
      }
    }
  },

  subscribe(callback) {
    this.listeners.push(callback);
    callback({
      lanes: this.lanes,
      activeLane: this.activeLane
    });
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notify() {
    const state = {
      lanes: this.lanes,
      activeLane: this.activeLane
    };
    this.listeners.forEach(cb => cb(state));
  }
};

window.LaneStore = LaneStore;