// web-ui/js/resizable.js

const Resizable = {
  panels: new Map(),
  activeHandle: null,
  startPos: null,
  startSize: null,

  init() {
    // Setup mouse events
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', () => this.onMouseUp());
    document.addEventListener('mouseleave', () => this.onMouseUp());
  },

  makeResizable(element, options = {}) {
    const {
      minWidth = 200,
      maxWidth = Infinity,
      minHeight = 100,
      maxHeight = Infinity,
      initialWidth,
      initialHeight,
      onResize,
      handle = 'right'
    } = options;

    const id = Math.random().toString(36).substr(2, 9);
    const panel = { element, minWidth, maxWidth, minHeight, maxHeight, onResize, handle };

    if (initialWidth) {
      element.style.width = `${initialWidth}px`;
    }
    if (initialHeight) {
      element.style.height = `${initialHeight}px`;
    }

    // Create resize handle
    const handleEl = document.createElement('div');
    handleEl.className = `resize-handle resize-handle-${handle}`;
    handleEl.dataset.panelId = id;

    // Add handle styles if not already in page
    this.addStyles();

    element.style.position = 'relative';
    element.appendChild(handleEl);

    handleEl.addEventListener('mousedown', (e) => this.onMouseDown(e, panel));

    this.panels.set(id, panel);

    return id;
  },

  addStyles() {
    if (document.getElementById('resizable-styles')) return;

    const style = document.createElement('style');
    style.id = 'resizable-styles';
    style.textContent = `
      .resize-handle {
        position: absolute;
        z-index: 100;
        background: transparent;
        transition: background 0.15s ease;
      }

      .resize-handle:hover,
      .resize-handle.active {
        background: var(--accent);
        opacity: 0.5;
      }

      .resize-handle-right {
        top: 0;
        right: 0;
        width: 5px;
        height: 100%;
        cursor: ew-resize;
      }

      .resize-handle-left {
        top: 0;
        left: 0;
        width: 5px;
        height: 100%;
        cursor: ew-resize;
      }

      .resize-handle-bottom {
        bottom: 0;
        left: 0;
        width: 100%;
        height: 5px;
        cursor: ns-resize;
      }

      .resize-handle-top {
        top: 0;
        left: 0;
        width: 100%;
        height: 5px;
        cursor: ns-resize;
      }

      .resize-handle-corner {
        width: 10px;
        height: 10px;
        cursor: nwse-resize;
      }

      .resize-handle-right-bottom {
        right: 0;
        bottom: 0;
        cursor: nwse-resize;
      }

      /* Prevent text selection during resize */
      body.resizing {
        user-select: none;
        cursor: ew-resize;
      }
    `;
    document.head.appendChild(style);
  },

  onMouseDown(e, panel) {
    e.preventDefault();
    e.stopPropagation();

    this.activeHandle = e.target;
    this.activeHandle.classList.add('active');
    this.startPos = { x: e.clientX, y: e.clientY };
    this.startSize = {
      width: panel.element.offsetWidth,
      height: panel.element.offsetHeight
    };

    document.body.classList.add('resizing');
  },

  onMouseMove(e) {
    if (!this.activeHandle) return;

    const panelId = this.activeHandle.dataset.panelId;
    const panel = this.panels.get(panelId);
    if (!panel) return;

    const handle = panel.handle;
    const deltaX = e.clientX - this.startPos.x;
    const deltaY = e.clientY - this.startPos.y;

    let newWidth = this.startSize.width;
    let newHeight = this.startSize.height;

    if (handle === 'right' || handle === 'left') {
      if (handle === 'right') {
        newWidth = Math.max(panel.minWidth, Math.min(panel.maxWidth, this.startSize.width + deltaX));
      } else {
        newWidth = Math.max(panel.minWidth, Math.min(panel.maxWidth, this.startSize.width - deltaX));
      }
      panel.element.style.width = `${newWidth}px`;
    }

    if (handle === 'bottom' || handle === 'top') {
      if (handle === 'bottom') {
        newHeight = Math.max(panel.minHeight, Math.min(panel.maxHeight, this.startSize.height + deltaY));
      } else {
        newHeight = Math.max(panel.minHeight, Math.min(panel.maxHeight, this.startSize.height - deltaY));
      }
      panel.element.style.height = `${newHeight}px`;
    }

    if (panel.onResize) {
      panel.onResize({ width: newWidth, height: newHeight });
    }
  },

  onMouseUp() {
    if (this.activeHandle) {
      this.activeHandle.classList.remove('active');
      this.activeHandle = null;
    }
    this.startPos = null;
    this.startSize = null;
    document.body.classList.remove('resizing');
  },

  // Helper to make sidebar resizable
  makeSidebarResizable(sidebar, options = {}) {
    return this.makeResizable(sidebar, {
      ...options,
      handle: 'right',
      onResize: (size) => {
        // Save preference to localStorage
        localStorage.setItem('sidebarWidth', size.width);
        if (options.onResize) options.onResize(size);
      }
    });
  },

  // Restore saved width
  getSavedWidth() {
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : null;
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => Resizable.init());