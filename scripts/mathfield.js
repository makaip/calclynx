class MathField {
  constructor(mathGroup, isNewField) {
    this.mathGroup = mathGroup;
    this.createContainer();
    this.createMathField();
    this.attachEventListeners();
    if (isNewField) {
      this.mathField.focus();
    }
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'math-field-container';
    this.container.dataset.latex = '';
  
    // Add this listener to clear math group selections when clicking inside the math field.
    this.container.addEventListener('mousedown', (event) => {
      document.querySelectorAll('.math-group').forEach((group) => group.classList.remove('selected'));
    });
  
    // Add a click listener that checks if we're in editing mode.
    this.container.addEventListener('click', (event) => {
      const isEditing = !!this.container.querySelector('.mq-editable-field');
      if (isEditing) {
        event.stopPropagation();
        document.querySelectorAll('.math-group').forEach((group) => group.classList.remove('selected'));
      } else {
        event.stopPropagation();
        document.querySelectorAll('.math-group').forEach((group) => group.classList.remove('selected'));
        MathField.edit(this.container);
      }
    });
    
    this.mathGroup.element.appendChild(this.container);
  }
  

  createMathField() {
    this.mathFieldElement = document.createElement('div');
    this.mathFieldElement.className = 'math-field';
    this.container.appendChild(this.mathFieldElement);
  
    this.mathField = MQ.MathField(this.mathFieldElement, {
      spaceBehavesLikeTab: false,
      sumStartsWithNEquals: true,

      autoCommands: 'pi theta sqrt nthroot int sum prod coprod infty infinity',
      autoOperatorNames: 'sin cos tan csc sec cot sinh cosh tanh csch sech coth log ln lim mod lcm gcd nPr nCr',

    });
  }
  
  attachEventListeners() {
    this.mathFieldElement.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !event.ctrlKey) {
        const latexContent = this.mathField.latex().trim();
        if (latexContent === "" || latexContent === "\\placeholder") {
          const groupElement = this.mathGroup.element;
          if (
            groupElement.children.length > 1 &&
            this.container !== groupElement.firstElementChild
          ) {
            event.preventDefault();
            const previousContainer = this.container.previousElementSibling;
            this.container.remove();
            MathField.edit(previousContainer);
            this.mathGroup.board.fileManager.saveState();
            return;
          }
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
        this.mathGroup.board.fileManager.saveState();
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        
        if (event.ctrlKey) {
          this.mathFieldElement.blur();
        } else {
          if (this.container === this.mathGroup.element.lastElementChild) {
            this.mathGroup.addMathField(true);
          } else {
            this.mathGroup.insertMathFieldAfter(this.container);
          }
        }

        this.finalize();
      }
      
    }, true);
  }
      
  finalize() {
    const latex = this.mathField.latex().trim();
    if (!latex) {
      this.container.remove();
      if (!this.mathGroup.element.querySelector('.math-field-container')) {
        this.mathGroup.remove();
      }
      this.mathGroup.board.fileManager.saveState();
      return;
    }
    this.container.dataset.latex = latex;
    this.container.innerHTML = '';
    const staticMath = document.createElement('div');
    staticMath.className = 'math-field';
    this.container.appendChild(staticMath);
    MQ.StaticMath(staticMath).latex(latex);
    // Save the state after finalizing the field.
    this.mathGroup.board.fileManager.saveState();
  }

  // Static method to enable editing on a static math field.
  static edit(container) {
    // Deselect the parent math group.
    const mathGroup = container.closest('.math-group');
    if (mathGroup) {
      mathGroup.classList.remove('selected');
    }
    
    const existingLatex = container.dataset.latex || '';
    if (container.querySelector('.mq-editable-field')) return;
    container.innerHTML = '';
  
    const mathFieldElement = document.createElement('div');
    mathFieldElement.className = 'math-field';
    container.appendChild(mathFieldElement);
  
    const mathField = MQ.MathField(mathFieldElement, {
      spaceBehavesLikeTab: false,
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
          groupElement.mathGroup.addMathField(true);
        } else if (groupElement && groupElement.mathGroup) {
          groupElement.mathGroup.insertMathFieldAfter(container);
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
