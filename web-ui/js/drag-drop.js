// web-ui/js/drag-drop.js

const DragDrop = {
  dropZone: null,
  isDragging: false,

  init() {
    this.createDropZone();
    this.setupGlobalListeners();
  },

  createDropZone() {
    // Create overlay element
    this.dropZone = document.createElement('div');
    this.dropZone.id = 'drag-drop-overlay';
    this.dropZone.innerHTML = `
      <style>
        #drag-drop-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 15, 20, 0.95);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
        }

        #drag-drop-overlay.active {
          opacity: 1;
          visibility: visible;
        }

        .drag-drop-content {
          text-align: center;
          padding: var(--space-8);
          border: 3px dashed var(--accent);
          border-radius: var(--radius-xl);
          background: var(--surface-glass);
          transition: all 0.2s ease;
        }

        #drag-drop-overlay.active .drag-drop-content {
          transform: scale(1.05);
          border-color: var(--accent);
          box-shadow: 0 0 40px var(--accent-glow);
        }

        .drag-drop-icon {
          font-size: 64px;
          margin-bottom: var(--space-4);
          animation: dragDropBounce 1s ease-in-out infinite;
        }

        @keyframes dragDropBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .drag-drop-title {
          font-size: var(--text-xl);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .drag-drop-subtitle {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .drag-drop-files {
          margin-top: var(--space-4);
          max-width: 300px;
          text-align: left;
        }

        .drag-drop-file {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2);
          background: var(--surface);
          border-radius: var(--radius-sm);
          margin-bottom: var(--space-2);
          font-size: var(--text-sm);
        }

        .drag-drop-file-icon {
          font-size: 16px;
        }

        .drag-drop-file-name {
          flex: 1;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .drag-drop-file-size {
          color: var(--text-tertiary);
          font-size: var(--text-xs);
        }
      </style>

      <div class="drag-drop-content">
        <div class="drag-drop-icon">📁</div>
        <div class="drag-drop-title">Drop files to upload</div>
        <div class="drag-drop-subtitle">Files will be attached to your workspace</div>
        <div class="drag-drop-files" id="dragDropFiles"></div>
      </div>
    `;
    document.body.appendChild(this.dropZone);
  },

  setupGlobalListeners() {
    // Prevent default drag behaviors on window
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      window.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Handle drag enter
    window.addEventListener('dragenter', (e) => {
      if (this.hasFiles(e)) {
        this.show(e.dataTransfer.items);
      }
    });

    // Handle drag over
    window.addEventListener('dragover', (e) => {
      if (this.hasFiles(e)) {
        this.isDragging = true;
        this.dropZone.classList.add('active');
      }
    });

    // Handle drag leave
    window.addEventListener('dragleave', (e) => {
      // Check if we're leaving the window entirely
      if (e.relatedTarget === null) {
        this.isDragging = false;
        this.dropZone.classList.remove('active');
      }
    });

    // Handle drop
    window.addEventListener('drop', (e) => {
      this.isDragging = false;
      this.dropZone.classList.remove('active');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFiles(files);
      }
    });
  },

  hasFiles(e) {
    if (e.dataTransfer && e.dataTransfer.types) {
      return e.dataTransfer.types.includes('Files');
    }
    return false;
  },

  show(items) {
    // Show preview of files
    const filesContainer = document.getElementById('dragDropFiles');
    filesContainer.innerHTML = '';

    if (items) {
      for (let i = 0; i < Math.min(items.length, 5); i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            filesContainer.innerHTML += `
              <div class="drag-drop-file">
                <span class="drag-drop-file-icon">${this.getFileIcon(file.name)}</span>
                <span class="drag-drop-file-name">${file.name}</span>
                <span class="drag-drop-file-size">${this.formatSize(file.size)}</span>
              </div>
            `;
          }
        }
      }
      if (items.length > 5) {
        filesContainer.innerHTML += `
          <div class="drag-drop-file" style="justify-content: center; color: var(--text-secondary);">
            + ${items.length - 5} more files
          </div>
        `;
      }
    }

    this.dropZone.classList.add('active');
  },

  handleFiles(files) {
    console.log('Files dropped:', files);

    // Emit event for other components to handle
    const event = new CustomEvent('filesDropped', {
      detail: { files: Array.from(files) }
    });
    document.dispatchEvent(event);

    // Show notification
    Notification.show({
      title: 'Files Uploaded',
      message: `${files.length} file(s) ready to attach`,
      icon: '✅',
      duration: 3000
    });
  },

  getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      js: '📜', ts: '📘', py: '🐍', rs: '🦀',
      html: '🌐', css: '🎨', json: '📋', md: '📝',
      png: '🖼️', jpg: '🖼️', gif: '🖼️', svg: '🖼️',
      pdf: '📄', doc: '📄', txt: '📄',
      zip: '📦', tar: '📦', gz: '📦',
    };
    return icons[ext] || '📄';
  },

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  // Register handler for files
  onFilesDropped(handler) {
    document.addEventListener('filesDropped', (e) => handler(e.detail.files));
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => DragDrop.init());