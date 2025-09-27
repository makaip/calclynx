class TextGroup extends ObjectGroup {
  constructor(board, x, y, data = null) {
    super(board, x, y, data, 'text');
    
    let content = '';
    if (data && data.fields && data.fields.length > 0) {
      content = data.fields[0];
    }

    try {
      const proseMirrorAvailable = (window.proseMirrorReady || window.ProseMirror) && typeof TextFieldProseMirror !== 'undefined';
      
      if (proseMirrorAvailable) {
        const normalizedContent = TextFieldCompatibility.normalizeContent(content, '3.0');
        this.textField = new TextFieldProseMirror(this, !data, normalizedContent);
        this.useProseMirror = true;
        
        if (data && TextFieldCompatibility.detectContentFormat(content) !== 'prosemirror-v3') {
          console.log('Auto-upgrading legacy content to ProseMirror v3.0');
        } else {
          console.log('Using ProseMirror TextField v3.0');
        }

      } else {
        if (typeof TextField !== 'undefined') {
          const normalizedContent = TextFieldCompatibility.normalizeContent(content, '2.0');
          this.textField = new TextField(this, !data, normalizedContent);
          this.useProseMirror = false;
          console.log('Using legacy TextField v2.0 (ProseMirror not available)');
        } else {
          throw new Error('No TextField implementation available');
        }
      }
      
    } catch (error) {
      console.error('Failed to create TextField:', error);
      this.textField = null;
    }

    this.setupClickHandler();
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
