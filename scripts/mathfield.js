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

    // Create the drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement('span');
      dot.className = 'drag-handle-dot';
      dragHandle.appendChild(dot);
    }
    this.container.appendChild(dragHandle); // Add handle first

    // --- Drag and Drop Logic ---
    let draggedElement = null;
    let placeholder = null;
    let startY = 0;
    let offsetY = 0; // Offset within the dragged element

    const handleDragStart = (e) => {
        if (e.button !== 0 || !e.target.classList.contains('drag-handle') && !e.target.closest('.drag-handle')) return;
        
        e.preventDefault();
        e.stopPropagation();

        draggedElement = this.container;
        startY = e.clientY;
        offsetY = e.clientY - draggedElement.getBoundingClientRect().top;

        // Create placeholder
        placeholder = document.createElement('div');
        placeholder.className = 'drop-placeholder';
        placeholder.style.height = `${draggedElement.offsetHeight}px`;

        draggedElement.classList.add('dragging-field');
        draggedElement.style.position = 'absolute';
        draggedElement.style.width = `${draggedElement.offsetWidth}px`;
        draggedElement.style.pointerEvents = 'none';
        draggedElement.parentElement.insertBefore(placeholder, draggedElement);

        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd, { once: true });

        handleDragMove(e);
    };

    const handleDragMove = (e) => {
        if (!draggedElement) return;

        const currentY = e.clientY;
        draggedElement.style.top = `${currentY - offsetY}px`;

        const parent = placeholder.parentElement;
        const siblings = Array.from(parent.children).filter(child =>
            child !== draggedElement && child !== placeholder && child.classList.contains('math-field-container')
        );

        let nextSibling = null;
        for (const sibling of siblings) {
            const rect = sibling.getBoundingClientRect();
            if (currentY > rect.top + rect.height / 2) {
                nextSibling = sibling.nextElementSibling;
            } else {
                nextSibling = sibling;
                break;
            }
        }

        parent.insertBefore(placeholder, nextSibling);
    };

    const handleDragEnd = () => {
        if (!draggedElement || !placeholder) return;

        placeholder.parentElement.insertBefore(draggedElement, placeholder);

        draggedElement.classList.remove('dragging-field');
        draggedElement.style.position = '';
        draggedElement.style.width = '';
        draggedElement.style.top = '';
        draggedElement.style.pointerEvents = '';

        placeholder.remove();

        draggedElement = null;
        placeholder = null;

        document.removeEventListener('mousemove', handleDragMove);

        this.mathGroup.board.fileManager.saveState();
        if (window.versionManager) {
            window.versionManager.saveState();
        }
    };

    dragHandle.addEventListener('mousedown', handleDragStart);
    // --- End Drag and Drop Logic ---

    this.container.addEventListener('mousedown', (event) => {
      if (!event.target.classList.contains('drag-handle') && !event.target.closest('.drag-handle')) {
          document.querySelectorAll('.math-group').forEach((group) => group.classList.remove('selected'));
      }
    });
  
    this.container.addEventListener('click', (event) => {
      if (event.target.classList.contains('drag-handle') || event.target.closest('.drag-handle')) {
          return;
      }
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
    this.container.appendChild(this.mathFieldElement); // Add math field after handle
  
    this.mathField = MQ.MathField(this.mathFieldElement, {
      spaceBehavesLikeTab: false,
      sumStartsWithNEquals: true,

      autoCommands: 'pi theta sqrt nthroot int sum prod coprod infty infinity',
      autoOperatorNames: 'sin cos tan csc sec cot sinh cosh tanh csch sech coth log ln lim mod lcm gcd nPr nCr',
      handlers: {
        edit: () => {
          this.container.dataset.latex = this.mathField.latex().trim();
        }
      }
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

    this.mathFieldElement.addEventListener('blur', () => {
      setTimeout(() => {
        this.finalize();
      }, 50);
    });
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
    const mathFieldElement = this.container.querySelector('.math-field');
    if (mathFieldElement) mathFieldElement.remove();

    const staticMath = document.createElement('div');
    staticMath.className = 'math-field';
    if (this.container.firstChild.classList.contains('drag-handle')) {
        this.container.insertBefore(staticMath, this.container.firstChild.nextSibling);
    } else {
        this.container.appendChild(staticMath);
    }
    MQ.StaticMath(staticMath).latex(latex);
    this.mathGroup.board.fileManager.saveState();
  }

  static edit(container) {
    const mathGroup = container.closest('.math-group');
    if (mathGroup) {
      mathGroup.classList.remove('selected');
    }
    
    const existingLatex = container.dataset.latex || '';
    if (container.querySelector('.mq-editable-field')) return;
    
    const staticMathElement = container.querySelector('.math-field:not(.mq-editable-field)');
    if (staticMathElement) staticMathElement.remove();
  
    const mathFieldElement = document.createElement('div');
    mathFieldElement.className = 'math-field';
    if (container.firstChild && container.firstChild.classList.contains('drag-handle')) {
        container.insertBefore(mathFieldElement, container.firstChild.nextSibling);
    } else {
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        for (let i = 0; i < 6; i++) {
          const dot = document.createElement('span');
          dot.className = 'drag-handle-dot';
          dragHandle.appendChild(dot);
        }
        container.insertBefore(dragHandle, container.firstChild);
        container.appendChild(mathFieldElement);
    }
  
    const mathField = MQ.MathField(mathFieldElement, {
      spaceBehavesLikeTab: false,
      handlers: {
        edit: () => {
          container.dataset.latex = mathField.latex().trim();
        }
      }
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

        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        for (let i = 0; i < 6; i++) {
          const dot = document.createElement('span');
          dot.className = 'drag-handle-dot';
          dragHandle.appendChild(dot);
        }
        container.appendChild(dragHandle);

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
        const latexValue = mathField.latex().trim();
        if (!latexValue) {
          container.remove();
          const group = container.parentElement;
          if (group && !group.querySelector('.math-field-container')) {
            group.remove();
          }
        } else {
          container.dataset.latex = latexValue;
          container.innerHTML = '';

          const dragHandle = document.createElement('div');
          dragHandle.className = 'drag-handle';
          for (let i = 0; i < 6; i++) {
            const dot = document.createElement('span');
            dot.className = 'drag-handle-dot';
            dragHandle.appendChild(dot);
          }
          container.appendChild(dragHandle);

          const staticMath = document.createElement('div');
          staticMath.className = 'math-field';
          container.appendChild(staticMath);
          MQ.StaticMath(staticMath).latex(latexValue);
          const group = container.parentElement;
          if (group && group.mathGroup) {
            group.mathGroup.board.fileManager.saveState();
          }
        }
      }, 50);
    });
  }
}
