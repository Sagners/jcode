// web-ui/js/skeleton.js

const Skeleton = {
  // Create skeleton loader HTML
  createLoader(type = 'line', options = {}) {
    const { width = '100%', height = '20px', lines = 3 } = options;

    switch (type) {
      case 'line':
        return `<div class="skeleton-line" style="width: ${width}; height: ${height};"></div>`;

      case 'avatar':
        return `<div class="skeleton-avatar" style="width: ${width}; height: ${height};"></div>`;

      case 'card':
        return `
          <div class="skeleton-card">
            <div class="skeleton-card-header">
              <div class="skeleton-avatar" style="width: 40px; height: 40px;"></div>
              <div class="skeleton-card-header-text">
                <div class="skeleton-line" style="width: 60%; height: 14px;"></div>
                <div class="skeleton-line" style="width: 40%; height: 12px;"></div>
              </div>
            </div>
            <div class="skeleton-card-body">
              ${Array(lines).fill('<div class="skeleton-line" style="width: 100%; height: 14px; margin-bottom: 8px;"></div>').join('')}
              <div class="skeleton-line" style="width: 75%; height: 14px;"></div>
            </div>
          </div>
        `;

      case 'message':
        return `
          <div class="skeleton-message">
            <div class="skeleton-message-header">
              <div class="skeleton-avatar" style="width: 32px; height: 32px; border-radius: 50%;"></div>
              <div class="skeleton-line" style="width: 100px; height: 14px;"></div>
            </div>
            <div class="skeleton-message-body">
              ${Array(lines).fill('<div class="skeleton-line" style="width: 100%; height: 16px; margin-bottom: 10px;"></div>').join('')}
              <div class="skeleton-line" style="width: 60%; height: 16px;"></div>
            </div>
          </div>
        `;

      case 'session':
        return `
          <div class="skeleton-session">
            <div class="skeleton-session-icon"></div>
            <div class="skeleton-session-content">
              <div class="skeleton-line" style="width: 70%; height: 14px;"></div>
              <div class="skeleton-line" style="width: 40%; height: 12px;"></div>
            </div>
          </div>
        `;

      case 'file':
        return `
          <div class="skeleton-file">
            <div class="skeleton-file-icon"></div>
            <div class="skeleton-file-name">
              <div class="skeleton-line" style="width: 80%; height: 14px;"></div>
            </div>
          </div>
        `;

      default:
        return `<div class="skeleton-line" style="width: ${width}; height: ${height};"></div>`;
    }
  },

  // Add skeleton styles to page
  initStyles() {
    if (document.getElementById('skeleton-styles')) return;

    const style = document.createElement('style');
    style.id = 'skeleton-styles';
    style.textContent = `
      /* ===== Skeleton Loading Animations ===== */
      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      .skeleton-line,
      .skeleton-avatar,
      .skeleton-card,
      .skeleton-session,
      .skeleton-file {
        background: linear-gradient(
          90deg,
          var(--surface-elevated) 25%,
          var(--surface-glass) 50%,
          var(--surface-elevated) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite ease-in-out;
        border-radius: var(--radius-sm);
      }

      /* Basic skeleton elements */
      .skeleton-line {
        display: block;
        margin-bottom: var(--space-2);
      }

      .skeleton-avatar {
        border-radius: 50%;
        flex-shrink: 0;
      }

      /* Card skeleton */
      .skeleton-card {
        padding: var(--space-4);
        border-radius: var(--radius-md);
        background: var(--surface);
        border: 1px solid var(--border);
      }

      .skeleton-card-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .skeleton-card-header-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .skeleton-card-body {
        display: flex;
        flex-direction: column;
      }

      /* Message skeleton */
      .skeleton-message {
        padding: var(--space-4);
        border-bottom: 1px solid var(--border);
      }

      .skeleton-message-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-3);
      }

      .skeleton-message-body {
        padding-left: calc(32px + var(--space-3));
      }

      /* Session skeleton */
      .skeleton-session {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--border);
      }

      .skeleton-session-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: linear-gradient(
          90deg,
          var(--surface-elevated) 25%,
          var(--surface-glass) 50%,
          var(--surface-elevated) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite ease-in-out;
      }

      .skeleton-session-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      /* File skeleton */
      .skeleton-file {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) var(--space-4);
      }

      .skeleton-file-icon {
        width: 20px;
        height: 20px;
        border-radius: 3px;
        background: linear-gradient(
          90deg,
          var(--surface-elevated) 25%,
          var(--surface-glass) 50%,
          var(--surface-elevated) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite ease-in-out;
      }

      .skeleton-file-name {
        flex: 1;
      }

      /* Loading container */
      .skeleton-container {
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      /* Sidebar loading */
      .skeleton-sidebar {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      /* Content area loading */
      .skeleton-content {
        flex: 1;
        padding: var(--space-6);
      }

      /* Skeleton fade in */
      .skeleton-fade-in {
        animation: skeletonFadeIn 0.3s ease-out;
      }

      @keyframes skeletonFadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      /* Pulse animation variant */
      .skeleton-pulse {
        animation: skeletonPulse 1.5s ease-in-out infinite;
      }

      @keyframes skeletonPulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `;
    document.head.appendChild(style);
  },

  // Show skeleton loading for sessions list
  showSessionsSkeleton() {
    this.initStyles();
    return `
      <div class="skeleton-sidebar skeleton-fade-in">
        ${Array(5).fill(this.createLoader('session')).join('')}
      </div>
    `;
  },

  // Show skeleton loading for messages
  showMessagesSkeleton(count = 3) {
    this.initStyles();
    return `
      <div class="skeleton-container skeleton-fade-in">
        ${Array(count).fill(this.createLoader('message')).join('')}
      </div>
    `;
  },

  // Show skeleton loading for files
  showFilesSkeleton(count = 8) {
    this.initStyles();
    return `
      <div class="skeleton-sidebar skeleton-fade-in">
        ${Array(count).fill(this.createLoader('file')).join('')}
      </div>
    `;
  }
};

// Initialize styles on DOM ready
document.addEventListener('DOMContentLoaded', () => Skeleton.initStyles());