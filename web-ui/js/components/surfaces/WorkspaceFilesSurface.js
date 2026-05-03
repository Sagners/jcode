// web-ui/js/components/surfaces/WorkspaceFilesSurface.js

const WorkspaceFilesSurface = {
  // Store active surface IDs
  activeSurfaces: new Set(),

  render(surface) {
    // Track this surface
    this.activeSurfaces.add(surface.id);
    this.currentPath = null;

    const container = document.createElement('div');
    container.className = 'files-surface-body';
    container.dataset.surfaceId = surface.id;

    const fileTreeId = `fileTree_${surface.id}`;
    container.innerHTML = `
      <div class="files-toolbar">
        <button class="files-btn" id="openFolderBtn_${surface.id}" title="Open Folder">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          Open Folder
        </button>
        <button class="files-btn" id="refreshFilesBtn_${surface.id}" title="Refresh">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>
        <span class="files-path" id="filesPath_${surface.id}" style="margin-left: auto; font-size: 12px; color: var(--text-tertiary);"></span>
      </div>
      <div class="file-tree" id="${fileTreeId}">
        <div class="file-tree-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <p>No folder opened</p>
          <p style="font-size: var(--text-sm); color: var(--text-tertiary);">Click "Open Folder" to browse files</p>
        </div>
      </div>
    `;

    this.setupEventListeners(container, surface);

    return container;
  },

  setupEventListeners(container, surface) {
    const openBtn = container.querySelector(`#openFolderBtn_${surface.id}`);
    const refreshBtn = container.querySelector(`#refreshFilesBtn_${surface.id}`);

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        this.openFolder(surface.id);
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (this.currentPath) {
          this.loadFiles(surface.id, this.currentPath);
        }
      });
    }
  },

  openFolder(surfaceId) {
    // Try File System Access API first (Chrome/Edge)
    if ('showDirectoryPicker' in window) {
      this.openFolderNative(surfaceId);
    } else {
      // Fallback to prompt for Firefox/Safari
      this.openFolderPrompt(surfaceId);
    }
  },

  async openFolderNative(surfaceId) {
    try {
      const dirHandle = await window.showDirectoryPicker();
      // Get the path from the handle (if available) or use the name
      const folderPath = dirHandle.name || 'Selected Folder';

      // Store the handle for later file operations
      this.directoryHandles = this.directoryHandles || new Map();
      this.directoryHandles.set(surfaceId, dirHandle);

      this.loadFiles(surfaceId, folderPath, dirHandle);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to open folder:', err);
      }
    }
  },

  openFolderPrompt(surfaceId) {
    const defaultPath = this.currentPath || 'E:/Projects/jcode';
    const path = prompt('Enter folder path:', defaultPath);
    if (path && path.trim()) {
      this.loadFiles(surfaceId, path.trim());
    }
  },

  loadFiles(surfaceId, folderPath, dirHandle = null) {
    this.currentPath = folderPath;
    this.dirHandle = dirHandle;

    const fileTree = document.getElementById(`fileTree_${surfaceId}`);
    const pathDisplay = document.getElementById(`filesPath_${surfaceId}`);

    if (pathDisplay) {
      pathDisplay.textContent = folderPath;
    }

    if (fileTree) {
      fileTree.innerHTML = `
        <div class="file-tree-loading">
          <div class="loading-spinner"></div>
          <span>Loading files...</span>
        </div>
      `;
    }

    // Simulate loading - in real implementation, would call jcode gateway
    setTimeout(() => {
      this.renderFileTree(surfaceId, folderPath);
    }, 300);
  },

  renderFileTree(surfaceId, basePath) {
    const fileTree = document.getElementById(`fileTree_${surfaceId}`);
    if (!fileTree) return;

    fileTree.innerHTML = '';

    const dirHandle = this.dirHandle;

    if (dirHandle && 'values' in dirHandle) {
      // Use File System Access API to read real files
      this.renderFileTreeFromHandle(fileTree, dirHandle, surfaceId, 0);
    } else {
      // Fallback: show demo file structure
      this.renderDemoFileTree(fileTree, surfaceId);
    }

    console.log('File tree rendered for:', basePath);
  },

  async renderFileTreeFromHandle(container, dirHandle, surfaceId, depth = 0) {
    try {
      // Sort: folders first, then files, alphabetically
      const entries = [];
      for await (const entry of dirHandle.values()) {
        entries.push(entry);
      }
      entries.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      for (const entry of entries) {
        const item = document.createElement('div');
        item.className = 'file-tree-item';
        item.style.paddingLeft = `${depth * 16 + 8}px`;
        item.dataset.type = entry.kind;
        item.dataset.name = entry.name;

        const icon = entry.kind === 'directory' ? '📁' : this.getFileIcon(entry.name);

        item.innerHTML = `
          <span class="file-expand-icon">${entry.kind === 'directory' ? '▶' : ''}</span>
          <span class="file-icon">${icon}</span>
          <span class="file-name">${entry.name}</span>
        `;

        if (entry.kind === 'directory') {
          item.addEventListener('click', async (e) => {
            e.stopPropagation();
            item.classList.toggle('expanded');
            const iconEl = item.querySelector('.file-expand-icon');
            if (iconEl) iconEl.textContent = item.classList.contains('expanded') ? '▼' : '▶';

            // Check if children already rendered
            const existingChild = item.querySelector('.file-tree-children');
            if (item.classList.contains('expanded') && !existingChild) {
              const childContainer = document.createElement('div');
              childContainer.className = 'file-tree-children';
              item.appendChild(childContainer);
              await this.renderFileTreeFromHandle(childContainer, entry, surfaceId, depth + 1);
            }
          });
        } else {
          // File click - could open file content
          item.addEventListener('dblclick', async () => {
            try {
              const file = await entry.getFile();
              const content = await file.text();
              console.log('File content:', content.substring(0, 200));
              // Could display in a panel or modal
            } catch (err) {
              console.error('Failed to read file:', err);
            }
          });
        }

        container.appendChild(item);
      }
    } catch (err) {
      console.error('Failed to read directory:', err);
      container.innerHTML = `<div class="file-tree-error">Error reading folder: ${err.message}</div>`;
    }
  },

  renderDemoFileTree(fileTree, surfaceId) {
    // Demo file structure
    const demoFiles = [
      { name: 'src', type: 'folder', expanded: true, children: [
        { name: 'main.rs', type: 'file' },
        { name: 'lib.rs', type: 'file' },
        { name: 'gateway.rs', type: 'file' },
        { name: 'server.rs', type: 'file' },
      ]},
      { name: 'web-ui', type: 'folder', children: [
        { name: 'index.html', type: 'file' },
        { name: 'js', type: 'folder', children: [
          { name: 'main.js', type: 'file' },
          { name: 'api.js', type: 'file' },
          { name: 'websocket.js', type: 'file' },
        ]},
        { name: 'css', type: 'folder' },
      ]},
      { name: 'Cargo.toml', type: 'file' },
      { name: 'README.md', type: 'file' },
    ];

    demoFiles.forEach(item => {
      const el = this.renderFileItem(item, 0, surfaceId);
      fileTree.appendChild(el);
    });
  },

  renderFileItem(item, depth, surfaceId) {
    const el = document.createElement('div');
    el.className = `file-tree-item${item.expanded ? ' expanded' : ''}`;
    el.dataset.type = item.type;
    el.style.paddingLeft = `${depth * 16 + 8}px`;

    const isFolder = item.type === 'folder';
    const icon = isFolder ? '📁' : this.getFileIcon(item.name);

    el.innerHTML = `
      <span class="file-expand-icon">${isFolder ? '▶' : ''}</span>
      <span class="file-icon">${icon}</span>
      <span class="file-name">${item.name}</span>
    `;

    if (isFolder) {
      el.addEventListener('click', () => {
        el.classList.toggle('expanded');
        const iconEl = el.querySelector('.file-expand-icon');
        if (iconEl) iconEl.textContent = el.classList.contains('expanded') ? '▼' : '▶';

        // Toggle children visibility
        const childrenContainer = el.querySelector('.file-tree-children');
        if (childrenContainer) {
          childrenContainer.style.display = el.classList.contains('expanded') ? 'block' : 'none';
        }
      });
    }

    // Render children
    if (isFolder && item.children) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'file-tree-children';
      item.children.forEach(child => {
        const childEl = this.renderFileItem(child, depth + 1, surfaceId);
        childrenContainer.appendChild(childEl);
      });
      el.appendChild(childrenContainer);
    }

    return el;
  },

  getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      js: '📜', ts: '📘', jsx: '⚛️', tsx: '⚛️',
      html: '🌐', css: '🎨', json: '📋', md: '📝',
      rs: '🦀', py: '🐍', go: '🐹', java: '☕',
      toml: '⚙️', yaml: '📋', yml: '📋',
      png: '🖼️', jpg: '🖼️', gif: '🖼️', svg: '🖼️'
    };
    return icons[ext] || '📄';
  }
};

window.WorkspaceFilesSurface = WorkspaceFilesSurface;