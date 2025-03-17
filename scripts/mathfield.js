class MathField {
  constructor(mathGroup) {
    this.mathGroup = mathGroup;
    this.createContainer();
    this.createMathField();
    this.attachEventListeners();
    this.mathField.focus();
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'math-field-container';
    this.container.dataset.latex = '';
    this.container.addEventListener('mousedown', (e) => e.stopPropagation());
    this.mathGroup.element.appendChild(this.container);
  }

  createMathField() {
    this.mathFieldElement = document.createElement('div');
    this.mathFieldElement.className = 'math-field';
    this.container.appendChild(this.mathFieldElement);
    this.mathField = MQ.MathField(this.mathFieldElement, {
      spaceBehavesLikeTab: true,
    });
  }

  attachEventListeners() {
    this.mathFieldElement.addEventListener('keydown', (event) => {
      if (
        event.key === 'Backspace' &&
        !event.ctrlKey &&
        !this.mathField.latex().trim()
      ) {
        const groupElement = this.mathGroup.element;
        if (
          groupElement.children.length > 1 &&
          this.container !== groupElement.firstElementChild
        ) {
          event.preventDefault();
          const previousContainer = this.container.previousElementSibling;
          this.container.remove();
          MathField.edit(previousContainer);
          this.mathGroup.board.saveState();
          return;
        }
      }
  
      if (event.key === 'Backspace' && event.ctrlKey) {
        event.preventDefault();
        if (event.shiftKey) {
          this.mathGroup.remove();
        } else {
          this.container.remove();
          if (!this.mathGroup.element.querySelector('.math-field-container')) {
            this.mathGroup.remove();
          }
        }
        this.mathGroup.board.saveState();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        this.finalize();
        if (event.ctrlKey) {
          this.mathFieldElement.blur();
        } else {
          if (this.container === this.mathGroup.element.lastElementChild) {
            this.mathGroup.addMathField();
          }
        }
      }
    });
  }
      
  finalize() {
    const latex = this.mathField.latex().trim();
    if (!latex) {
      this.container.remove();
      if (!this.mathGroup.element.querySelector('.math-field-container')) {
        this.mathGroup.remove();
      }
      this.mathGroup.board.saveState();
      return;
    }
    this.container.dataset.latex = latex;
    this.container.innerHTML = '';
    const staticMath = document.createElement('div');
    staticMath.className = 'math-field';
    this.container.appendChild(staticMath);
    MQ.StaticMath(staticMath).latex(latex);
    // Save the state after finalizing the field.
    this.mathGroup.board.saveState();
  }

  // Static method to enable editing on a static math field.
  static edit(container) {
    const existingLatex = container.dataset.latex || '';
    if (container.querySelector('.mq-editable-field')) return;
    container.innerHTML = '';
  
    const mathFieldElement = document.createElement('div');
    mathFieldElement.className = 'math-field';
    container.appendChild(mathFieldElement);
  
    const mathField = MQ.MathField(mathFieldElement, {
      spaceBehavesLikeTab: true,
    });
    mathField.latex(existingLatex);
    mathField.focus();
  
    mathFieldElement.addEventListener('keydown', function (event) {
      if (
        event.key === 'Backspace' &&
        !event.ctrlKey &&
        !mathField.latex().trim()
      ) {
        if (container.previousElementSibling) {
          event.preventDefault();
          const previousContainer = container.previousElementSibling;
          container.remove();
          MathField.edit(previousContainer);
          // Note: Assuming mathGroup instance is accessible, its board.saveState() should be called.
          return;
        }
      }
  
      if (event.key === 'Backspace' && event.ctrlKey) {
        event.preventDefault();
        if (event.shiftKey) {
          container.parentElement.remove();
        } else {
          container.remove();
          const group = container.parentElement;
          if (group && !group.querySelector('.math-field-container')) {
            group.remove();
          }
        }
        return;
      }
      
      if (event.key === 'Enter') {
        event.preventDefault();
        const latex = mathField.latex().trim();
        if (!latex) {
          container.remove();
          const group = container.parentElement;
          if (group && !group.querySelector('.math-field-container')) {
            group.remove();
          }
          return;
        }
        container.dataset.latex = latex;
        container.innerHTML = '';
        const staticMath = document.createElement('div');
        staticMath.className = 'math-field';
        container.appendChild(staticMath);
        MQ.StaticMath(staticMath).latex(latex);
  
        const groupElement = container.parentElement;
        if (groupElement && groupElement.lastElementChild === container && groupElement.mathGroup) {
          groupElement.mathGroup.addMathField();
        }
      }
    });
  
    mathFieldElement.addEventListener('blur', function () {
      setTimeout(() => {
        if (!mathField.latex().trim()) {
          container.remove();
          const group = container.parentElement;
          if (group && !group.querySelector('.math-field-container')) {
            group.remove();
          }
        }
      }, 50);
    });
  }
}
