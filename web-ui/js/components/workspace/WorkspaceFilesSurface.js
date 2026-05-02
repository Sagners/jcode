// web-ui/js/components/workspace/WorkspaceFilesSurface.js

const WorkspaceFilesSurface = {
  fileTree: null,
  expandedFolders: new Set(),

  // Create and render the surface component
  create(surfaceId) {
    const container = document.createElement('div');
    container.className = 'surface-container workspace-files-surface';
    container.id = `surface-${surfaceId}`;
    container.dataset.surfaceId = surfaceId;

    container.innerHTML = `
      <div class="surface-header">
        <span class="surface-icon">📁</span>
        <span class="surface-title">Files</span>
        <div class="surface-actions">
          <button class="surface-action-btn" title="Refresh" data-action="refresh">↻</button>
          <button class="surface-action-btn" title="Collapse All" data-action="collapse">⊞</button>
          <button class="surface-action-btn danger" title="Close" data-action="close">✕</button>
        </div>
      </div>
      <div class="surface-body">
        <div class="file-tree" id="fileTree-${surfaceId}">
          ${this.renderFileTree()}
        </div>
      </div>
    `;

    this.attachEvents(container, surfaceId);
    return container;
  },

  // Render the file tree
  renderFileTree() {
    if (!this.fileTree || this.fileTree.length === 0) {
      return `
        <div class="file-tree-empty">
          <span class="file-tree-empty-icon">📂</span>
          <span class="file-tree-empty-text">No files loaded</span>
        </div>
      `;
    }

    return this.fileTree.map(item => this.renderFileItem(item)).join('');
  },

  // Render a single file/folder item
  renderFileItem(item, depth = 0) {
    const isFolder = item.type === 'folder';
    const icon = isFolder ? '📁' : '📄';
    const isExpanded = this.expandedFolders.has(item.path);
    const hasChildren = isFolder && item.children && item.children.length > 0;

    const childrenHtml = hasChildren
      ? `<div class="file-tree-children" style="display: ${isExpanded ? 'block' : 'none'};">
          ${item.children.map(child => this.renderFileItem(child, depth + 1)).join('')}
        </div>`
      : '';

    return `
      <div class="file-tree-item ${isFolder ? 'folder' : 'file'}"
           data-path="${this.escapeHtml(item.path)}"
           data-type="${item.type}"
           ${depth > 0 ? `style="padding-left: ${depth * 16 + 8}px;"` : ''}>
        ${isFolder ? `<span class="file-expand-icon">${isExpanded ? '▾' : '▸'}</span>` : ''}
        <span class="file-icon">${icon}</span>
        <span class="file-name">${this.escapeHtml(item.name)}</span>
        ${childrenHtml}
      </div>
    `;
  },

  // Attach event listeners
  attachEvents(container, surfaceId) {
    const fileTree = container.querySelector(`#fileTree-${surfaceId}`);

    if (fileTree) {
      // Folder toggle (click on folder item or expand icon)
      fileTree.addEventListener('click', (e) => {
        const item = e.target.closest('.file-tree-item[data-type="folder"]');
        if (item) {
          const path = item.dataset.path;
          this.toggleFolder(path, item);
        }
      });

      // File double-click to open
      fileTree.addEventListener('dblclick', (e) => {
        const item = e.target.closest('.file-tree-item[data-type="file"]');
        if (item) {
          const path = item.dataset.path;
          this.openFile(surfaceId, path);
        }
      });
    }

    // Header action buttons
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleAction(action, surfaceId);
      });
    });
  },

  // Toggle folder expansion
  toggleFolder(path, element) {
    const childrenEl = element.querySelector('.file-tree-children');
    if (!childrenEl) return;

    if (this.expandedFolders.has(path)) {
      this.expandedFolders.delete(path);
      childrenEl.style.display = 'none';
      element.classList.remove('expanded');
      const expandIcon = element.querySelector('.file-expand-icon');
      if (expandIcon) expandIcon.textContent = '▸';
    } else {
      this.expandedFolders.add(path);
      childrenEl.style.display = 'block';
      element.classList.add('expanded');
      const expandIcon = element.querySelector('.file-expand-icon');
      if (expandIcon) expandIcon.textContent = '▾';
    }
  },

  // Open file (dispatch event for external handling)
  openFile(surfaceId, path) {
    const event = new CustomEvent('workspace:open-file', {
      detail: { surfaceId, path }
    });
    document.dispatchEvent(event);
    console.log(`[WorkspaceFilesSurface] Open file: ${path}`);
  },

  // Handle header actions
  handleAction(action, surfaceId) {
    switch (action) {
      case 'refresh':
        this.refresh(surfaceId);
        break;
      case 'collapse':
        this.collapseAll();
        break;
      case 'close':
        this.close(surfaceId);
        break;
    }
  },

  // Load file tree from project path (mock data)
  loadFileTree(projectPath) {
    // TODO: Replace with actual API call to load file tree
    // For now, using mock data
    console.log(`[WorkspaceFilesSurface] Loading file tree from: ${projectPath}`);

    this.fileTree = [
      {
        name: 'src',
        type: 'folder',
        path: projectPath + '/src',
        children: [
          { name: 'main.js', type: 'file', path: projectPath + '/src/main.js' },
          {
            name: 'components',
            type: 'folder',
            path: projectPath + '/src/components',
            children: [
              { name: 'App.js', type: 'file', path: projectPath + '/src/components/App.js' },
              { name: 'Button.js', type: 'file', path: projectPath + '/src/components/Button.js' }
            ]
          },
          {
            name: 'utils',
            type: 'folder',
            path: projectPath + '/src/utils',
            children: [
              { name: 'helpers.js', type: 'file', path: projectPath + '/src/utils/helpers.js' }
            ]
          }
        ]
      },
      { name: 'package.json', type: 'file', path: projectPath + '/package.json' },
      { name: 'README.md', type: 'file', path: projectPath + '/README.md' },
      {
        name: 'docs',
        type: 'folder',
        path: projectPath + '/docs',
        children: [
          { name: 'api.md', type: 'file', path: projectPath + '/docs/api.md' }
        ]
      }
    ];

    // Auto-expand first level
    this.fileTree.forEach(item => {
      if (item.type === 'folder') {
        this.expandedFolders.add(item.path);
      }
    });
  },

  // Refresh the file tree display
  refresh(surfaceId) {
    const fileTreeEl = document.getElementById(`fileTree-${surfaceId}`);
    if (fileTreeEl) {
      fileTreeEl.innerHTML = this.renderFileTree();
    }

    const event = new CustomEvent('workspace:refresh', {
      detail: { surfaceId }
    });
    document.dispatchEvent(event);
    console.log('[WorkspaceFilesSurface] Refreshed');
  },

  // Expand all folders
  expandAll() {
    this.expandFolderRecursive(this.fileTree);
    this.updateDisplay();
  },

  // Collapse all folders
  collapseAll() {
    this.expandedFolders.clear();
    this.updateDisplay();
  },

  // Recursively expand all folders
  expandFolderRecursive(items) {
    items.forEach(item => {
      if (item.type === 'folder') {
        this.expandedFolders.add(item.path);
        if (item.children) {
          this.expandFolderRecursive(item.children);
        }
      }
    });
  },

  // Update file tree display
  updateDisplay() {
    document.querySelectorAll('.file-tree').forEach(el => {
      el.innerHTML = this.renderFileTree();
    });
  },

  // Close surface
  close(surfaceId) {
    const event = new CustomEvent('workspace:close-surface', {
      detail: { surfaceId }
    });
    document.dispatchEvent(event);

    SurfaceStore.deleteSurface(surfaceId);
  },

  // Utility: escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

window.WorkspaceFilesSurface = WorkspaceFilesSurface;