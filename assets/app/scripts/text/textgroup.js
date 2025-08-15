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
    const content = (data && data.fields && data.fields.length > 0) ? data.fields[0] : '';
    this.textField = new TextField(this, !data, content);
  }

  remove() {
    this.element.remove();
    // Save state after removal
    this.board.fileManager.saveState();
  }
}
