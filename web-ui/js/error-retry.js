// web-ui/js/error-retry.js

const ErrorRetry = {
  // Show error toast with retry action
  showErrorToast(error, options = {}) {
    const {
      title = 'Error',
      message = error.message || 'An error occurred',
      onRetry = null,
      duration = 5000,
      actionLabel = 'Retry'
    } = options;

    Notification.show({
      title: title,
      message: message,
      icon: '❌',
      duration: 0, // Don't auto-dismiss
      action: onRetry ? { label: actionLabel, callback: onRetry } : null,
      type: 'error'
    });
  },

  // Create inline error display with retry button
  createErrorDisplay(options = {}) {
    const {
      title = 'Something went wrong',
      message = 'An error occurred while processing your request.',
      onRetry = null,
      onDismiss = null,
      icon = '⚠️'
    } = options;

    const id = `error-${Math.random().toString(36).substr(2, 9)}`;

    return `
      <div class="error-display" id="${id}">
        <style>
          .error-display {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--space-6);
            text-align: center;
            animation: errorFadeIn 0.3s ease;
          }

          @keyframes errorFadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .error-display-icon {
            font-size: 48px;
            margin-bottom: var(--space-4);
          }

          .error-display-title {
            font-size: var(--text-lg);
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: var(--space-2);
          }

          .error-display-message {
            font-size: var(--text-sm);
            color: var(--text-secondary);
            max-width: 400px;
            line-height: 1.5;
            margin-bottom: var(--space-5);
          }

          .error-display-actions {
            display: flex;
            gap: var(--space-3);
          }

          .error-display-btn {
            padding: var(--space-2) var(--space-5);
            border-radius: var(--radius-md);
            font-size: var(--text-sm);
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            border: none;
          }

          .error-display-btn-primary {
            background: var(--accent);
            color: var(--bg);
          }

          .error-display-btn-primary:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
          }

          .error-display-btn-secondary {
            background: var(--surface-elevated);
            color: var(--text-secondary);
            border: 1px solid var(--border);
          }

          .error-display-btn-secondary:hover {
            background: var(--surface);
            color: var(--text-primary);
          }

          .error-display-btn.danger {
            background: var(--error-tint);
            color: var(--error);
          }

          .error-display-btn.danger:hover {
            background: var(--error);
            color: white;
          }
        </style>

        <div class="error-display-icon">${icon}</div>
        <div class="error-display-title">${title}</div>
        <div class="error-display-message">${message}</div>
        <div class="error-display-actions">
          ${onRetry ? `<button class="error-display-btn primary error-retry-btn" data-error-id="${id}">Retry</button>` : ''}
          ${onDismiss ? `<button class="error-display-btn secondary error-dismiss-btn">Dismiss</button>` : ''}
        </div>
      </div>
    `;
  },

  // Show inline error in a container
  showInlineError(container, options = {}) {
    container.innerHTML = this.createErrorDisplay(options);

    const errorEl = container.querySelector('.error-display');
    const retryBtn = errorEl.querySelector('.error-retry-btn');
    const dismissBtn = errorEl.querySelector('.error-dismiss-btn');

    if (retryBtn && options.onRetry) {
      retryBtn.addEventListener('click', () => {
        errorEl.innerHTML = '<div class="error-retrying">Retrying...</div>';
        options.onRetry();
      });
    }

    if (dismissBtn && options.onDismiss) {
      dismissBtn.addEventListener('click', () => {
        container.innerHTML = '';
        options.onDismiss();
      });
    }
  },

  // Show error modal with options
  showErrorModal(options = {}) {
    const {
      title = 'Error',
      message = 'An error occurred.',
      details = null,
      onRetry = null,
      onDismiss = null,
      actions = []
    } = options;

    // Remove existing modal
    const existing = document.getElementById('error-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'error-modal';
    modal.innerHTML = `
      <style>
        #error-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          z-index: 9002;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: errorModalFadeIn 0.2s ease;
        }

        @keyframes errorModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .error-modal-box {
          width: 450px;
          max-width: 90vw;
          background: var(--surface);
          border: 1px solid var(--error);
          border-radius: var(--radius-lg);
          box-shadow: 0 0 30px rgba(217, 77, 89, 0.2);
          overflow: hidden;
        }

        .error-modal-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4) var(--space-5);
          background: var(--error-tint);
          border-bottom: 1px solid var(--error);
        }

        .error-modal-header-icon {
          font-size: 24px;
        }

        .error-modal-header-title {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--error);
        }

        .error-modal-body {
          padding: var(--space-5);
        }

        .error-modal-message {
          font-size: var(--text-base);
          color: var(--text-primary);
          line-height: 1.6;
          margin-bottom: var(--space-4);
        }

        .error-modal-details {
          background: var(--bg);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          color: var(--text-secondary);
          max-height: 150px;
          overflow-y: auto;
          white-space: pre-wrap;
        }

        .error-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-3);
          padding: var(--space-4) var(--space-5);
          border-top: 1px solid var(--border);
          background: var(--surface-elevated);
        }

        .error-modal-btn {
          padding: var(--space-2) var(--space-5);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }

        .error-modal-btn-retry {
          background: var(--accent);
          color: var(--bg);
        }

        .error-modal-btn-retry:hover {
          filter: brightness(1.1);
        }

        .error-modal-btn-dismiss {
          background: transparent;
          color: var(--text-secondary);
        }

        .error-modal-btn-dismiss:hover {
          background: var(--surface);
        }
      </style>

      <div class="error-modal-box">
        <div class="error-modal-header">
          <span class="error-modal-header-icon">⚠️</span>
          <span class="error-modal-header-title">${title}</span>
        </div>
        <div class="error-modal-body">
          <div class="error-modal-message">${message}</div>
          ${details ? `<div class="error-modal-details">${details}</div>` : ''}
        </div>
        <div class="error-modal-footer">
          ${onDismiss ? `<button class="error-modal-btn error-modal-btn-dismiss" id="errorModalDismiss">Dismiss</button>` : ''}
          ${onRetry ? `<button class="error-modal-btn error-modal-btn-retry" id="errorModalRetry">Retry</button>` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event handlers
    if (onDismiss) {
      modal.querySelector('#errorModalDismiss')?.addEventListener('click', () => {
        modal.remove();
        onDismiss();
      });
    }

    if (onRetry) {
      modal.querySelector('#errorModalRetry')?.addEventListener('click', () => {
        modal.remove();
        onRetry();
      });
    }

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal && onDismiss) {
        modal.remove();
        onDismiss();
      }
    });

    // Close on Escape
    const escHandler = (e) => {
      if (e.key === 'Escape' && onDismiss) {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    return modal;
  }
}; // End ErrorRetry

// Export for use
window.ErrorRetry = ErrorRetry;