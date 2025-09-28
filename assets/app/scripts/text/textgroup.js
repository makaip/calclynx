import { ObjectGroup } from '../core/objectgroup.js';
import { TextFieldCompatibility } from './textfield-compatibility.js';

class TextGroup extends ObjectGroup {
  constructor(board, x, y, data = null) {
    super(board, x, y, data, 'text');
    
    let content = '';
    if (data && data.fields && data.fields.length > 0) {
      content = data.fields[0];
    }

    this.initializeTextField(content, data);
    this.setupClickHandler();
  }
  
  async initializeTextField(content, data) {
    try {
      if (!TextFieldCompatibility.shouldUseProseMirror()) {
        throw new Error('ProseMirror components not fully loaded yet. TextFieldProseMirror class is required.');
      }

      const { TextFieldProseMirror } = await import('./textfield.js');
      const normalizedContent = TextFieldCompatibility.normalizeContent(content, '3.0');
      this.textField = new TextFieldProseMirror(this, !data, normalizedContent);
      this.useProseMirror = true;
      
      if (data && TextFieldCompatibility.detectContentFormat(content) !== 'prosemirror-v3') {
        console.log('Auto-upgrading legacy content to ProseMirror v3.0');
      } else {
        console.log('Using ProseMirror TextField v3.0');
      }
      
    } catch (error) {
      console.error('Failed to create TextField:', error);
      this.textField = null;
    }
  }

  setupClickHandler() {
    this.element.addEventListener('click', (event) => {
      const isFromTextEditor = event.target.closest('.text-editor') || event.target.closest('.text-field-container');
      if (isFromTextEditor) return;
      
      if (this.element.classList.contains('selected')) {
        event.stopPropagation();
        if (this.textField && this.textField.focus) {
          this.textField.focus();
        }
      }
    });
  }
}

export { TextGroup };
