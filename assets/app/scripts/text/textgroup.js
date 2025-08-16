class TextGroup {
  constructor(board, x, y, data = null) {
    this.board = board;
    this.element = document.createElement('div');
    this.element.className = 'text-group';
    
    // Set position
    const left = data ? data.left : `${x}px`;
    const top = data ? data.top : `${y}px`;
    this.element.style.left = left;
    this.element.style.top = top;
    this.element.tabIndex = -1; // Make focusable
    this.element.textGroup = this; // Link DOM element back to instance
    
    board.canvas.appendChild(this.element);
    
    // Create single text field
    let content = '';
    if (data && data.fields && data.fields.length > 0) {
      content = data.fields[0];
      // Handle different content formats - ensure content is in expected format
      if (typeof content !== 'string' && typeof content !== 'object') {
        console.warn('Unexpected content format in TextGroup:', content);
        content = '';
      }
    }
    this.textField = new TextField(this, !data, content);
  }

  remove() {
    this.element.remove();
    // Save state after removal
    this.board.fileManager.saveState();
  }
}
