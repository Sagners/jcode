// web-ui/js/desktop.js

const DesktopBridge = {
  context: {
    isTauri: false,
    platform: 'web',
    appVersion: null,
    jcodePath: null,
    gatewayUrl: null,
    error: null
  },

  async init() {
    if (!window.__TAURI__?.core?.invoke) {
      this.context = { ...this.context, isTauri: false };
      return this.context;
    }

    try {
      const context = await window.__TAURI__.core.invoke('get_desktop_context');
      this.context = {
        isTauri: true,
        platform: context.platform || 'desktop',
        appVersion: context.app_version || context.appVersion || null,
        jcodePath: context.jcode_path || context.jcodePath || null,
        gatewayUrl: context.gateway_url || context.gatewayUrl || null,
        error: null
      };

      if (!localStorage.getItem('jcode_gateway_url') && this.context.gatewayUrl) {
        API.baseUrl = this.context.gatewayUrl;
      }
    } catch (e) {
      this.context = {
        ...this.context,
        isTauri: true,
        error: e.message || String(e)
      };
    }

    if (window.ConnectionStore?.setDesktopContext) {
      ConnectionStore.setDesktopContext(this.context);
    }

    return this.context;
  },

  snapshot() {
    return { ...this.context };
  }
};

window.DesktopBridge = DesktopBridge;
