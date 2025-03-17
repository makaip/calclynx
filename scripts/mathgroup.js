class MathGroup {
  // Now accepts an optional "data" parameter.
  constructor(board, x, y, data = null) {
    this.board = board;
    this.element = document.createElement('div');
    this.element.className = 'math-group';
    // Append "px" when there's no saved state.
    const left = data ? data.left : `${x}px`;
    const top = data ? data.top : `${y}px`;
    this.element.style.left = left;
    this.element.style.top = top;
    this.element.tabIndex = -1; // Make focusable.
    this.element.mathGroup = this;
    board.canvas.appendChild(this.element);
    this.attachFocusOutHandler();

    if (data && data.fields && data.fields.length) {
      // Recreate finalized math fields from saved data.
      data.fields.forEach((latex) => {
        const container = document.createElement('div');
        container.className = 'math-field-container';
        container.dataset.latex = latex;
        this.element.appendChild(container);
        const staticMath = document.createElement('div');
        staticMath.className = 'math-field';
        container.appendChild(staticMath);
        MQ.StaticMath(staticMath).latex(latex);
      });
      // Optionally add a new empty math field.
      this.addMathField();
    } else {
      this.addMathField();
    }
  }

  attachFocusOutHandler() {
    this.element.addEventListener('focusout', () => {
      setTimeout(() => {
        if (!this.element.contains(document.activeElement)) {
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
    this.board.saveState();
  }

  insertMathFieldAfter(referenceContainer) {
    // Create a new math field.
    const newField = new MathField(this);
    // Insert the new container right after the reference container.
    this.element.insertBefore(newField.container, referenceContainer.nextSibling);
    // Focus on the new math field.
    newField.mathField.focus();
  }
  
  
}

