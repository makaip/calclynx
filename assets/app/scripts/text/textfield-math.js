/**
 * MathQuill integration for TextField
 * Handles all math-related functionality including initialization, event handling, and boundary detection
 */
class TextFieldMath {
  constructor(textField) {
    this.textField = textField;
    this.mathSupportInitialized = false;
    this.initializeMathField = null; // Will be set during initialization
  }

  /**
   * Initialize MathQuill support for the text field
   */
  initializeMathSupport() {
    if (!this.textField.editorElement || this.mathSupportInitialized) return;
    this.mathSupportInitialized = true;

    const MQ = window.MathQuill ? window.MathQuill.getInterface(2) : null;
    if (!MQ) return;

    const editor = this.textField.editorElement;

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

    // Add math field initialization with enhanced boundary detection
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
              this.textField.utils.setCaretBefore(span);
            } else if (dir === MQ.R) {
              // Ensure there's always a place to go when moving right
              let marker = span.nextSibling;
              if (!marker || marker.nodeType !== Node.TEXT_NODE) {
                // Create a new text node if none exists
                marker = document.createTextNode('');
                span.parentNode.insertBefore(marker, span.nextSibling);
              }
              this.textField.utils.setCaretAfter(marker);
            }
          },

          deleteOutOf: (dir, mathField) => {
            const latex = mathField.latex().trim();
            
            if (latex === '') {
              mathField.blur();
              const marker = span.nextSibling;
              
              if (dir === MQ.L) {
                this.textField.utils.setCaretBefore(span);
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
          this.textField.utils.setCaretAfter(afterMarker);
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
            this.textField.utils.setCaretBefore(span);
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
                  this.textField.utils.setCaretBefore(span);
                  return;
                }
              }
              
              // Fallback: try to use MathQuill's internal cursor API
              if (mq.__controller && mq.__controller.cursor) {
                const controller = mq.__controller;
                if (!controller.cursor[MQ.L] || controller.cursor[MQ.L] === controller.root) {
                  console.log('Using fallback cursor detection');
                  mq.blur();
                  this.textField.utils.setCaretBefore(span);
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
              this.textField.utils.setCaretAfter(marker);
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
                this.textField.utils.setCaretAfter(marker);
              }
            }
          }, 0);
        }
      }

      const mqEl = mq.el();
      mq._keydownHandler = onKeyDownInMQ.bind(this);
      mqEl.addEventListener('keydown', mq._keydownHandler);

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

    // Helper function to detect and fix actual line merge issues with math fields
    const ensureMathFieldFlow = () => {
      // This function only fixes actual problems from line merging, not normal editing
      
      const mathFields = this.textField.editorElement.querySelectorAll('.mq-inline');
      if (mathFields.length === 0) return;
      
      let hasActualProblem = false;
      
      // Only check for very specific problematic patterns that indicate line merge issues
      mathFields.forEach(field => {
        const parent = field.parentNode;
        
        // Check for the specific problem: math field stuck in wrong position after line merge
        // This happens when there are multiple consecutive text nodes around a math field
        // which indicates incomplete DOM merging
        const nextSibling = field.nextSibling;
        const prevSibling = field.previousSibling;
        
        // Problem pattern: text node -> math field -> empty/whitespace text node -> text node
        // This suggests text was merged but the math field didn't flow correctly
        if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE && 
            nextSibling.textContent === '' && 
            nextSibling.nextSibling && nextSibling.nextSibling.nodeType === Node.TEXT_NODE) {
          hasActualProblem = true;
        }
        
        // Another problem pattern: math field isolated with only whitespace around it
        // after what should have been a line merge
        if (prevSibling && prevSibling.nodeType === Node.TEXT_NODE && 
            prevSibling.textContent.trim() === '' &&
            nextSibling && nextSibling.nodeType === Node.TEXT_NODE &&
            nextSibling.textContent.trim() === '') {
          hasActualProblem = true;
        }
      });
      
      // Only intervene if there's an actual problem, not for normal DIV-contained math fields
      if (hasActualProblem) {
        console.log('Detected actual math field flow problem, fixing...');
        
        // Save cursor position
        let cursorInfo = null;
        const sel = window.getSelection();
        if (sel.rangeCount) {
          const range = sel.getRangeAt(0);
          cursorInfo = {
            textOffset: this.textField.utils.getTextOffsetFromDOMRange(range),
            container: range.startContainer,
            offset: range.startOffset
          };
        }
        
        // Get current content and reconstruct it properly
        const currentContent = this.textField.content.getOptimizedContent();
        
        // Don't normalize newlines unless they're clearly from a problematic merge
        // Only clean up excessive whitespace but preserve intentional line breaks
        let cleanedText = currentContent.text;
        
        // Only normalize if we detect merge artifacts (multiple spaces, weird characters)
        if (cleanedText.includes('\uE000\uE000') || cleanedText.includes('  ')) {
          cleanedText = cleanedText.replace(/\s+/g, ' ');
        }
        
        const cleanedContent = {
          text: cleanedText,
          mathFields: currentContent.mathFields.map(field => ({
            ...field,
            position: Math.min(field.position, cleanedText.length)
          }))
        };
        
        this.textField.content.setOptimizedContent(cleanedContent);
        
        // Restore cursor position
        if (cursorInfo) {
          setTimeout(() => {
            this.textField.utils.restoreCursorPosition(cursorInfo, cleanedContent);
          }, 10);
        }
      }
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
        // First check if we're deleting an empty math field
        const mathInfo = isCursorAtBeginningOfMath();
        if (mathInfo && mathInfo.atStart) {
          ev.preventDefault();
          const { mathSpan } = mathInfo;
          
          this.textField.utils.setCaretBefore(mathSpan);
          
          const marker = mathSpan.nextSibling;
          mathSpan.remove();
          if (marker && marker.nodeType === Node.TEXT_NODE && marker.nodeValue === '\u200B') {
            marker.remove();
          }
          return;
        }
        
        // Only check for flow issues if this backspace might merge lines with math fields
        const sel = window.getSelection();
        if (sel.rangeCount) {
          const range = sel.getRangeAt(0);
          const node = range.startContainer;
          const offset = range.startOffset;
          
          // Check if cursor is at the beginning of a line (potential line merge scenario)
          const atLineStart = (node.nodeType === Node.TEXT_NODE && offset === 0) ||
                             (node.nodeType === Node.ELEMENT_NODE && offset === 0);
          
          if (atLineStart) {
            // Check if there are math fields that might be affected by a line merge
            const hasMathFields = this.textField.editorElement.querySelectorAll('.mq-inline').length > 0;
            
            if (hasMathFields) {
              // Only then check for flow issues after the operation
              setTimeout(() => {
                ensureMathFieldFlow();
              }, 50); // Slightly longer delay to let DOM settle
            }
          }
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

    // Set up the mutation observer for math field flow issues
    this.textField.utils.setupMutationObserver(() => ensureMathFieldFlow());

    // Additional selection change listener to catch cursor movements into math fields
    const selectionChangeHandler = () => {
      // Debounce to avoid excessive calls
      clearTimeout(this.textField.mathFieldCheckTimeout);
      this.textField.mathFieldCheckTimeout = setTimeout(() => {
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
    this.textField.selectionChangeHandler = selectionChangeHandler;
  }

  /**
   * Reinitialize MathQuill fields after content is restored
   */
  reinitializeMathFields() {
    if (!this.mathSupportInitialized || !window.MathQuill || !this.initializeMathField) return;
    
    const MQ = window.MathQuill.getInterface(2);
    if (!MQ) return;
    
    const mathSpans = this.textField.editorElement.querySelectorAll('.mq-inline');
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

  /**
   * Clean up math-related event handlers and timeouts
   */
  cleanup() {
    // Clean up math field check timeout
    if (this.textField.mathFieldCheckTimeout) {
      clearTimeout(this.textField.mathFieldCheckTimeout);
    }
    
    // Clean up selection change handler
    if (this.textField.selectionChangeHandler) {
      document.removeEventListener('selectionchange', this.textField.selectionChangeHandler);
    }
  }
}
