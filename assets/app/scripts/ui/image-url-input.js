class ImageUrlInput {
  constructor() {
    this.modalElement = this.createModalElement();
    this.inputElement = this.modalElement.querySelector('.image-url-input');
    this.onSubmitCallback = null;
    this.setupEvents();
  }

  createModalElement() {
    const modal = document.createElement('div');
    modal.className = 'image-url-modal';
    modal.style.display = 'none';
    modal.id = 'image-url-modal';
    modal.innerHTML = `
      <div class="image-url-content">
        <input class="image-url-input" type="text" placeholder="Enter an image URL..." />
      </div>
    `;
    document.body.appendChild(modal);
    
    return modal;
  }

  setupEvents() {
    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
      
      if (e.key === 'Enter') {
        e.preventDefault();
        this.submit();
      }
      
      // Allow paste operations (Ctrl/Cmd+V) to work normally
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // Don't prevent default - let the browser handle paste
        e.stopPropagation(); // Stop event from bubbling to prevent mathboard handlers
      }
    });
    
    // Explicitly handle paste events to ensure they work
    this.inputElement.addEventListener('paste', (e) => {
      // Allow the paste to proceed normally
      e.stopPropagation(); // Prevent the event from bubbling up
    });
    
    // Click outside to close
    document.addEventListener('mousedown', (e) => {
      if (this.modalElement.style.display === 'block' && 
          !this.modalElement.querySelector('.image-url-content').contains(e.target)) {
        this.hide();
      }
    });
  }

  show(callback) {
    this.onSubmitCallback = callback;
    this.modalElement.style.display = 'block';
    this.inputElement.value = '';
    this.inputElement.focus();
  }

  hide() {
    this.modalElement.style.display = 'none';
    this.onSubmitCallback = null;
  }

  submit() {
    const url = this.inputElement.value.trim();
    if (url && this.onSubmitCallback) {
      this.onSubmitCallback(url);
    }
    this.hide();
  }
}

// Create global instance
window.imageUrlInput = new ImageUrlInput();
