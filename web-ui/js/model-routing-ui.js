// web-ui/js/model-routing-ui.js

const ModelRoutingUI = {
  unsubscribe: null,

  init() {
    const select = document.getElementById('modelSelect');
    const badge = document.getElementById('modelRoutingModeBadge');
    if (!select || !window.ModelRoutingStore) return;

    this.populateSelect(select);
    this.unsubscribe = ModelRoutingStore.subscribe(state => {
      this.applyState(select, badge, state);
    });

    select.addEventListener('change', () => {
      ModelRoutingStore.save({ defaultModel: select.value });
    });

    badge?.addEventListener('click', () => {
      if (window.WorkspaceController?.openSettingsSurface) {
        WorkspaceController.openSettingsSurface('model');
      }
    });
  },

  populateSelect(select) {
    const current = ModelRoutingStore.snapshot().defaultModel;
    select.innerHTML = ModelRoutingStore.modelOptions().map(option => `
      <option value="${this.escapeHtml(option.value)}">${this.escapeHtml(option.shortLabel || option.label)}</option>
    `).join('');
    this.ensureOption(select, current);
    select.value = current;
  },

  applyState(select, badge, state) {
    this.ensureOption(select, state.defaultModel);
    if (select.value !== state.defaultModel) {
      select.value = state.defaultModel;
    }
    if (badge) {
      badge.textContent = ModelRoutingStore.modeLabel(state.routingMode);
      badge.title = `Model routing: ${ModelRoutingStore.modeLabel(state.routingMode)}. Default: ${ModelRoutingStore.modelLabel(state.defaultModel)}.`;
    }
  },

  ensureOption(select, value) {
    if (!value || Array.from(select.options).some(option => option.value === value)) {
      return;
    }

    const option = document.createElement('option');
    option.value = value;
    option.textContent = ModelRoutingStore.modelLabel(value, true);
    select.appendChild(option);
  },

  escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }
};

document.addEventListener('DOMContentLoaded', () => ModelRoutingUI.init());

window.ModelRoutingUI = ModelRoutingUI;
