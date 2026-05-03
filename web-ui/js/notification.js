// web-ui/js/notification.js

const Notification = {
  container: null,
  queue: [],
  isShowing: false,

  init() {
    // Create container if it doesn't exist
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.innerHTML = `
        <style>
          #notification-container {
            position: fixed;
            top: 60px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
          }

          .notification {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 14px 18px;
            background: var(--surface-elevated);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            min-width: 300px;
            max-width: 400px;
            pointer-events: auto;
            animation: notificationSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .notification.hiding {
            animation: notificationSlideOut 0.2s ease forwards;
          }

          @keyframes notificationSlideIn {
            from {
              opacity: 0;
              transform: translateX(100px) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }

          @keyframes notificationSlideOut {
            from {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
            to {
              opacity: 0;
              transform: translateX(100px) scale(0.9);
            }
          }

          .notification-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
          }

          .notification-content {
            flex: 1;
            min-width: 0;
          }

          .notification-title {
            font-size: var(--text-sm);
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 2px;
          }

          .notification-message {
            font-size: var(--text-xs);
            color: var(--text-secondary);
            line-height: 1.4;
          }

          .notification-close {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            color: var(--text-tertiary);
            cursor: pointer;
            border-radius: var(--radius-sm);
            transition: all 0.15s ease;
            flex-shrink: 0;
          }

          .notification-close:hover {
            background: var(--surface);
            color: var(--text-primary);
          }

          .notification.success {
            border-color: var(--status-idle);
          }

          .notification.success .notification-icon {
            color: var(--status-idle);
          }

          .notification.warning {
            border-color: var(--warning);
          }

          .notification.warning .notification-icon {
            color: var(--warning);
          }

          .notification.error {
            border-color: var(--error);
          }

          .notification.error .notification-icon {
            color: var(--error);
          }

          .notification.info {
            border-color: var(--accent);
          }

          .notification.info .notification-icon {
            color: var(--accent);
          }

          .notification-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: var(--accent);
            border-radius: 0 0 var(--radius-md) var(--radius-md);
            animation: notificationProgress linear forwards;
          }

          .notification.success .notification-progress {
            background: var(--status-idle);
          }

          .notification.warning .notification-progress {
            background: var(--warning);
          }

          .notification.error .notification-progress {
            background: var(--error);
          }

          @keyframes notificationProgress {
            from { width: 100%; }
            to { width: 0%; }
          }
        </style>
      `;
      document.body.appendChild(this.container);
    }
  },

  async show({ title, message, type = 'info', icon, duration = 5000, persistent = false }) {
    this.init();

    // Use Tauri notification if available
    if (window.__TAURI__) {
      try {
        const { Notification: TauriNotification } = window.__TAURI__.notification;
        await TauriNotification.sendNotification({
          title: title,
          body: message
        });
        return;
      } catch (e) {
        console.log('Tauri notification failed, using web fallback:', e);
      }
    }

    // Web-based notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Default icons based on type
    const defaultIcons = {
      success: '✓',
      warning: '⚠',
      error: '✕',
      info: 'ℹ'
    };

    const displayIcon = icon || defaultIcons[type] || 'ℹ';

    notification.innerHTML = `
      <div class="notification-icon">${displayIcon}</div>
      <div class="notification-content">
        <div class="notification-title">${this.escapeHtml(title)}</div>
        <div class="notification-message">${this.escapeHtml(message)}</div>
      </div>
      <button class="notification-close" aria-label="Close">✕</button>
      ${!persistent ? `<div class="notification-progress" style="animation-duration: ${duration}ms"></div>` : ''}
    `;

    // Add close handler
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => this.hide(notification));

    this.container.appendChild(notification);

    // Auto-hide after duration
    if (!persistent && duration > 0) {
      setTimeout(() => this.hide(notification), duration);
    }

    return notification;
  },

  hide(notification) {
    if (!notification || !notification.parentNode) return;

    notification.classList.add('hiding');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 200);
  },

  hideAll() {
    const notifications = this.container?.querySelectorAll('.notification');
    notifications?.forEach(n => this.hide(n));
  },

  success(title, message, options = {}) {
    return this.show({ title, message, type: 'success', icon: '✓', ...options });
  },

  error(title, message, options = {}) {
    return this.show({ title, message, type: 'error', icon: '✕', ...options });
  },

  warning(title, message, options = {}) {
    return this.show({ title, message, type: 'warning', icon: '⚠', ...options });
  },

  info(title, message, options = {}) {
    return this.show({ title, message, type: 'info', icon: 'ℹ', ...options });
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Initialize notification container on load
document.addEventListener('DOMContentLoaded', () => Notification.init());