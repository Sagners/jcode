// web-ui/js/stores/session.js

const SessionStore = {
  sessions: [],
  currentSession: null,
  listeners: [],

  setSessions(sessions) {
    this.sessions = sessions || [];
    this.notify();
  },

  setCurrentSession(session) {
    this.currentSession = session;
    this.notify();
  },

  addSession(session) {
    this.sessions.push(session);
    this.notify();
  },

  removeSession(sessionId) {
    this.sessions = this.sessions.filter(s => s.id !== sessionId);
    if (this.currentSession?.id === sessionId) {
      this.currentSession = null;
    }
    this.notify();
  },

  updateSession(sessionId, updates) {
    const index = this.sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      this.sessions[index] = { ...this.sessions[index], ...updates };
      if (this.currentSession?.id === sessionId) {
        this.currentSession = this.sessions[index];
      }
      this.notify();
    }
  },

  getSession(sessionId) {
    return this.sessions.find(s => s.id === sessionId);
  },

  subscribe(callback) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback({
      sessions: this.sessions,
      currentSession: this.currentSession
    });
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notify() {
    const state = {
      sessions: this.sessions,
      currentSession: this.currentSession
    };
    this.listeners.forEach(cb => cb(state));
  }
};

window.SessionStore = SessionStore;