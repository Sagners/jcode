// web-ui/js/stores/messages.js

const MessagesStore = {
  messages: [],
  listeners: [],

  setMessages(messages) {
    this.messages = messages || [];
    this.notify();
  },

  addMessage(message) {
    // Generate ID if not provided
    const msg = {
      id: message.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...message
    };
    this.messages.push(msg);
    this.notify();
    return msg;
  },

  updateMessage(id, updates) {
    const index = this.messages.findIndex(m => m.id === id);
    if (index !== -1) {
      this.messages[index] = { ...this.messages[index], ...updates };
      this.notify();
    }
  },

  removeMessage(id) {
    this.messages = this.messages.filter(m => m.id !== id);
    this.notify();
  },

  clearMessages() {
    this.messages = [];
    this.notify();
  },

  getLastMessage() {
    return this.messages[this.messages.length - 1] || null;
  },

  subscribe(callback) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.messages);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notify() {
    this.listeners.forEach(cb => cb([...this.messages]));
  }
};

window.MessagesStore = MessagesStore;