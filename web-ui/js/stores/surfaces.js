// web-ui/js/stores/surfaces.js

const SurfaceStore = {
  surfaces: [],
  activeSurface: null,
  listeners: [],

  setSurfaces(surfaces) {
    this.surfaces = surfaces || [];
    this.notify();
  },

  setActiveSurface(surface) {
    this.activeSurface = surface;
    this.notify();
  },

  createSurface(data = {}) {
    const surface = {
      id: `surface-${Date.now()}`,
      kind: data.kind || 'agent-session',
      title: data.title || 'Untitled',
      isActive: data.isActive || false,
      isMinimized: data.isMinimized || false,
      localState: data.localState || null
    };
    this.surfaces.push(surface);
    this.notify();
    return surface;
  },

  deleteSurface(surfaceId) {
    this.surfaces = this.surfaces.filter(s => s.id !== surfaceId);
    if (this.activeSurface?.id === surfaceId) {
      this.activeSurface = this.surfaces[0] || null;
    }
    this.notify();
  },

  updateSurface(surfaceId, updates) {
    const index = this.surfaces.findIndex(s => s.id === surfaceId);
    if (index !== -1) {
      this.surfaces[index] = { ...this.surfaces[index], ...updates };
      if (this.activeSurface?.id === surfaceId) {
        this.activeSurface = this.surfaces[index];
      }
      this.notify();
    }
  },

  getSurface(surfaceId) {
    return this.surfaces.find(s => s.id === surfaceId);
  },

  // Local state management for individual surfaces
  updateSurfaceState(surfaceId, localState) {
    this.updateSurface(surfaceId, { localState });
  },

  // Toggle minimized state
  toggleMinimized(surfaceId) {
    const surface = this.getSurface(surfaceId);
    if (surface) {
      this.updateSurface(surfaceId, { isMinimized: !surface.isMinimized });
    }
  },

  // Toggle active state
  setActive(surfaceId) {
    this.surfaces.forEach(s => {
      s.isActive = s.id === surfaceId;
    });
    this.activeSurface = this.getSurface(surfaceId);
    this.notify();
  },

  subscribe(callback) {
    this.listeners.push(callback);
    callback({
      surfaces: this.surfaces,
      activeSurface: this.activeSurface
    });
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notify() {
    const state = {
      surfaces: this.surfaces,
      activeSurface: this.activeSurface
    };
    this.listeners.forEach(cb => cb(state));
  }
};

window.SurfaceStore = SurfaceStore;