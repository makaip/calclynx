class BaseModal { //TODO: make this simpler bc rn its cooked
  constructor(options = {}) {
    if (this.constructor === BaseModal) {
      throw new Error("BaseModal is abstract and cannot be instantiated directly");
    }
    
    this.options = {
      className: 'base-modal',
      zIndex: 3000,
      showCloseOnOutsideClick: true,
      showCloseOnEscape: true,
      ...options
    };
    
    this.modalElement = null;
    this.contentElement = null;
    this.isVisible = false;
    this.callbacks = {};
    
    // Initialize after subclass constructor completes
    Promise.resolve().then(() => this.initialize());
  }

  initialize() {
    this.modalElement = this.createModalElement();
    this.contentElement = this.modalElement.querySelector('.modal-content');
    this.setupBaseEvents();
    this.setupCustomEvents();
  }

  createModalElement() {
    const modal = document.createElement('div');
    modal.className = this.options.className;
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.background = 'rgba(0, 0, 0, 0.5)';
    modal.style.zIndex = this.options.zIndex;
    
    modal.innerHTML = this.getModalHTML();
    document.body.appendChild(modal);
    
    return modal;
  }

  setupBaseEvents() {
    if (this.options.showCloseOnEscape) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isVisible) {
          this.hide();
        }
      });
    }

    if (this.options.showCloseOnOutsideClick) {
      document.addEventListener('mousedown', (e) => {
        if (this.isVisible && 
            this.modalElement && 
            !this.contentElement.contains(e.target)) {
          this.hide();
        }
      });
    }
  }

  show(data = null) {
    this.isVisible = true;
    this.modalElement.style.display = 'block';
    this.onShow(data);
    this.emit('show', data);
  }

  hide() {
    this.isVisible = false;
    this.modalElement.style.display = 'none';
    this.onHide();
    this.emit('hide');
  }

  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  emit(event, data = null) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  getModalHTML() {
    throw new Error("getModalHTML() must be implemented by subclass");
  }

  setupCustomEvents() {}
  onShow(data) {}
  onHide() {}
}

export { BaseModal };
