// web-ui/js/keyboard-help.js

const KeyboardHelp = {
  dialog: null,

  show() {
    if (this.dialog) {
      this.dialog.remove();
    }

    this.dialog = document.createElement('div');
    this.dialog.className = 'keyboard-help';
    this.dialog.innerHTML = `
      <style>
        .keyboard-help {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9001;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
        }

        .keyboard-help.show {
          opacity: 1;
          visibility: visible;
        }

        .keyboard-help-box {
          width: 600px;
          max-width: 90vw;
          max-height: 80vh;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          transform: scale(0.95);
          transition: all 0.2s ease;
        }

        .keyboard-help.show .keyboard-help-box {
          transform: scale(1);
        }

        .keyboard-help-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--border);
          background: var(--surface-elevated);
        }

        .keyboard-help-title {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .keyboard-help-title svg {
          width: 20px;
          height: 20px;
          stroke: var(--accent);
        }

        .keyboard-help-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .keyboard-help-close:hover {
          background: var(--error-tint);
          color: var(--error);
        }

        .keyboard-help-close svg {
          width: 16px;
          height: 16px;
        }

        .keyboard-help-body {
          padding: var(--space-4) var(--space-5);
          max-height: calc(80vh - 120px);
          overflow-y: auto;
        }

        .keyboard-help-section {
          margin-bottom: var(--space-5);
        }

        .keyboard-help-section:last-child {
          margin-bottom: 0;
        }

        .keyboard-help-section-title {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: var(--space-3);
        }

        .keyboard-help-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-2);
        }

        .keyboard-help-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-2) var(--space-3);
          background: var(--bg);
          border-radius: var(--radius-sm);
          transition: all 0.15s ease;
        }

        .keyboard-help-item:hover {
          background: var(--surface-elevated);
        }

        .keyboard-help-label {
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .keyboard-help-keys {
          display: flex;
          gap: var(--space-1);
        }

        .keyboard-help-keys kbd {
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          padding: 2px var(--space-2);
          background: var(--surface-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
        }

        .keyboard-help-footer {
          padding: var(--space-3) var(--space-5);
          border-top: 1px solid var(--border);
          text-align: center;
        }

        .keyboard-help-footer span {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .keyboard-help-footer kbd {
          font-family: var(--font-mono);
          padding: 2px var(--space-1);
          background: var(--surface-elevated);
          border-radius: 3px;
        }
      </style>

      <div class="keyboard-help-box">
        <div class="keyboard-help-header">
          <div class="keyboard-help-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8"/>
            </svg>
            Keyboard Shortcuts
          </div>
          <button class="keyboard-help-close" id="keyboardHelpClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="6" y1="6" x2="18" y2="18"/>
              <line x1="6" y1="18" x2="18" y2="6"/>
            </svg>
          </button>
        </div>
        <div class="keyboard-help-body">
          <div class="keyboard-help-section">
            <div class="keyboard-help-section-title">General</div>
            <div class="keyboard-help-grid">
              <div class="keyboard-help-item">
                <span class="keyboard-help-label">Command Palette</span>
                <div class="keyboard-help-keys"><kbd>Ctrl</kbd><kbd>K</kbd></div>
              </div>
              <div class="keyboard-help-item">
                <span class="keyboard-help-label">Keyboard Help</span>
                <div class="keyboard-help-keys"><kbd>Ctrl</kbd><kbd>H</kbd></div>
              </div>
              <div class="keyboard-help-item">
                <span class="keyboard-help-label">Toggle Theme</span>
                <div class="keyboard-help-keys"><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>P</kbd></div>
              </div>
              <div class="keyboard-help-item">
                <span class="keyboard-help-label">Close Modal</span>
                <div class="keyboard-help-keys"><kbd>Esc</kbd></div>
              </div>
            </div>
          </div>

          <div class="keyboard-help-section">
            <div class="keyboard-help-section-title">Sessions</div>
            <div class="keyboard-help-grid">
              <div class="keyboard-help-item">
                <span class="keyboard-help-label">New Session</span>
                <div class="keyboard-help-keys"><kbd>Ctrl</kbd><kbd>N</kbd></div>
              </div>
              <div class="keyboard-help-item">
                <span class="keyboard-help-label">Toggle Files Panel</span>
                <div class="keyboard-help-keys"><kbd>Ctrl</kbd><kbd>B</kbd></div>
              </div>
              <div class="keyboard-help-item">
                <span class="keyboard-help-label">Open Settings</span>
                <div class="keyboard-help-keys"><kbd>Ctrl</kbd><kbd>,</kbd></div>
              </div>
            </div>
          </div>

          <div class="keyboard-help-section">
            <div class="keyboard-help-section-title">Messaging</div>
            <div class="keyboard-help-grid">
              <div class="keyboard-help-item">
                <span class="keyboard-help-label">Send Message</span>
                <div class="keyboard-help-keys"><kbd>Ctrl</kbd><kbd>Enter</kbd></div>
              </div>
              <div class="keyboard-help-item">
                <span class="keyboard-help-label">Clear Input</span>
                <div class="keyboard-help-keys"><kbd>Esc</kbd></div>
              </div>
            </div>
          </div>

          <div class="keyboard-help-section">
            <div class="keyboard-help-section-title">Text Editing</div>
            <div class="keyboard-help-grid">
              <div class="keyboard-help-item">
                <span class="keyboard-help-label">Copy</span>
                <div class="keyboard-help-keys"><kbd>Ctrl</kbd><kbd>C</kbd></div>
              </div>
              <div class="keyboard-help-item">
                <span class="keyboard-help-label">Cut</span>
                <div class="keyboard-help-keys"><kbd>Ctrl</kbd><kbd>X</kbd></div>
              </div>
              <div class="keyboard-help-item">
                <span class="keyboard-help-label">Paste</span>
                <div class="keyboard-help-keys"><kbd>Ctrl</kbd><kbd>V</kbd></div>
              </div>
              <div class="keyboard-help-item">
                <span class="keyboard-help-label">Select All</span>
                <div class="keyboard-help-keys"><kbd>Ctrl</kbd><kbd>A</kbd></div>
              </div>
            </div>
          </div>
        </div>
        <div class="keyboard-help-footer">
          <span>Press <kbd>Esc</kbd> to close</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.dialog);

    // Show with animation
    requestAnimationFrame(() => {
      this.dialog.classList.add('show');
    });

    // Close button
    this.dialog.querySelector('#keyboardHelpClose').addEventListener('click', () => this.hide());

    // Close on backdrop click
    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) {
        this.hide();
      }
    });

    // Close on escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.hide();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  },

  hide() {
    if (this.dialog) {
      this.dialog.classList.remove('show');
      setTimeout(() => {
        this.dialog?.remove();
        this.dialog = null;
      }, 200);
    }
  }
};

// Register with Shortcuts
document.addEventListener('DOMContentLoaded', () => {
  Shortcuts.register('keyboardHelp', () => KeyboardHelp.show());
  Shortcuts.register('closeModal', () => {
    // Close any open modals
    const commandPalette = document.getElementById('commandPalette');
    if (commandPalette?.classList.contains('show')) {
      commandPalette.classList.remove('show');
    }
    KeyboardHelp.hide();
  });

  // Also add Ctrl+H global shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      e.preventDefault();
      KeyboardHelp.show();
    }
  });
});