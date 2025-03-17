class MathGroup {
    constructor(board, x, y) {
      this.board = board;
      this.element = document.createElement('div');
      this.element.className = 'math-group';
      // Set the position for this group.
      this.element.style.left = `${x}px`;
      this.element.style.top = `${y}px`;
      this.element.tabIndex = -1; // Make focusable.
  
      // Attach a reference to this MathGroup instance on its DOM element.
      this.element.mathGroup = this;
  
      board.canvas.appendChild(this.element);
      this.attachFocusOutHandler();
      this.addMathField();
    }
  
    attachFocusOutHandler() {
      this.element.addEventListener('focusout', () => {
        setTimeout(() => {
          if (!this.element.contains(document.activeElement)) {
            // If there is only one math field container and it’s empty…
            if (this.element.children.length === 1) {
              const container = this.element.children[0];
              if (!container.dataset.latex || container.dataset.latex.trim() === '') {
                this.remove();
              }
            }
          }
        }, 50);
      });
    }
  
    addMathField() {
      new MathField(this);
    }
  
    remove() {
      this.element.remove();
    }
  }
  