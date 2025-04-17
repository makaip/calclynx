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

        // Create and add the drag handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        for (let i = 0; i < 6; i++) {
          const dot = document.createElement('span');
          dot.className = 'drag-handle-dot';
          dragHandle.appendChild(dot);
        }
        container.appendChild(dragHandle); // Add handle first

        this.element.appendChild(container);
        const staticMath = document.createElement('div');
        staticMath.className = 'math-field';
        container.appendChild(staticMath); // Add static math after handle
        MQ.StaticMath(staticMath).latex(latex);
      });
    } else {
      this.addMathField(true);
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

  addMathField(isNewField) {
    new MathField(this, isNewField);
  }

  remove() {
    this.element.remove();
    this.board.fileManager.saveState();
  }

  insertMathFieldAfter(referenceContainer) {
    const newField = new MathField(this, true);
    this.element.insertBefore(newField.container, referenceContainer.nextSibling);
    newField.mathField.focus();
  }
}

