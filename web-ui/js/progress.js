// web-ui/js/progress.js

const Progress = {
  activeProgress: new Map(),

  // Create a progress bar with given options
  create(options = {}) {
    const {
      id = `progress-${Math.random().toString(36).substr(2, 9)}`,
      title = 'Loading...',
      message = '',
      value = 0,
      max = 100,
      showPercentage = true,
      showCancel = false,
      onCancel = null,
      type = 'linear' // 'linear' or 'circular'
    } = options;

    const container = document.createElement('div');
    container.id = id;
    container.className = 'progress-container';

    if (type === 'circular') {
      const percentage = Math.round((value / max) * 100);
      container.innerHTML = `
        <style>
          .progress-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--space-6);
          }

          .progress-circular {
            position: relative;
            width: 64px;
            height: 64px;
          }

          .progress-circular svg {
            transform: rotate(-90deg);
          }

          .progress-circular-bg {
            fill: none;
            stroke: var(--surface-elevated);
            stroke-width: 6;
          }

          .progress-circular-bar {
            fill: none;
            stroke: var(--accent);
            stroke-width: 6;
            stroke-linecap: round;
            stroke-dasharray: 157;
            stroke-dashoffset: ${157 - (157 * percentage / 100)};
            transition: stroke-dashoffset 0.3s ease;
          }

          .progress-circular-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: var(--text-sm);
            font-weight: 600;
            color: var(--text-primary);
            font-family: var(--font-mono);
          }

          .progress-title {
            margin-top: var(--space-3);
            font-size: var(--text-sm);
            font-weight: 500;
            color: var(--text-primary);
          }

          .progress-message {
            margin-top: var(--space-1);
            font-size: var(--text-xs);
            color: var(--text-secondary);
          }

          .progress-cancel {
            margin-top: var(--space-3);
            padding: var(--space-1) var(--space-3);
            background: transparent;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            color: var(--text-secondary);
            font-size: var(--text-xs);
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .progress-cancel:hover {
            background: var(--error-tint);
            border-color: var(--error);
            color: var(--error);
          }
        </style>

        <div class="progress-circular">
          <svg width="64" height="64">
            <circle class="progress-circular-bg" cx="32" cy="32" r="25"></circle>
            <circle class="progress-circular-bar" cx="32" cy="32" r="25"></circle>
          </svg>
          ${showPercentage ? `<span class="progress-circular-text">${percentage}%</span>` : ''}
        </div>
        ${title ? `<div class="progress-title">${title}</div>` : ''}
        ${message ? `<div class="progress-message">${message}</div>` : ''}
        ${showCancel ? `<button class="progress-cancel">Cancel</button>` : ''}
      `;
    } else {
      // Linear progress bar
      const percentage = Math.round((value / max) * 100);
      container.innerHTML = `
        <style>
          .progress-container {
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
            padding: var(--space-4);
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
          }

          .progress-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .progress-title {
            font-size: var(--text-sm);
            font-weight: 500;
            color: var(--text-primary);
          }

          .progress-percentage {
            font-size: var(--text-xs);
            font-weight: 600;
            color: var(--accent);
            font-family: var(--font-mono);
          }

          .progress-bar {
            height: 6px;
            background: var(--surface-elevated);
            border-radius: var(--radius-full);
            overflow: hidden;
          }

          .progress-bar-fill {
            height: 100%;
            background: var(--accent-gradient);
            border-radius: var(--radius-full);
            transition: width 0.3s ease;
            position: relative;
          }

          .progress-bar-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.3) 50%,
              transparent 100%
            );
            animation: progressShine 1.5s ease-in-out infinite;
          }

          @keyframes progressShine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          .progress-message {
            font-size: var(--text-xs);
            color: var(--text-secondary);
          }

          .progress-cancel {
            align-self: flex-end;
            padding: var(--space-1) var(--space-3);
            background: transparent;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            color: var(--text-secondary);
            font-size: var(--text-xs);
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .progress-cancel:hover {
            background: var(--error-tint);
            border-color: var(--error);
            color: var(--error);
          }

          /* Progress bar in modal */
          .progress-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            z-index: 9003;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .progress-modal-box {
            width: 400px;
            max-width: 90vw;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
          }

          .progress-modal-header {
            padding: var(--space-4) var(--space-5);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: var(--space-3);
          }

          .progress-modal-icon {
            font-size: 20px;
          }

          .progress-modal-title {
            font-size: var(--text-base);
            font-weight: 600;
            color: var(--text-primary);
          }

          .progress-modal-body {
            padding: var(--space-5);
          }
        </style>

        <div class="progress-header">
          ${title ? `<span class="progress-title">${title}</span>` : ''}
          ${showPercentage ? `<span class="progress-percentage">${percentage}%</span>` : ''}
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: ${percentage}%"></div>
        </div>
        ${message ? `<div class="progress-message">${message}</div>` : ''}
        ${showCancel ? `<button class="progress-cancel">Cancel</button>` : ''}
      `;
    }

    // Store progress info
    this.activeProgress.set(id, { value, max, onCancel });

    // Cancel button handler
    if (showCancel && onCancel) {
      container.querySelector('.progress-cancel')?.addEventListener('click', () => {
        onCancel();
        this.remove(id);
      });
    }

    return container;
  },

  // Update progress value
  update(id, value, message = null) {
    const progress = this.activeProgress.get(id);
    if (!progress) return;

    progress.value = Math.min(Math.max(0, value), progress.max);

    const container = document.getElementById(id);
    if (!container) return;

    const percentage = Math.round((progress.value / progress.max) * 100);

    // Update linear progress bar
    const barFill = container.querySelector('.progress-bar-fill');
    if (barFill) {
      barFill.style.width = `${percentage}%`;
    }

    // Update circular progress
    const circularBar = container.querySelector('.progress-circular-bar');
    if (circularBar) {
      const dashOffset = 157 - (157 * percentage / 100);
      circularBar.setAttribute('stroke-dashoffset', dashOffset);
    }

    // Update percentage text
    const percentageText = container.querySelector('.progress-percentage, .progress-circular-text');
    if (percentageText) {
      percentageText.textContent = `${percentage}%`;
    }

    // Update message
    if (message) {
      const messageEl = container.querySelector('.progress-message');
      if (messageEl) {
        messageEl.textContent = message;
      }
    }
  },

  // Increment progress
  increment(id, amount = 1, message = null) {
    const progress = this.activeProgress.get(id);
    if (progress) {
      this.update(id, progress.value + amount, message);
    }
  },

  // Remove progress bar
  remove(id) {
    const progress = this.activeProgress.get(id);
    if (progress) {
      if (progress.onCancel) {
        progress.onCancel();
      }
      this.activeProgress.delete(id);
    }

    const container = document.getElementById(id);
    if (container) {
      container.remove();
    }
  },

  // Show progress in modal
  showModal(options = {}) {
    const {
      id = `progress-modal-${Math.random().toString(36).substr(2, 9)}`,
      title = 'Processing...',
      message = '',
      showCancel = false,
      onCancel = null
    } = options;

    const overlay = document.createElement('div');
    overlay.className = 'progress-modal';
    overlay.id = id;

    const container = this.create({
      ...options,
      id: `${id}-bar`,
      title: title,
      message: message,
      showCancel: showCancel,
      onCancel: () => {
        this.remove(id);
        if (onCancel) onCancel();
      }
    });

    overlay.innerHTML = '';
    overlay.appendChild(container);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && onCancel) {
        this.remove(id);
        onCancel();
      }
    });

    document.body.appendChild(overlay);

    return {
      id,
      update: (value, message) => this.update(`${id}-bar`, value, message),
      increment: (amount, message) => this.increment(`${id}-bar`, amount, message),
      remove: () => this.remove(id)
    };
  }
}; // End Progress

// Export for use
window.Progress = Progress;