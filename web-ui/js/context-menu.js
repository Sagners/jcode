// web-ui/js/context-menu.js

const ContextMenu = {
  container: null,
  activeMenu: null,

  init() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'context-menu-container';
    this.container.innerHTML = `
      <style>
        #context-menu-container {
          position: fixed;
          z-index: 10001;
          pointer-events: none;
        }

        .context-menu {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          min-width: 180px;
          max-width: 280px;
          padding: var(--space-1);
          pointer-events: auto;
          animation: contextMenuFadeIn 0.15s ease-out;
          transform-origin: top left;
        }

        @keyframes contextMenuFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-5px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .context-menu-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.1s ease;
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .context-menu-item:hover {
          background: var(--accent-tint);
          color: var(--accent);
        }

        .context-menu-item.danger:hover {
          background: var(--error-tint);
          color: var(--error);
        }

        .context-menu-item.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        .context-menu-item-icon {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          opacity: 0.7;
        }

        .context-menu-item:hover .context-menu-item-icon {
          opacity: 1;
        }

        .context-menu-item-label {
          flex: 1;
        }

        .context-menu-item-shortcut {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          font-family: var(--font-mono);
        }

        .context-menu-item:hover .context-menu-item-shortcut {
          color: var(--accent);
          opacity: 0.7;
        }

        .context-menu-item.danger:hover .context-menu-item-shortcut {
          color: var(--error);
        }

        .context-menu-divider {
          height: 1px;
          background: var(--border);
          margin: var(--space-1) 0;
        }

        .context-menu-submenu {
          position: relative;
        }

        .context-menu-submenu::after {
          content: '›';
          margin-left: auto;
          font-size: 14px;
          opacity: 0.5;
        }

        .context-menu-submenu:hover::after {
          opacity: 1;
        }
      </style>
    `;
    document.body.appendChild(this.container);

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.context-menu')) {
        this.hide();
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });
  },

  show(x, y, items, options = {}) {
    if (!this.container) this.init();

    // Clear existing menu
    this.container.innerHTML = '';

    // Create menu element
    const menu = document.createElement('div');
    menu.className = 'context-menu';

    // Build menu items
    items.forEach(item => {
      if (item.type === 'divider') {
        const divider = document.createElement('div');
        divider.className = 'context-menu-divider';
        menu.appendChild(divider);
        return;
      }

      const menuItem = document.createElement('div');
      menuItem.className = 'context-menu-item';

      if (item.danger) menuItem.classList.add('danger');
      if (item.disabled) menuItem.classList.add('disabled');
      if (item.submenu) menuItem.classList.add('context-menu-submenu');

      menuItem.innerHTML = `
        ${item.icon ? `<span class="context-menu-item-icon">${item.icon}</span>` : ''}
        <span class="context-menu-item-label">${item.label}</span>
        ${item.shortcut ? `<span class="context-menu-item-shortcut">${item.shortcut}</span>` : ''}
      `;

      if (!item.disabled && item.action) {
        menuItem.addEventListener('click', (e) => {
          e.stopPropagation();
          item.action(item.data);
          this.hide();
        });
      }

      menu.appendChild(menuItem);
    });

    this.container.appendChild(menu);

    // Position menu
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust position to keep menu in viewport
    let posX = x;
    let posY = y;

    if (x + menuRect.width > viewportWidth - 10) {
      posX = viewportWidth - menuRect.width - 10;
    }
    if (y + menuRect.height > viewportHeight - 10) {
      posY = viewportHeight - menuRect.height - 10;
    }

    this.container.style.left = `${posX}px`;
    this.container.style.top = `${posY}px`;

    this.activeMenu = menu;
  },

  hide() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.activeMenu = null;
  },

  // Helper to show session context menu
  showSessionMenu(x, y, session, actions = {}) {
    const items = [
      { icon: '💬', label: 'Open Session', shortcut: 'Enter', action: () => actions.open?.(session) },
      { icon: '✏️', label: 'Rename', action: () => actions.rename?.(session) },
      { type: 'divider' },
      { icon: '📋', label: 'Duplicate', action: () => actions.duplicate?.(session) },
      { icon: '🗑️', label: 'Delete', shortcut: 'Del', danger: true, action: () => actions.delete?.(session) },
    ];
    this.show(x, y, items);
  },

  // Helper to show file context menu
  showFileMenu(x, y, file, actions = {}) {
    const items = [
      { icon: '📄', label: 'Open', shortcut: 'Enter', action: () => actions.open?.(file) },
      { icon: '✏️', label: 'Rename', action: () => actions.rename?.(file) },
      { icon: '📋', label: 'Copy Path', action: () => actions.copyPath?.(file) },
      { type: 'divider' },
      { icon: '🗑️', label: 'Delete', shortcut: 'Del', danger: true, action: () => actions.delete?.(file) },
    ];
    this.show(x, y, items);
  },

  // Helper to show lane context menu
  showLaneMenu(x, y, lane, actions = {}) {
    const items = [
      { icon: '📌', label: 'Pin Lane', action: () => actions.pin?.(lane) },
      { icon: '✏️', label: 'Rename', action: () => actions.rename?.(lane) },
      { type: 'divider' },
      { icon: '🔄', label: 'Restart', action: () => actions.restart?.(lane) },
      { icon: '⏹️', label: 'Stop', action: () => actions.stop?.(lane) },
      { type: 'divider' },
      { icon: '🗑️', label: 'Close Lane', danger: true, action: () => actions.close?.(lane) },
    ];
    this.show(x, y, items);
  },

  // Helper to show text selection menu
  showTextMenu(x, y, actions = {}) {
    const items = [
      { icon: '📋', label: 'Copy', shortcut: 'Ctrl+C', action: () => actions.copy?.() },
      { icon: '✂️', label: 'Cut', shortcut: 'Ctrl+X', action: () => actions.cut?.() },
      { icon: '📝', label: 'Paste', shortcut: 'Ctrl+V', action: () => actions.paste?.() },
      { type: 'divider' },
      { icon: '🔍', label: 'Search', shortcut: 'Ctrl+F', action: () => actions.search?.() },
    ];
    this.show(x, y, items);
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => ContextMenu.init());