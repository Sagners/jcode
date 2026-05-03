// web-ui/js/theme.js

const Theme = {
  STORAGE_KEY: 'jcode_theme',

  themes: {
    dark: {
      name: 'Dark',
      preview: 'linear-gradient(135deg, #0F0F14 0%, #1A1A1F 100%)',
      colors: {
        '--bg': '#0F0F14',
        '--bg-gradient': 'linear-gradient(145deg, #0F0F14 0%, #141419 50%, #0F0F14 100%)',
        '--surface': '#1A1A1F',
        '--surface-elevated': '#242429',
        '--surface-glass': 'rgba(26, 26, 31, 0.85)',
        '--border': 'rgba(255, 255, 255, 0.08)',
        '--border-light': 'rgba(255, 255, 255, 0.12)',
        '--accent': '#4DD9A6',
        '--accent-rgb': '77, 217, 166',
        '--accent-tint': 'rgba(77, 217, 166, 0.15)',
        '--accent-glow': 'rgba(77, 217, 166, 0.3)',
        '--accent-gradient': 'linear-gradient(135deg, #4DD9A6 0%, #3DBD91 100%)',
        '--text-primary': 'rgba(255, 255, 255, 0.92)',
        '--text-secondary': 'rgba(255, 255, 255, 0.55)',
        '--text-tertiary': 'rgba(255, 255, 255, 0.35)',
        '--warning': '#F59E0B',
        '--warning-tint': 'rgba(245, 158, 11, 0.15)',
        '--error': '#D94D59',
        '--error-tint': 'rgba(217, 77, 89, 0.15)',
        '--success': '#22c55e',
        '--status-idle': '#22c55e',
        '--status-running': '#f59e0b',
        '--status-error': '#ef4444',
        '--shadow-glow': '0 0 20px rgba(77, 217, 166, 0.3)',
        '--shadow-glow-lg': '0 0 40px rgba(77, 217, 166, 0.4)',
      }
    },
    light: {
      name: 'Light',
      preview: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F7 100%)',
      colors: {
        '--bg': '#FFFFFF',
        '--bg-gradient': 'linear-gradient(145deg, #FFFFFF 0%, #F8F8FA 50%, #FFFFFF 100%)',
        '--surface': '#F5F5F7',
        '--surface-elevated': '#FFFFFF',
        '--surface-glass': 'rgba(255, 255, 255, 0.9)',
        '--border': 'rgba(0, 0, 0, 0.08)',
        '--border-light': 'rgba(0, 0, 0, 0.12)',
        '--accent': '#10B981',
        '--accent-rgb': '16, 185, 129',
        '--accent-tint': 'rgba(16, 185, 129, 0.12)',
        '--accent-glow': 'rgba(16, 185, 129, 0.25)',
        '--accent-gradient': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        '--text-primary': 'rgba(0, 0, 0, 0.9)',
        '--text-secondary': 'rgba(0, 0, 0, 0.55)',
        '--text-tertiary': 'rgba(0, 0, 0, 0.35)',
        '--warning': '#F59E0B',
        '--warning-tint': 'rgba(245, 158, 11, 0.12)',
        '--error': '#EF4444',
        '--error-tint': 'rgba(239, 68, 68, 0.12)',
        '--success': '#22C55E',
        '--status-idle': '#22C55E',
        '--status-running': '#F59E0B',
        '--status-error': '#EF4444',
        '--shadow-glow': '0 0 20px rgba(16, 185, 129, 0.25)',
        '--shadow-glow-lg': '0 0 40px rgba(16, 185, 129, 0.35)',
      }
    },
    midnight: {
      name: 'Midnight',
      preview: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%)',
      colors: {
        '--bg': '#0a0a1a',
        '--bg-gradient': 'linear-gradient(145deg, #0a0a1a 0%, #0f0f2a 50%, #0a0a1a 100%)',
        '--surface': '#12122a',
        '--surface-elevated': '#1a1a3a',
        '--surface-glass': 'rgba(18, 18, 42, 0.9)',
        '--border': 'rgba(100, 100, 255, 0.1)',
        '--border-light': 'rgba(100, 100, 255, 0.15)',
        '--accent': '#818CF8',
        '--accent-rgb': '129, 140, 248',
        '--accent-tint': 'rgba(129, 140, 248, 0.15)',
        '--accent-glow': 'rgba(129, 140, 248, 0.3)',
        '--accent-gradient': 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
        '--text-primary': 'rgba(255, 255, 255, 0.92)',
        '--text-secondary': 'rgba(255, 255, 255, 0.55)',
        '--text-tertiary': 'rgba(255, 255, 255, 0.35)',
        '--warning': '#FBBF24',
        '--warning-tint': 'rgba(251, 191, 36, 0.15)',
        '--error': '#F87171',
        '--error-tint': 'rgba(248, 113, 113, 0.15)',
        '--success': '#34D399',
        '--status-idle': '#34D399',
        '--status-running': '#FBBF24',
        '--status-error': '#F87171',
        '--shadow-glow': '0 0 20px rgba(129, 140, 248, 0.3)',
        '--shadow-glow-lg': '0 0 40px rgba(129, 140, 248, 0.4)',
      }
    }
  },

  currentTheme: 'dark',

  init() {
    // Load saved theme
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved && this.themes[saved]) {
      this.currentTheme = saved;
    }

    // Apply theme
    this.apply(this.currentTheme);

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          this.apply(e.matches ? 'dark' : 'light');
        }
      });
    }
  },

  apply(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;

    this.currentTheme = themeName;
    localStorage.setItem(this.STORAGE_KEY, themeName);

    const root = document.documentElement;

    // Apply all color variables
    Object.entries(theme.colors).forEach(([variable, value]) => {
      root.style.setProperty(variable, value);
    });

    // Add theme class to body for CSS targeting
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-midnight');
    document.body.classList.add(`theme-${themeName}`);

    // Dispatch event for components to react
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: themeName } }));
  },

  toggle() {
    const themes = Object.keys(this.themes);
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.apply(themes[nextIndex]);
  },

  getCurrentTheme() {
    return this.themes[this.currentTheme];
  }
};

// Initialize theme when DOM is ready
document.addEventListener('DOMContentLoaded', () => Theme.init());