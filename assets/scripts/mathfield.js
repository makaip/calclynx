class MathField {
  constructor(mathGroup, isNewField) {
    this.mathGroup = mathGroup;
    this.createContainer();
    if (isNewField) {
      this.createMathField();
      this.attachEventListeners();
      if (this.mathField && typeof this.mathField.focus === 'function') {
        this.mathField.focus();
      }
    }
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'math-field-container';
    this.container.dataset.latex = '';
    this.container.mathFieldInstance = this; // Add reference from DOM element back to the instance

    const circleIndicator = document.createElement('div');
    circleIndicator.className = 'circle-indicator';
    this.container.appendChild(circleIndicator);

    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement('span');
      dot.className = 'drag-handle-dot';
      dragHandle.appendChild(dot);
    }
    this.container.appendChild(dragHandle);

    this.container.addEventListener('mousedown', (event) => {
      if (!event.target.closest('.drag-handle')) {
        document.querySelectorAll('.math-group').forEach((group) => group.classList.remove('selected'));
      }
      // Use new method and data attribute
      if (window.expressionEquivalence && this.container.dataset.groupKey) {
        window.expressionEquivalence.highlightGroupExpressions(this.container.dataset.groupKey, true);
      }
    });

    this.container.addEventListener('click', (event) => {
      if (event.target.closest('.drag-handle')) {
        event.stopPropagation();
        return;
      }
      const editableFieldWrapper = this.container.querySelector(':scope > .mq-editable-field');
      const isEditing = !!editableFieldWrapper;

      if (isEditing) {
        event.stopPropagation();
      } else {
        event.stopPropagation();
        document.querySelectorAll('.math-group').forEach((group) => group.classList.remove('selected'));
        MathField.edit(this.container);
      }

      // Mark this container as selected-field, clear others
      document.querySelectorAll('.math-field-container.selected-field')
        .forEach(el => el.classList.remove('selected-field'));
      this.container.classList.add('selected-field');
    });

    this.mathGroup.element.appendChild(this.container);
  }

  createMathField() {
    if (this.container.querySelector(':scope > .math-field')) return;

    this.mathFieldElement = document.createElement('div');
    this.mathFieldElement.className = 'math-field';
    const handle = this.container.querySelector(':scope > .drag-handle');
    if (handle) {
      this.container.insertBefore(this.mathFieldElement, handle.nextSibling);
    } else {
      this.container.appendChild(this.mathFieldElement);
    }

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
    if (!this.mathFieldElement) return;
    if (this.mathFieldElement.dataset.listenersAttached === 'true') return;
    this.mathFieldElement.dataset.listenersAttached = 'true';

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
            if (previousContainer && previousContainer.classList.contains('math-field-container')) {
              this.container.remove();
              MathField.edit(previousContainer);
              if (window.versionManager) window.versionManager.saveState();
              else this.mathGroup.board.fileManager.saveState();
            }
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
        this.finalize();

        const groupElement = this.mathGroup.element;
        if (document.body.contains(this.container) && groupElement) {
          if (event.ctrlKey) {
          } else if (this.container === groupElement.lastElementChild) {
            this.mathGroup.addMathField(true);
          } else {
            const nextContainer = this.container.nextElementSibling;
            if (nextContainer && nextContainer.classList.contains('math-field-container')) {
              MathField.edit(nextContainer);
            }
          }
        } else if (!document.body.contains(this.container) && groupElement && groupElement.children.length > 0) {
          const lastContainer = groupElement.lastElementChild;
          if (lastContainer && lastContainer.classList.contains('math-field-container')) {
            MathField.edit(lastContainer);
          }
        }
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
    const handle = this.container.querySelector(':scope > .drag-handle');
    if (handle) {
      this.container.insertBefore(staticMath, handle.nextSibling);
    } else {
      this.container.appendChild(staticMath);
    }
    MQ.StaticMath(staticMath).latex(latex);
    this.mathGroup.board.fileManager.saveState();

    const hasText = latex.includes('\\text{') || latex.includes('\\\\text{');
    if (window.expressionEquivalence) {
      if (!hasText) {
        window.expressionEquivalence.applyIndicatorColors();
        if (this.container.dataset.groupKey) {
          window.expressionEquivalence.highlightGroupExpressions(this.container.dataset.groupKey, false);
        } else {
          window.expressionEquivalence.removeAllHighlights();
        }
      }
    }
  }

  static edit(container) {
    const mathGroupEl = container.closest('.math-group');
    if (mathGroupEl) {
      mathGroupEl.classList.remove('selected');
    }

    const existingLatex = container.dataset.latex || '';
    if (container.querySelector('.mq-editable-field')) return;

    const staticMathElement = container.querySelector('.math-field:not(.mq-editable-field)');
    if (staticMathElement) staticMathElement.remove();

    const mathFieldElement = document.createElement('div');
    mathFieldElement.className = 'math-field';
    const handle = container.querySelector(':scope > .drag-handle');
    if (!handle) {
      console.warn("Handle missing during edit, recreating.");
      const newHandle = document.createElement('div');
      newHandle.className = 'drag-handle';
      for (let i = 0; i < 6; i++) {
        const dot = document.createElement('span');
        dot.className = 'drag-handle-dot';
        newHandle.appendChild(dot);
      }
      container.insertBefore(newHandle, container.firstChild);
    }

    container.insertBefore(mathFieldElement, container.querySelector(':scope > .drag-handle').nextSibling);

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

    // Use new method and data attribute
    if (window.expressionEquivalence && container.dataset.groupKey) {
      window.expressionEquivalence.highlightGroupExpressions(container.dataset.groupKey, true);
    }

    mathFieldElement.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !event.ctrlKey && !mathField.latex().trim()) {
        const previousContainer = container.previousElementSibling;
        if (previousContainer && previousContainer.classList.contains('math-field-container')) {
          event.preventDefault();
          const currentLatex = container.dataset.latex;
          container.remove();
          MathField.edit(previousContainer);
          if (currentLatex && window.versionManager) window.versionManager.saveState();
          else if (currentLatex && container.parentElement.mathGroup) container.parentElement.mathGroup.board.fileManager.saveState();
        } else if (container.parentElement.mathGroup && container.parentElement.children.length === 1) {
          event.preventDefault();
          container.parentElement.mathGroup.remove();
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
        container.innerHTML = ''; // Clear existing content

        // Recreate circle indicator
        const circleIndicator = document.createElement('div');
        circleIndicator.className = 'circle-indicator';
        container.appendChild(circleIndicator);

        // Recreate drag handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        for (let i = 0; i < 6; i++) {
          const dot = document.createElement('span');
          dot.className = 'drag-handle-dot';
          dragHandle.appendChild(dot);
        }
        container.appendChild(dragHandle);

        // Recreate static math
        const staticMath = document.createElement('div');
        staticMath.className = 'math-field';
        container.appendChild(staticMath); // Append after handle
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
        const hasText = latexValue.includes('\\text{') || latexValue.includes('\\\\text{');
        if (!latexValue) {
          container.remove();
          const group = container.parentElement;
          if (group && !group.querySelector('.math-field-container')) {
            group.remove();
          }
        } else {
          container.dataset.latex = latexValue;
          container.innerHTML = ''; // Clear existing content

          // Recreate circle indicator
          const circleIndicator = document.createElement('div');
          circleIndicator.className = 'circle-indicator';
          container.appendChild(circleIndicator);

          // Recreate drag handle
          const dragHandle = document.createElement('div');
          dragHandle.className = 'drag-handle';
          for (let i = 0; i < 6; i++) {
            const dot = document.createElement('span');
            dot.className = 'drag-handle-dot';
            dragHandle.appendChild(dot);
          }
          container.appendChild(dragHandle);

          // Recreate static math
          const staticMath = document.createElement('div');
          staticMath.className = 'math-field';
          container.appendChild(staticMath); // Append after handle
          MQ.StaticMath(staticMath).latex(latexValue);
          const group = container.parentElement;
          if (group && group.mathGroup) {
            group.mathGroup.board.fileManager.saveState();
            // Re-apply colors after blur/finalize and remove highlight
            if (window.expressionEquivalence) {
              if (!hasText) {
                window.expressionEquivalence.applyIndicatorColors();
                if (container.dataset.groupKey) {
                  window.expressionEquivalence.highlightGroupExpressions(container.dataset.groupKey, false);
                } else {
                  window.expressionEquivalence.removeAllHighlights();
                }
              }
            }
          }
        }
      }, 50);
    });
  }
}
