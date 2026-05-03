// web-ui/js/shortcuts.js

const Shortcuts = {
  shortcuts: {
    'ctrl+n': { action: 'newSession', description: 'New Session', handler: null },
    'ctrl+b': { action: 'toggleFiles', description: 'Toggle Files', handler: null },
    'ctrl+,': { action: 'openSettings', description: 'Open Settings', handler: null },
    'ctrl+k': { action: 'commandPalette', description: 'Command Palette', handler: null },
    'escape': { action: 'closeModal', description: 'Close Modal', handler: null },
    'ctrl+enter': { action: 'sendMessage', description: 'Send Message', handler: null },
    'ctrl+shift+p': { action: 'toggleTheme', description: 'Toggle Theme', handler: null },
  },

  listeners: {},

  init() {
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  },

  handleKeydown(e) {
    const key = this.getKeyString(e);

    if (this.shortcuts[key]) {
      const shortcut = this.shortcuts[key];
      const handler = this.listeners[shortcut.action];

      if (handler) {
        e.preventDefault();
        handler(e);
      }
    }
  },

  getKeyString(e) {
    const parts = [];

    if (e.ctrlKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    if (e.metaKey) parts.push('meta');

    // Get the key name
    let key = e.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === ',') key = 'comma';
    if (key === '.') key = 'period';
    if (key === '/') key = 'slash';
    if (key === '\\') key = 'backslash';
    if (key === '[') key = 'bracketopen';
    if (key === ']') key = 'bracketclose';
    if (key === '-') key = 'minus';
    if (key === '=') key = 'equals';
    if (key === 'escape') key = 'escape';

    // Only add key if it's not a modifier
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
      parts.push(key);
    }

    return parts.join('+');
  },

  register(action, handler) {
    this.listeners[action] = handler;
  },

  unregister(action) {
    delete this.listeners[action];
  },

  showToast(shortcut) {
    const description = this.shortcuts[shortcut]?.description || shortcut;
    Notification.show({
      title: 'Keyboard Shortcut',
      message: description,
      icon: '⌨️',
      duration: 2000
    });
  },

  getAllShortcuts() {
    return Object.entries(this.shortcuts).map(([key, value]) => ({
      key,
      ...value
    }));
  }
};

// Initialize shortcuts
document.addEventListener('DOMContentLoaded', () => Shortcuts.init());