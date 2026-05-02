// web-ui/js/components/composer.js

const ComposerComponent = {
  container: null,
  textarea: null,
  sendBtn: null,
  isGenerating: false,
  onSendCallback: null,
  onStopCallback: null,

  init() {
    this.container = document.createElement('div');
    this.container.className = 'composer';

    // Textarea
    this.textarea = document.createElement('textarea');
    this.textarea.className = 'composer-input';
    this.textarea.placeholder = 'Message jcode...';
    this.textarea.rows = 1;

    // Send button
    this.sendBtn = document.createElement('button');
    this.sendBtn.className = 'btn primary composer-send';
    this.sendBtn.innerHTML = '&#8593;';
    this.sendBtn.title = 'Send message (Enter)';

    // Event listeners
    this.textarea.addEventListener('keydown', (e) => this.handleKeydown(e));
    this.textarea.addEventListener('input', () => this.autoResize());
    this.sendBtn.addEventListener('click', () => this.handleSend());

    this.container.appendChild(this.textarea);
    this.container.appendChild(this.sendBtn);
  },

  getElement() {
    return this.container;
  },

  handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
    }
  },

  handleSend() {
    if (this.isGenerating) return;

    const content = this.textarea.value.trim();
    if (!content) return;

    if (this.onSendCallback) {
      this.onSendCallback(content);
    }

    this.textarea.value = '';
    this.textarea.style.height = 'auto';
  },

  autoResize() {
    this.textarea.style.height = 'auto';
    this.textarea.style.height = Math.min(this.textarea.scrollHeight, 200) + 'px';
  },

  setGenerating(generating) {
    this.isGenerating = generating;
    this.textarea.disabled = generating;

    if (generating) {
      this.sendBtn.className = 'btn composer-send composer-stop';
      this.sendBtn.innerHTML = '&#9632;'; // Stop square
      this.sendBtn.title = 'Stop generation';
    } else {
      this.sendBtn.className = 'btn primary composer-send';
      this.sendBtn.innerHTML = '&#8593;';
      this.sendBtn.title = 'Send message (Enter)';
    }
  },

  onSend(callback) {
    this.onSendCallback = callback;
  },

  onStop(callback) {
    this.onStopCallback = callback;
  },

  focus() {
    this.textarea.focus();
  },

  clear() {
    this.textarea.value = '';
    this.textarea.style.height = 'auto';
  }
};

window.ComposerComponent = ComposerComponent;