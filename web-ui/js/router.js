// web-ui/js/router.js

const Router = {
  routes: {},
  currentPage: null,

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  register(page, handler) {
    this.routes[page] = handler;
  },

  navigate(page) {
    window.location.hash = page;
  },

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'chat';
    const page = Object.keys(this.routes).includes(hash) ? hash : 'chat';

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Call page handler
    if (this.routes[page] && page !== this.currentPage) {
      this.routes[page]();
      this.currentPage = page;
    }
  }
};

window.Router = Router;