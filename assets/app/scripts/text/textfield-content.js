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
        } else if (node.tagName === 'DIV') {
          // Handle line breaks - only add newline if this DIV represents a real line break
          // Check if this DIV is being used for line structure or just content organization
          const hasTextContent = Array.from(node.childNodes).some(child => 
            child.nodeType === Node.TEXT_NODE && child.textContent.trim() !== ''
          );
          const hasMathContent = node.querySelector('.mq-inline');
          
          if (hasTextContent || hasMathContent) {
            // This DIV contains actual content, so it's a line break
            if (content.text.length > 0 && !content.text.endsWith('\n')) {
              content.text += '\n';
              textIndex += 1;
            }
            // Process the content inside the DIV
            Array.from(node.childNodes).forEach(walkNodes);
          }
        } else if (node.tagName === 'BR') {
          // Explicit line break
          content.text += '\n';
          textIndex += 1;
        } else {
          // Regular element, process its children
          Array.from(node.childNodes).forEach(walkNodes);
        }
      }
    };
    
    Array.from(this.textField.editorElement.childNodes).forEach(walkNodes);
    
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
    let currentPos = 0;
    
    // Sort math fields by position to process them in order
    const sortedMathFields = [...mathFields].sort((a, b) => a.position - b.position);
    
    for (const mathField of sortedMathFields) {
      // Add text before this math field
      if (mathField.position > currentPos) {
        const textBefore = text.substring(currentPos, mathField.position);
        if (textBefore) {
          this.addTextWithLineBreaks(textBefore);
        }
      }
      
      // Create math field span
      const span = document.createElement('span');
      span.className = 'mq-inline';
      span.dataset.latex = mathField.latex;
      console.log('Creating math span with LaTeX:', mathField.latex);
      this.textField.editorElement.appendChild(span);
      
      // Skip the placeholder character in text
      currentPos = mathField.position + 1;
    }
    
    // Add remaining text after last math field
    if (currentPos < text.length) {
      const remainingText = text.substring(currentPos);
      if (remainingText) {
        this.addTextWithLineBreaks(remainingText);
      }
    }
    
    // Ensure there's always a text node if editor is empty
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
   * Helper method to add text content with proper line break handling
   */
  addTextWithLineBreaks(text) {
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) {
        // Add a div for line break (contentEditable standard)
        const div = document.createElement('div');
        this.textField.editorElement.appendChild(div);
        
        // Add the text content to the div
        if (lines[i]) {
          div.appendChild(document.createTextNode(lines[i]));
        } else {
          // For empty lines, ensure there's a placeholder
          div.appendChild(document.createTextNode(''));
        }
      } else {
        // First line - add directly as text node
        if (lines[i]) {
          this.textField.editorElement.appendChild(document.createTextNode(lines[i]));
        }
      }
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
