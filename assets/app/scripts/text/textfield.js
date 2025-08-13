class TextField {
  constructor(textGroup, isNewField, content = '') {
    this.textGroup = textGroup;
    this.createContainer();
    this.createEditor(content);
    this.attachEventListeners();
    
    // Initialize math support if MathQuill is available
    if (window.MathQuill) {
      setTimeout(() => this.initializeMathSupport(), 100);
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
    this.editorElement.setAttribute('data-placeholder', 'Type text here... (Press $ for math)');
    
    // Set initial content
    if (content) {
      this.editorElement.textContent = content;
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
      if (window.versionManager) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
          window.versionManager.saveState();
        }, 1000); // Debounce saves
      }
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
    
    // Remove the entire text group since there's only one field per group
    this.textGroup.remove();
  }

  getContent() {
    return this.editorElement ? this.editorElement.textContent : '';
  }

  setContent(content) {
    if (this.editorElement) {
      this.editorElement.textContent = content;
    }
  }

  // Support for math inline functionality similar to test.html
  initializeMathSupport() {
    if (!this.editorElement || this.mathSupportInitialized) return;
    this.mathSupportInitialized = true;

    const MQ = window.MathQuill ? window.MathQuill.getInterface(2) : null;
    if (!MQ) return;

    const editor = this.editorElement;

    // Utility functions from test.html
    const setCaretAfter = (node) => {
      const sel = window.getSelection();
      const range = document.createRange();

      if (node && node.nodeType === Node.TEXT_NODE) {
        const len = node.nodeValue.length;
        range.setStart(node, Math.min(len, 1));
        range.collapse(true);
      } else {
        const parent = node.parentNode;
        const index = Array.prototype.indexOf.call(parent.childNodes, node);
        if (parent.childNodes[index + 1]) {
          range.setStart(parent.childNodes[index + 1], 0);
        } else {
          const t = document.createTextNode('');
          parent.appendChild(t);
          range.setStart(t, 0);
        }
        range.collapse(true);
      }

      sel.removeAllRanges();
      sel.addRange(range);
      editor.focus();
    };

    const setCaretBefore = (node) => {
      const sel = window.getSelection();
      const range = document.createRange();
      
      const parent = node.parentNode;
      const index = Array.prototype.indexOf.call(parent.childNodes, node);
      
      if (index > 0) {
        const prevNode = parent.childNodes[index - 1];
        if (prevNode.nodeType === Node.TEXT_NODE) {
          range.setStart(prevNode, prevNode.nodeValue.length);
        } else {
          range.setStartBefore(node);
        }
      } else {
        range.setStartBefore(node);
      }
      
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.focus();
    };

    const insertMathAtCaret = () => {
      const sel = window.getSelection();
      if (!sel.rangeCount) return;

      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.className = 'mq-inline';
      span.dataset.latex = '';

      const afterMarker = document.createTextNode('\u200B');

      range.deleteContents();
      range.insertNode(span);
      span.parentNode.insertBefore(afterMarker, span.nextSibling);

      this.initializeMathField(span, true);
    };

    // Add math field initialization (simplified version from test.html)
    this.initializeMathField = (span, shouldFocus = true) => {
      const mq = MQ.MathField(span, {
        spaceBehavesLikeTab: false,
        restrictMismatchedBrackets: true,
        sumStartsWithNEquals: true,
        autoCommands: 'pi theta sqrt nthroot int sum prod coprod infty infinity',
        autoOperatorNames: 'sin cos tan csc sec cot sinh cosh tanh csch sech coth log ln lim mod lcm gcd nPr nCr',
        
        handlers: {
          edit: () => { 
            span.dataset.latex = mq.latex(); 
          },
          moveOutOf: (dir) => {
            mq.blur();
            if (dir === MQ.L) {
              setCaretBefore(span);
            } else if (dir === MQ.R) {
              setCaretAfter(span);
            }
          },
          deleteOutOf: (dir) => {
            const latex = mq.latex().trim();
            if (latex === '') {
              mq.blur();
              const marker = span.nextSibling;
              if (dir === MQ.L) {
                setCaretBefore(span);
              }
              span.remove();
              if (marker && marker.nodeType === Node.TEXT_NODE && marker.nodeValue === '\u200B') {
                marker.remove();
              }
            }
          }
        }
      });

      if (shouldFocus) {
        mq.focus();
      }

      return mq;
    };

    // Add keyboard handler for math insertion
    editor.addEventListener('keydown', (ev) => {
      // Don't interfere with existing text field navigation
      if (['ArrowUp', 'ArrowDown', 'Enter', 'Backspace'].includes(ev.key)) {
        return;
      }

      if (ev.key === '$') {
        ev.preventDefault();
        insertMathAtCaret();
      }
    });

    // Add click handler for math fields
    editor.addEventListener('click', (ev) => {
      const clicked = ev.target;
      const mqParent = clicked.closest && clicked.closest('.mq-inline');
      if (mqParent) {
        setTimeout(() => {
          this.initializeMathField(mqParent, true);
        }, 10);
      }
    });
  }
}
