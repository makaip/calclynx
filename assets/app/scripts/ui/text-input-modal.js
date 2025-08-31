/**
 * TextInputModal - Generic text input modal built on BaseModal
 * Can be used for URL input, file names, or any simple text input
 */
class TextInputModal extends BaseModal {
  constructor(options = {}) {
    // Set up config before calling super
    const config = {
      placeholder: 'Enter text...',
      title: '',
      submitText: 'Submit',
      cancelText: 'Cancel',
      showButtons: false,
      validateInput: null,
      ...options.config
    };
    
    // Set config property before super call
    options._textInputConfig = config;
    
    super({
      className: 'text-input-modal',
      zIndex: 3000,
      ...options
    });
    
    this.inputElement = null;
    this.onSubmitCallback = null;
    this.config = config;

    this.initialize();
  }

  initialize() {
    // Ensure config is available from options if not already set
    if (!this.config && this.options._textInputConfig) {
      this.config = this.options._textInputConfig;
    }
    
    // Create the modal element first
    this.modalElement = this.createModalElement();
    this.contentElement = this.modalElement.querySelector('.modal-content');
    
    // Set up text input specific elements before setting up events
    this.setupTextInputElements();
    
    // Now set up base events and custom events
    this.setupBaseEvents();
    this.setupCustomEvents();
  }

  getModalHTML() {
    // Fallback config in case this is called before config is set
    const config = this.config || this.options._textInputConfig || {};
    
    const buttonsHTML = config.showButtons ? `
      <div class="text-input-buttons">
        <button class="text-input-cancel">${config.cancelText || 'Cancel'}</button>
        <button class="text-input-submit">${config.submitText || 'Submit'}</button>
      </div>
    ` : '';

    const titleHTML = config.title ? `
      <div class="text-input-title">${config.title}</div>
    ` : '';

    return `
      <div class="text-input-content modal-content">
        ${titleHTML}
        <input class="text-input-field" type="text" placeholder="${config.placeholder || 'Enter text...'}" />
        ${buttonsHTML}
      </div>
    `;
  }

  setupTextInputElements() {
    this.inputElement = this.modalElement.querySelector('.text-input-field');
    
    // Setup button events if buttons are shown
    if (this.config.showButtons) {
      const submitBtn = this.modalElement.querySelector('.text-input-submit');
      const cancelBtn = this.modalElement.querySelector('.text-input-cancel');
      
      if (submitBtn) {
        submitBtn.addEventListener('click', () => this.submit());
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.hide());
      }
    }
  }

  setupCustomEvents() {
    // Guard against missing input element
    if (!this.inputElement) {
      console.warn('TextInputModal: inputElement not found during setupCustomEvents');
      return;
    }

    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.submit();
      }
      
      // Allow paste operations without interference
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.stopPropagation();
      }
    });
    
    // Handle paste events
    this.inputElement.addEventListener('paste', (e) => {
      e.stopPropagation();
    });

    // Real-time validation if validator is provided
    if (this.config.validateInput) {
      this.inputElement.addEventListener('input', () => this.validateCurrentInput());
    }
  }

  validateCurrentInput() {
    if (!this.config.validateInput) return true;
    
    const value = this.inputElement.value.trim();
    const isValid = this.config.validateInput(value);
    
    this.inputElement.classList.toggle('invalid', !isValid);
    
    // Update submit button state if buttons are shown
    if (this.config.showButtons) {
      const submitBtn = this.modalElement.querySelector('.text-input-submit');
      if (submitBtn) {
        submitBtn.disabled = !isValid;
      }
    }
    
    return isValid;
  }

  submit() {
    const value = this.inputElement.value.trim();
    
    // Validate if validator is provided
    if (this.config.validateInput && !this.validateCurrentInput()) {
      return;
    }
    
    if (value && this.onSubmitCallback) {
      this.onSubmitCallback(value);
    }
    
    this.emit('submit', value);
    this.hide();
  }

  show(callback = null, initialValue = '') {
    this.onSubmitCallback = callback;
    this.inputElement.value = initialValue;
    
    // Validate initial value if validator is provided
    if (this.config.validateInput) {
      this.validateCurrentInput();
    }
    
    super.show();
  }

  onShow() {
    this.inputElement.focus();
    
    // Select all text if there's initial value
    if (this.inputElement.value) {
      this.inputElement.select();
    }
  }

  onHide() {
    this.onSubmitCallback = null;
    this.inputElement.value = '';
    this.inputElement.classList.remove('invalid');
  }

  // Convenience method to set config after creation
  configure(config) {
    this.config = { ...this.config, ...config };
    
    // Update DOM elements if modal is already created
    if (this.modalElement) {
      this.updateModalContent();
    }
  }

  updateModalContent() {
    // Update placeholder
    this.inputElement.placeholder = this.config.placeholder;
    
    // Update title if exists
    const titleElement = this.modalElement.querySelector('.text-input-title');
    if (titleElement && this.config.title) {
      titleElement.textContent = this.config.title;
    }
    
    // Update button text if buttons exist
    const submitBtn = this.modalElement.querySelector('.text-input-submit');
    const cancelBtn = this.modalElement.querySelector('.text-input-cancel');
    
    if (submitBtn) submitBtn.textContent = this.config.submitText;
    if (cancelBtn) cancelBtn.textContent = this.config.cancelText;
  }
}

/**
 * Factory function to create common text input modals
 */
class TextInputModalFactory {
  static createImageUrlInput() {
    return new TextInputModal({
      config: {
        placeholder: 'Enter an image URL...',
        title: 'Add Image',
        validateInput: (url) => {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        }
      }
    });
  }

  static createFileNameInput() {
    return new TextInputModal({
      config: {
        placeholder: 'Enter file name...',
        title: 'File Name',
        showButtons: true,
        validateInput: (name) => {
          return name.trim().length > 0 && !/[<>:"/\\|?*]/.test(name);
        }
      }
    });
  }

  static createVariableInput(variableName = 'variable') {
    return new TextInputModal({
      config: {
        placeholder: `Enter ${variableName}...`,
        title: `Specify ${variableName}`,
        validateInput: (variable) => {
          return /^[a-zA-Z][a-zA-Z0-9]*$/.test(variable);
        }
      }
    });
  }
}
