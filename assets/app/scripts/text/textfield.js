class TextField {
  constructor(textGroup, isNewField, content = '') {
    this.textGroup = textGroup;
    this.createContainer();
    this.createEditor(content);
    this.attachEventListeners();
    
    // Initialize math support if MathQuill is available
    if (window.MathQuill) {
      setTimeout(() => {
        this.initializeMathSupport();
        // If content was loaded, reinitialize MathQuill fields after support is ready
        if (content && (
          (typeof content === 'string' && content.includes('mq-inline')) || 
          (typeof content === 'object' && content.mathFields && content.mathFields.length > 0)
        )) {
          setTimeout(() => {
            this.reinitializeMathFields();
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
          this.setOptimizedContent(content);
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
    
    // Clean up math field check timeout
    if (this.mathFieldCheckTimeout) {
      clearTimeout(this.mathFieldCheckTimeout);
    }
    
    // Clean up selection change handler
    if (this.selectionChangeHandler) {
      document.removeEventListener('selectionchange', this.selectionChangeHandler);
    }
    
    // Remove the entire text group since there's only one field per group
    this.textGroup.remove();
  }

  getContent() {
    if (!this.editorElement) return '';
    
    // Return optimized content structure
    return this.getOptimizedContent();
  }

  // Method to extract optimized content structure
  getOptimizedContent() {
    if (!this.editorElement) return { text: '', mathFields: [] };
    
    const content = { text: '', mathFields: [] };
    let textIndex = 0;
    
    // Walk through all child nodes to build optimized structure
    const walkNodes = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        content.text += node.textContent;
        textIndex += node.textContent.length;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.classList.contains('mq-inline')) {
          // This is a math field - store its position and LaTeX
          const latex = node.dataset.latex || '';
          content.mathFields.push({
            position: textIndex,
            latex: latex
          });
          // Add a placeholder character in text to maintain positions
          content.text += '\uE000'; // Private use character as placeholder
          textIndex += 1;
        } else {
          // Regular element, process its children
          Array.from(node.childNodes).forEach(walkNodes);
        }
      }
    };
    
    Array.from(this.editorElement.childNodes).forEach(walkNodes);
    
    return content;
  }

  setContent(content) {
    if (this.editorElement) {
      if (content) {
        // Expect modern optimized format only
        if (typeof content === 'object' && content.text !== undefined && content.mathFields !== undefined) {
          this.setOptimizedContent(content);
        } else {
          // Fallback for unknown format
          console.warn('Unexpected content format in setContent. Expected optimized format with {text, mathFields}:', typeof content, content);
          this.editorElement.innerHTML = '';
          this.editorElement.appendChild(document.createTextNode(''));
        }
      } else {
        // Ensure there's always a text node for cursor placement
        this.editorElement.innerHTML = '';
        this.editorElement.appendChild(document.createTextNode(''));
      }
    }
  }

  // Method to set content from optimized format
  setOptimizedContent(content) {
    if (!this.editorElement) return;
    
    // Clear existing content
    this.editorElement.innerHTML = '';
    
    const { text, mathFields } = content;
    let currentPos = 0;
    
    // Sort math fields by position to process them in order
    const sortedMathFields = [...mathFields].sort((a, b) => a.position - b.position);
    
    for (const mathField of sortedMathFields) {
      // Add text before this math field
      if (mathField.position > currentPos) {
        const textBefore = text.substring(currentPos, mathField.position);
        if (textBefore) {
          this.editorElement.appendChild(document.createTextNode(textBefore));
        }
      }
      
      // Create math field span
      const span = document.createElement('span');
      span.className = 'mq-inline';
      span.dataset.latex = mathField.latex;
      console.log('Creating math span with LaTeX:', mathField.latex);
      this.editorElement.appendChild(span);
      
      // Skip the placeholder character in text
      currentPos = mathField.position + 1;
    }
    
    // Add remaining text after last math field
    if (currentPos < text.length) {
      const remainingText = text.substring(currentPos);
      if (remainingText) {
        this.editorElement.appendChild(document.createTextNode(remainingText));
      }
    }
    
    // Ensure there's always a text node if editor is empty
    if (this.editorElement.childNodes.length === 0) {
      this.editorElement.appendChild(document.createTextNode(''));
    }
    
    // Reinitialize MathQuill fields
    setTimeout(() => {
      this.reinitializeMathFields();
    }, 10);
  }

  // Method to reinitialize MathQuill fields after content is restored
  reinitializeMathFields() {
    if (!this.mathSupportInitialized || !window.MathQuill || !this.initializeMathField) return;
    
    const MQ = window.MathQuill.getInterface(2);
    if (!MQ) return;
    
    const mathSpans = this.editorElement.querySelectorAll('.mq-inline');
    mathSpans.forEach(span => {
      // Check if already initialized to prevent double initialization
      if (span.dataset.mqInitialized === 'true') {
        return;
      }
      
      // Get the latex from data attribute if it exists
      const latex = span.dataset.latex || '';
      if (latex) {
        // Clear the span completely and render as static math
        span.innerHTML = '';
        // Ensure the latex data attribute is preserved for later conversion to editable
        span.dataset.latex = latex;
        span.dataset.mqInitialized = 'true';
        console.log('Rendering static math with LaTeX:', latex);
        try {
          MQ.StaticMath(span).latex(latex);
        } catch (e) {
          console.warn('Failed to render static math for:', latex, e);
          // Fallback: show latex as text
          span.textContent = latex;
        }
      } else {
        // No latex data, mark as initialized but empty
        span.dataset.mqInitialized = 'true';
      }
    });
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

    // Check if cursor is at the beginning of a MathQuill field
    const isCursorAtBeginningOfMath = () => {
      const sel = window.getSelection();
      if (!sel.rangeCount) return null;
      
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      
      let mathSpan = null;
      if (node.nodeType === Node.TEXT_NODE) {
        mathSpan = node.parentNode.closest('.mq-inline');
      } else {
        mathSpan = node.closest('.mq-inline');
      }
      
      if (mathSpan) {
        try {
          const mq = MQ.MathField(mathSpan);
          const latex = mq.latex().trim();
          return { mathSpan, mq, atStart: latex === '' };
        } catch (e) {
          return null;
        }
      }
      
      return null;
    };

    // Detect if cursor has entered a math field and activate it
    const checkAndActivateMathField = () => {
      const sel = window.getSelection();
      if (!sel.rangeCount) return false;
      
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      
      let mathSpan = null;
      if (node.nodeType === Node.TEXT_NODE) {
        mathSpan = node.parentNode.closest('.mq-inline');
      } else {
        mathSpan = node.closest('.mq-inline');
      }
      
      if (mathSpan) {
        // Activate the math field if cursor is inside it
        console.log('Cursor detected inside math field, activating...');
        this.initializeMathField(mathSpan, true);
        return true;
      }
      
      return false;
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

    // Add math field initialization with enhanced boundary detection from test.html
    this.initializeMathField = (span, shouldFocus = true) => {
      // Check if already initialized as editable to prevent double initialization
      if (span.dataset.mqEditable === 'true') {
        console.log('Math field already initialized as editable, skipping...');
        if (shouldFocus) {
          try {
            const existingMQ = MQ.MathField(span);
            if (existingMQ && existingMQ.focus) {
              existingMQ.focus();
            }
          } catch (e) {
            console.warn('Could not focus existing math field:', e);
          }
        }
        return;
      }
      
      // First, preserve the original LaTeX content before any modifications
      const originalLatex = span.dataset.latex || '';
      console.log('Initializing math field with LaTeX:', originalLatex);
      
      try {
        const existingMQ = MQ.MathField(span);
        if (existingMQ && existingMQ.el()) {
          existingMQ.el().removeEventListener('keydown', existingMQ._keydownHandler);
        }
      } catch (e) {
        // No existing instance - might be static math, need to clear it properly
      }
      
      // Clear any existing MathQuill content (static or editable) to prevent corruption
      span.innerHTML = '';
      // Ensure the dataset is preserved and mark as editable
      span.dataset.latex = originalLatex;
      span.dataset.mqEditable = 'true';
      span.dataset.mqInitialized = 'true';

      // Improved MathQuill configuration to fix left arrow and boundary issues
      const mq = MQ.MathField(span, {
        spaceBehavesLikeTab: false,
        restrictMismatchedBrackets: false,
        sumStartsWithNEquals: true,
        supSubsRequireOperand: true,
        charsThatBreakOutOfSupSub: '+-=<>',
        autoSubscriptNumerals: true,
        autoCommands: 'pi theta sqrt nthroot int sum prod coprod infty infinity',
        autoOperatorNames: 'sin cos tan csc sec cot sinh cosh tanh csch sech coth log ln lim mod lcm gcd nPr nCr',
        
        handlers: {
          edit: () => { 
            const newLatex = mq.latex();
            console.log('Math field edited, new LaTeX:', newLatex);
            span.dataset.latex = newLatex; 
          },

          moveOutOf: (dir, mathField) => {
            console.log('moveOutOf triggered with direction:', dir);
            mathField.blur();
            
            if (dir === MQ.L) {
              setCaretBefore(span);
            } else if (dir === MQ.R) {
              // Ensure there's always a place to go when moving right
              let marker = span.nextSibling;
              if (!marker || marker.nodeType !== Node.TEXT_NODE) {
                // Create a new text node if none exists
                marker = document.createTextNode('');
                span.parentNode.insertBefore(marker, span.nextSibling);
              }
              setCaretAfter(marker);
            }
          },

          deleteOutOf: (dir, mathField) => {
            const latex = mathField.latex().trim();
            
            if (latex === '') {
              mathField.blur();
              const marker = span.nextSibling;
              
              if (dir === MQ.L) {
                setCaretBefore(span);
              }
              
              span.remove();
              if (marker && marker.nodeType === Node.TEXT_NODE && marker.nodeValue === '\u200B') {
                marker.remove();
              }
            }
          },
        }
      });

      // Enhanced key handling to fix left arrow boundary issues
      function onKeyDownInMQ(ev) {
        console.log('Key in MQ:', ev.key, 'Field active:', mq.el().classList.contains('mq-focused'));
        
        if (ev.key === '$') {
          ev.preventDefault();
          span.dataset.latex = mq.latex();
          mq.blur();
          // Ensure there's a place to go after exiting with $
          let afterMarker = span.nextSibling;
          if (!afterMarker || afterMarker.nodeType !== Node.TEXT_NODE) {
            afterMarker = document.createTextNode('');
            span.parentNode.insertBefore(afterMarker, span.nextSibling);
          }
          setCaretAfter(afterMarker);
          return;
        }
        
        // Enhanced left arrow handling - force immediate boundary check
        if (ev.key === 'ArrowLeft') {
          const latex = mq.latex().trim();
          console.log('Left arrow in math, latex:', latex);
          
          // If field is empty, immediately exit
          if (latex === '') {
            ev.preventDefault();
            ev.stopPropagation();
            mq.blur();
            setCaretBefore(span);
            return;
          }
          
          // Check if we're at the beginning using MathQuill's internal state
          setTimeout(() => {
            try {
              // Force check if we should move out
              const mqEl = mq.el();
              const cursor = mqEl.querySelector('.mq-cursor');
              const rootBlock = mqEl.querySelector('.mq-root-block');
              
              if (cursor && rootBlock) {
                // Check if cursor is at the very beginning
                const firstChild = rootBlock.firstChild;
                if (cursor === firstChild || (firstChild && cursor.previousSibling === null)) {
                  console.log('Detected at beginning, forcing exit');
                  mq.blur();
                  setCaretBefore(span);
                  return;
                }
              }
              
              // Fallback: try to use MathQuill's internal cursor API
              if (mq.__controller && mq.__controller.cursor) {
                const controller = mq.__controller;
                if (!controller.cursor[MQ.L] || controller.cursor[MQ.L] === controller.root) {
                  console.log('Using fallback cursor detection');
                  mq.blur();
                  setCaretBefore(span);
                }
              }
            } catch (e) {
              console.log('Error in cursor detection:', e);
            }
          }, 0);
        }
        
        // Enhanced right arrow handling for consistency
        if (ev.key === 'ArrowRight') {
          setTimeout(() => {
            const latex = mq.latex().trim();
            if (latex === '') {
              mq.blur();
              // Ensure there's a place to go
              let marker = span.nextSibling;
              if (!marker || marker.nodeType !== Node.TEXT_NODE) {
                marker = document.createTextNode('');
                span.parentNode.insertBefore(marker, span.nextSibling);
              }
              setCaretAfter(marker);
              return;
            }
            
            const mqEl = mq.el();
            const cursor = mqEl.querySelector('.mq-cursor');
            const rootBlock = mqEl.querySelector('.mq-root-block');
            
            if (cursor && rootBlock && cursor.nextSibling === null) {
              const lastChild = rootBlock.lastChild;
              if (cursor === lastChild || cursor.previousSibling === lastChild) {
                mq.blur();
                // Ensure there's a place to go
                let marker = span.nextSibling;
                if (!marker || marker.nodeType !== Node.TEXT_NODE) {
                  marker = document.createTextNode('');
                  span.parentNode.insertBefore(marker, span.nextSibling);
                }
                setCaretAfter(marker);
              }
            }
          }, 0);
        }
      }

      const mqEl = mq.el();
      mq._keydownHandler = onKeyDownInMQ;
      mqEl.addEventListener('keydown', onKeyDownInMQ);

      // Additional event listener to prevent unwanted text input in boundary zones
      mqEl.addEventListener('input', (ev) => {
        // Ensure we stay in proper math mode
        const latex = mq.latex();
        if (latex !== span.dataset.latex) {
          span.dataset.latex = latex;
        }
      });

      // Restore latex content if it exists in the dataset (from saved content)
      if (span.dataset.latex) {
        console.log('Restoring LaTeX to editable field:', span.dataset.latex);
        mq.latex(span.dataset.latex);
      }

      if (shouldFocus) {
        mq.focus();
      }

      return mq;
    };

    // Add enhanced keyboard handler for math insertion and boundary detection
    editor.addEventListener('keydown', (ev) => {
      // Check if we need to activate a math field first
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
        // Small delay to let the cursor move, then check if we're in a math field
        setTimeout(() => {
          checkAndActivateMathField();
        }, 0);
      }
      
      if (ev.key === 'Backspace') {
        const mathInfo = isCursorAtBeginningOfMath();
        if (mathInfo && mathInfo.atStart) {
          ev.preventDefault();
          const { mathSpan } = mathInfo;
          
          setCaretBefore(mathSpan);
          
          const marker = mathSpan.nextSibling;
          mathSpan.remove();
          if (marker && marker.nodeType === Node.TEXT_NODE && marker.nodeValue === '\u200B') {
            marker.remove();
          }
          return;
        }
      }

      const sel = window.getSelection();
      const anchor = sel && sel.anchorNode;
      if (anchor) {
        let node = anchor.nodeType === Node.TEXT_NODE ? anchor.parentNode : anchor;
        if (node && node.closest && node.closest('.mq-inline')) {
          return;
        }
      }

      // Don't interfere with existing text field navigation for Enter, ArrowUp, ArrowDown
      if (['ArrowUp', 'ArrowDown', 'Enter'].includes(ev.key)) {
        return;
      }

      if (ev.key === '$') {
        ev.preventDefault();
        insertMathAtCaret();
      }
    });

    // Add enhanced click handler for math fields
    editor.addEventListener('click', (ev) => {
      const clicked = ev.target;
      const mqParent = clicked.closest && clicked.closest('.mq-inline');
      if (mqParent && mqParent.dataset.mqEditable !== 'true') {
        console.log('Clicked on math field');
        setTimeout(() => {
          this.initializeMathField(mqParent, true);
        }, 10);
      }
    });

    // Additional selection change listener to catch cursor movements into math fields
    const selectionChangeHandler = () => {
      // Debounce to avoid excessive calls
      clearTimeout(this.mathFieldCheckTimeout);
      this.mathFieldCheckTimeout = setTimeout(() => {
        const sel = window.getSelection();
        if (sel.rangeCount && sel.anchorNode) {
          const node = sel.anchorNode;
          const mathSpan = (node.nodeType === Node.TEXT_NODE ? node.parentNode : node).closest('.mq-inline');
          
          if (mathSpan && !mathSpan.classList.contains('mq-focused') && mathSpan.dataset.mqEditable !== 'true') {
            console.log('Selection moved into unfocused math field, activating...');
            this.initializeMathField(mathSpan, true);
          }
        }
      }, 50);
    };
    
    document.addEventListener('selectionchange', selectionChangeHandler);
    
    // Store reference for cleanup
    this.selectionChangeHandler = selectionChangeHandler;
  }
}
