/**
 * Utility functions for TextField
 * Handles cursor positioning, DOM manipulation, and selection management
 */
class TextFieldUtils {
  constructor(textField) {
    this.textField = textField;
  }

  /**
   * Get text offset from DOM range
   */
  getTextOffsetFromDOMRange(range) {
    let offset = 0;
    const walker = document.createTreeWalker(
      this.textField.editorElement,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (node === range.startContainer) {
        return offset + range.startOffset;
      }
      offset += node.textContent.length;
    }
    
    return offset;
  }
  
  /**
   * Restore cursor position from saved info
   */
  restoreCursorPosition(cursorInfo, content = null) {
    try {
      // Try to restore to the same DOM node first if it still exists and is valid
      if (cursorInfo.container && cursorInfo.container.parentNode && 
          this.textField.editorElement.contains(cursorInfo.container) &&
          cursorInfo.container.nodeType === Node.TEXT_NODE) {
        
        const maxOffset = cursorInfo.container.textContent.length;
        if (cursorInfo.offset <= maxOffset) {
          const range = document.createRange();
          const sel = window.getSelection();
          
          range.setStart(cursorInfo.container, cursorInfo.offset);
          range.collapse(true);
          
          sel.removeAllRanges();
          sel.addRange(range);
          return;
        }
      }
    } catch (e) {
      // Fall back to text offset approach
    }
    
    // Fallback: use text offset
    if (cursorInfo.textOffset !== undefined) {
      this.setCursorAtTextOffset(cursorInfo.textOffset);
    }
  }
  
  /**
   * Set cursor at specific text offset
   */
  setCursorAtTextOffset(textOffset) {
    const walker = document.createTreeWalker(
      this.textField.editorElement,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let currentOffset = 0;
    let node;
    
    while (node = walker.nextNode()) {
      const nodeLength = node.textContent.length;
      if (currentOffset + nodeLength >= textOffset) {
        const range = document.createRange();
        const sel = window.getSelection();
        const offsetInNode = Math.max(0, Math.min(textOffset - currentOffset, nodeLength));
        
        range.setStart(node, offsetInNode);
        range.collapse(true);
        
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      currentOffset += nodeLength;
    }
    
    // If we couldn't find the exact position, place cursor at the end
    const lastTextNode = this.textField.editorElement.lastChild;
    if (lastTextNode && lastTextNode.nodeType === Node.TEXT_NODE) {
      const range = document.createRange();
      const sel = window.getSelection();
      
      range.setStart(lastTextNode, lastTextNode.textContent.length);
      range.collapse(true);
      
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  /**
   * Set caret after a given node
   */
  setCaretAfter(node) {
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
    this.textField.editorElement.focus();
  }

  /**
   * Set caret before a given node
   */
  setCaretBefore(node) {
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
    this.textField.editorElement.focus();
  }

  /**
   * Setup mutation observer for DOM changes
   */
  setupMutationObserver(onMutationCallback) {
    if (this.textField.mutationObserver) {
      return; // Already set up
    }
    
    this.textField.mutationObserver = new MutationObserver((mutations) => {
      let needsCheck = false;
      
      mutations.forEach(mutation => {
        // Only check for specific changes that indicate line merging problems
        if (mutation.type === 'childList') {
          // Only check if DIV elements were removed (indicating line merges)
          // and there are math fields present
          if (mutation.removedNodes.length > 0) {
            for (const removedNode of mutation.removedNodes) {
              if (removedNode.nodeType === Node.ELEMENT_NODE && removedNode.tagName === 'DIV') {
                // A DIV was removed - this might be a line merge
                const mathFields = this.textField.editorElement.querySelectorAll('.mq-inline');
                if (mathFields.length > 0) {
                  needsCheck = true;
                  break;
                }
              }
            }
          }
        }
      });
      
      if (needsCheck && onMutationCallback) {
        // Only check after a brief delay to let the DOM settle
        clearTimeout(this.textField.mutationCheckTimeout);
        this.textField.mutationCheckTimeout = setTimeout(() => {
          onMutationCallback();
        }, 200); // Longer delay to avoid interfering with normal editing
      }
    });
    
    this.textField.mutationObserver.observe(this.textField.editorElement, {
      childList: true,
      subtree: false // Only watch direct children, not all descendants
    });
  }

  /**
   * Clean up all utility-related timeouts and observers
   */
  cleanup() {
    // Clean up mutation observer
    if (this.textField.mutationObserver) {
      this.textField.mutationObserver.disconnect();
      this.textField.mutationObserver = null;
    }
    
    // Clean up mutation check timeout
    if (this.textField.mutationCheckTimeout) {
      clearTimeout(this.textField.mutationCheckTimeout);
    }
  }
}
