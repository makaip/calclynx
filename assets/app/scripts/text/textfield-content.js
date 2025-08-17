/**
 * Content management functionality for TextField
 * Handles content serialization, deserialization, and format conversion
 */
class TextFieldContent {
  constructor(textField) {
    this.textField = textField;
  }

  /**
   * Get content in optimized format (object with text and mathFields)
   */
  getOptimizedContent() {
    if (!this.textField.editorElement) return { text: '', mathFields: [] };
    
    const content = { text: '', mathFields: [] };
    
    // Simple recursive walk through all nodes to extract content
    const walkAllNodes = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        content.text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.classList.contains('mq-inline')) {
          // Math field - record position and add placeholder
          const latex = node.dataset.latex || '';
          content.mathFields.push({
            position: content.text.length,
            latex: latex
          });
          content.text += '\uE000'; // Placeholder character
        } else if (node.tagName === 'DIV') {
          // DIV represents a line break
          content.text += '\n';
          // Process children of this DIV
          Array.from(node.childNodes).forEach(walkAllNodes);
        } else if (node.tagName === 'BR') {
          // Explicit line break
          content.text += '\n';
        } else {
          // Other elements, process their children
          Array.from(node.childNodes).forEach(walkAllNodes);
        }
      }
    };
    
    Array.from(this.textField.editorElement.childNodes).forEach(walkAllNodes);
    
    return content;
  }

  /**
   * Set content from optimized format
   */
  setOptimizedContent(content) {
    if (!this.textField.editorElement) return;
    
    // Clear existing content
    this.textField.editorElement.innerHTML = '';
    
    const { text, mathFields } = content;
    
    // Create a map of math field positions for quick lookup
    const mathFieldMap = new Map();
    mathFields.forEach(field => {
      mathFieldMap.set(field.position, field.latex);
    });
    
    // Build content character by character
    let currentContainer = this.textField.editorElement; // Start at root
    let textBuffer = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '\uE000') {
        // Math field placeholder
        // First, add any buffered text
        if (textBuffer) {
          currentContainer.appendChild(document.createTextNode(textBuffer));
          textBuffer = '';
        }
        
        // Create math field
        const mathLatex = mathFieldMap.get(i) || '';
        const span = document.createElement('span');
        span.className = 'mq-inline';
        span.dataset.latex = mathLatex;
        currentContainer.appendChild(span);
        
      } else if (char === '\n') {
        // Line break
        // First, add any buffered text to current container
        if (textBuffer) {
          currentContainer.appendChild(document.createTextNode(textBuffer));
          textBuffer = '';
        }
        
        // Create new line (DIV) and switch to it
        const div = document.createElement('div');
        this.textField.editorElement.appendChild(div);
        currentContainer = div;
        
      } else {
        // Regular character
        textBuffer += char;
      }
    }
    
    // Add any remaining buffered text
    if (textBuffer) {
      currentContainer.appendChild(document.createTextNode(textBuffer));
    }
    
    // Ensure there's always at least one text node if editor is empty
    if (this.textField.editorElement.childNodes.length === 0) {
      this.textField.editorElement.appendChild(document.createTextNode(''));
    }
    
    // Reinitialize MathQuill fields if math support is available
    if (this.textField.mathSupport) {
      setTimeout(() => {
        this.textField.mathSupport.reinitializeMathFields();
      }, 10);
    }
  }
  /**
   * Set content with format validation
   */
  setContent(content) {
    if (this.textField.editorElement) {
      if (content) {
        // Expect modern optimized format only
        if (typeof content === 'object' && content.text !== undefined && content.mathFields !== undefined) {
          this.setOptimizedContent(content);
        } else {
          // Fallback for unknown format
          console.warn('Unexpected content format in setContent. Expected optimized format with {text, mathFields}:', typeof content, content);
          this.textField.editorElement.innerHTML = '';
          this.textField.editorElement.appendChild(document.createTextNode(''));
        }
      } else {
        // Ensure there's always a text node for cursor placement
        this.textField.editorElement.innerHTML = '';
        this.textField.editorElement.appendChild(document.createTextNode(''));
      }
    }
  }
}
