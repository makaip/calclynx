/**
 * Main TextField class - orchestrates all text field functionality
 * Delegates specialized tasks to content, math, and utility modules
 */
class TextField {
  constructor(textGroup, isNewField, content = '') {
    this.textGroup = textGroup;
    
    // Initialize helper modules
    this.content = new TextFieldContent(this);
    this.utils = new TextFieldUtils(this);
    this.mathSupport = new TextFieldMath(this);
    
    // Initialize DOM and functionality
    this.createContainer();
    this.createEditor(content);
    this.attachEventListeners();
    
    // Initialize math support if MathQuill is available
    if (window.MathQuill) {
      setTimeout(() => {
        this.mathSupport.initializeMathSupport();
        // If content was loaded, reinitialize MathQuill fields after support is ready
        if (content && (
          (typeof content === 'string' && content.includes('mq-inline')) || 
          (typeof content === 'object' && content.mathFields && content.mathFields.length > 0)
        )) {
          setTimeout(() => {
            this.mathSupport.reinitializeMathFields();
          }, 50); // Increased delay to ensure proper initialization
        }
      }, 100);
    }
    
    if (isNewField) {
      // Focus the new field for immediate editing
      setTimeout(() => this.focus(), 10);
    }
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'text-field-container';
    this.container.textFieldInstance = this; // Add reference from DOM element back to the instance

    const circleIndicator = document.createElement('div');
    circleIndicator.className = 'circle-indicator';
    this.container.appendChild(circleIndicator);

    // No drag handle needed since there's only one field per group
    // Group-level dragging is handled by the text group itself

    this.textGroup.element.appendChild(this.container);
  }

  createEditor(content = '') {
    this.editorElement = document.createElement('div');
    this.editorElement.className = 'text-editor';
    this.editorElement.contentEditable = true;
    this.editorElement.spellcheck = false;
    
    // Set initial content
    if (content) {
      // Expect modern optimized format (object with text and mathFields)
      if (typeof content === 'object' && content.text !== undefined && content.mathFields !== undefined) {
        // Use setOptimizedContent for the new format
        setTimeout(() => {
          this.content.setOptimizedContent(content);
        }, 10);
      } else {
        // Fallback for unexpected content types
        console.warn('Unexpected content type in TextField. Expected optimized format with {text, mathFields}:', typeof content, content);
        this.editorElement.appendChild(document.createTextNode(''));
      }
    } else {
      // Ensure there's always a text node for cursor placement
      this.editorElement.appendChild(document.createTextNode(''));
    }

    this.container.appendChild(this.editorElement);
  }

  attachEventListeners() {
    if (!this.editorElement) return;
    if (this.editorElement.dataset.listenersAttached === 'true') return;
    this.editorElement.dataset.listenersAttached = 'true';

    this.editorElement.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        // For single field text groups, Enter should just create a new line
        // Don't prevent default behavior
      } else if (event.key === 'Backspace') {
        // For single field text groups, just allow normal backspace
        // Don't remove the field or move between fields
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        // For single field text groups, allow normal up/down navigation within the text
        // Don't prevent default behavior
      }
    }, true);

    this.editorElement.addEventListener('blur', () => {
      // Save state when field loses focus
      this.textGroup.board.fileManager.saveState();
    });

    // Allow natural click positioning in the text editor
    this.editorElement.addEventListener('click', (event) => {
      // Don't interfere with natural cursor positioning
      event.stopPropagation();
    });

    this.editorElement.addEventListener('input', () => {
      // Auto-save on input changes
      clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => {
        this.textGroup.board.fileManager.saveState();
      }, 500);
    });

    // Prevent the editor from losing focus when clicking on math inline elements
    this.editorElement.addEventListener('mousedown', (event) => {
      if (event.target.closest('.mq-inline')) {
        event.preventDefault();
      }
    });
  }

  focus() {
    if (this.editorElement) {
      this.editorElement.focus();
      
      // Only place cursor at end if field is empty
      // Let natural click behavior handle cursor positioning
      if (!this.editorElement.textContent.trim()) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(this.editorElement);
        range.collapse(false); // Collapse to end
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  remove() {
    // Clean up any pending saves
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Clean up all module-specific resources
    this.mathSupport.cleanup();
    this.utils.cleanup();
    
    // Remove the entire text group since there's only one field per group
    this.textGroup.remove();
  }

  getContent() {
    if (!this.editorElement) return '';
    
    // Return optimized content structure
    return this.content.getOptimizedContent();
  }

  setContent(content) {
    this.content.setContent(content);
  }

  // Legacy methods that delegate to content module for backward compatibility
  getOptimizedContent() {
    return this.content.getOptimizedContent();
  }

  setOptimizedContent(content) {
    return this.content.setOptimizedContent(content);
  }

  // Legacy method that delegates to math module for backward compatibility
  reinitializeMathFields() {
    return this.mathSupport.reinitializeMathFields();
  }

  // Legacy method that delegates to math module for backward compatibility
  initializeMathSupport() {
    return this.mathSupport.initializeMathSupport();
  }
}
