class MathFieldEditor {
  constructor(container, mathGroup) {
    this.container = container;
    this.mathGroup = mathGroup;
    this.mathField = null;
    this.mathFieldElement = null;
  }

  createMathField() {
    if (this.hasMathField()) return;

    this.mathFieldElement = MathFieldUtils.createMathFieldElement();
    MathFieldUtils.insertElementAfterHandle(this.container, this.mathFieldElement);
    this.mathField = MQ.MathField(this.mathFieldElement, this.getMathQuillConfig()); 
  }

  hasMathField() {
    return !!this.container.querySelector(':scope > .math-field');
  }

  getMathQuillConfig() {
    const baseConfig = MathFieldUtils.getBaseMathQuillConfig();
    return {
      ...baseConfig,
      handlers: {
        edit: () => {
          this.container.dataset.latex = this.mathField.latex().trim();
        }
      }
    };
  }

  replaceWithStaticMath(latex) {
    const mathFieldElement = this.container.querySelector('.math-field');
    if (mathFieldElement) mathFieldElement.remove();

    const staticMath = MathFieldUtils.createStaticMathElement();
    MathFieldUtils.insertElementAfterHandle(this.container, staticMath);
    MQ.StaticMath(staticMath).latex(latex);
  }

  getMathField() {
    return this.mathField;
  }

  getMathFieldElement() {
    return this.mathFieldElement;
  }

  // existicng math field editing methods
  static edit(container) {
    const existingLatex = container.dataset.latex || '';
    
    if (!MathFieldUtils.canEdit(container)) return;
    
    MathFieldEditor.clearGroupSelection(container);
    MathFieldEditor.prepareContainerForEdit(container, existingLatex);
    MathFieldEditor.attachEditEventListeners(container);
  }

  static clearGroupSelection(container) {
    const mathGroupEl = container.closest('.math-group');
    if (mathGroupEl) {
      mathGroupEl.classList.remove('selected');
    }
  }

  static prepareContainerForEdit(container, existingLatex) {
    MathFieldEditor.removeStaticMath(container);
    MathFieldEditor.ensureContainerStructure(container);
    
    const mathFieldElement = MathFieldEditor.createEditableMathField(container);
    const mathField = MathFieldEditor.initializeEditableMathField(mathFieldElement, existingLatex, container);
    
    MathFieldUIManager.highlightGroupExpressions(container);
    mathField.focus();
    
    return { mathFieldElement, mathField };
  }

  static removeStaticMath(container) {
    const staticMathElement = container.querySelector('.math-field:not(.mq-editable-field)');
    if (staticMathElement) staticMathElement.remove();
  }

  static ensureContainerStructure(container) {
    const handle = container.querySelector(':scope > .drag-handle');
    if (!handle) {
      console.warn("Handle missing during edit, recreating.");
      MathFieldEditor.recreateContainerStructure(container);
    }
  }

  static recreateContainerStructure(container) {
    const dragHandle = MathFieldUtils.createDragHandle();
    container.insertBefore(dragHandle, container.firstChild);
  }

  static createEditableMathField(container) {
    const mathFieldElement = MathFieldUtils.createMathFieldElement();
    const handle = container.querySelector(':scope > .drag-handle');
    container.insertBefore(mathFieldElement, handle.nextSibling);
    return mathFieldElement;
  }

  static initializeEditableMathField(mathFieldElement, existingLatex, container) {
    const baseConfig = MathFieldUtils.getEditMathQuillConfig();
    const mathField = MQ.MathField(mathFieldElement, {
      ...baseConfig,
      handlers: {
        edit: () => {
          container.dataset.latex = mathField.latex().trim();
        }
      }
    });
    mathField.latex(existingLatex);
    return mathField;
  }

  static attachEditEventListeners(container) {
    const mathFieldElement = container.querySelector('.math-field');
    if (!mathFieldElement) return;

    MathFieldEditor.attachEditKeydownListener(mathFieldElement, container);
    MathFieldEditor.attachEditBlurListener(mathFieldElement, container);
  }

  static attachEditKeydownListener(mathFieldElement, container) {
    mathFieldElement.addEventListener('keydown', (event) => {
      const mathField = MQ(mathFieldElement);
      
      if (event.key === 'Backspace') {
        MathFieldEditor.handleStaticBackspace(event, mathField, container);
      }
      
      if (event.key === 'Enter') {
        MathFieldEditor.handleStaticEnter(event, mathField, container);
      }
    });
  }

  static handleStaticBackspace(event, mathField, container) {
    if (event.ctrlKey) {
      MathFieldEditor.handleStaticCtrlBackspace(event, container);
    } else if (!mathField.latex().trim()) {
      MathFieldEditor.handleStaticEmptyBackspace(event, container);
    }
  }

  static handleStaticCtrlBackspace(event, container) {
    event.preventDefault();
    const group = container.parentElement;
    if (event.shiftKey) {
      group?.remove();
      return;
    }
    container.remove();
    if (group && !group.querySelector('.math-field-container')) {
      group.remove();
    }
  }

  static handleStaticEmptyBackspace(event, container) {
    const previousContainer = container.previousElementSibling;
    const group = container.parentElement;
    const wasLast = group?.querySelectorAll('.math-field-container').length === 1;
    if (previousContainer && previousContainer.classList.contains('math-field-container')) {
      event.preventDefault();
      const currentLatex = container.dataset.latex;
      container.remove();
      MathFieldEditor.edit(previousContainer);
      if (currentLatex && group?.mathGroup) {
        group.mathGroup.board.fileManager.saveState();
      }
    } else if (group?.mathGroup && wasLast) {
      event.preventDefault();
      group.mathGroup.remove();
    }
  }
  
  static handleStaticEnter(event, mathField, container) {
    event.preventDefault();
    const latex = mathField.latex().trim();
    
    const group = container.parentElement;
    if (!latex) {
      const wasLast = (group?.querySelectorAll('.math-field-container')?.length ?? 0) === 1;
      container.remove();
      if (group && wasLast) group.remove();
      return;
    }
    
    container.dataset.latex = latex;
    MathFieldUtils.recreateStaticContainer(container, latex);
    MathFieldEditor.handleStaticEnterNavigation(container);
  }

  static handleStaticEnterNavigation(container) {
    const groupElement = container.parentElement;
    if (groupElement && groupElement.lastElementChild === container && groupElement.mathGroup) {
      groupElement.mathGroup.addMathField(true);
    } else if (groupElement && groupElement.mathGroup) {
      groupElement.mathGroup.insertMathFieldAfter(container);
    }
  }

  static attachEditBlurListener(mathFieldElement, container) {
    mathFieldElement.addEventListener('blur', function () {
      setTimeout(() => {
        const mathField = MQ(mathFieldElement);
        const latexValue = mathField.latex().trim();
        
        if (!latexValue) {
          MathFieldEditor.handleStaticEmptyBlur(container);
        } else {
          MathFieldEditor.handleStaticBlur(container, latexValue);
        }
      }, 50);
    });
  }

  static handleStaticEmptyBlur(container) {
    const group = container.parentElement;
    container.remove();
    if (group && !group.querySelector('.math-field-container')) {
      group.remove();
    }
  }

  static handleStaticBlur(container, latexValue) {
    const hasText = MathFieldUtils.hasTextContent(latexValue);
    
    container.dataset.latex = latexValue;
    MathFieldUtils.recreateStaticContainer(container, latexValue);
    
    const group = container.parentElement;
    if (group && group.mathGroup) {
      group.mathGroup.board.fileManager.saveState();
      MathFieldUIManager.processEquivalenceColors(container, hasText);
    }
  }
}