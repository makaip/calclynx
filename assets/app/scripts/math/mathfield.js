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
    this.initializeContainerElement();
    this.createCircleIndicator();
    this.createDragHandle();
    this.attachContainerEventListeners();
    this.appendToMathGroup();
  }

  initializeContainerElement() {
    this.container = document.createElement('div');
    this.container.className = 'math-field-container';
    this.container.dataset.latex = '';
    this.container.mathFieldInstance = this;
  }

  createCircleIndicator() {
    const circleIndicator = MathFieldUtils.createCircleIndicator();
    this.container.appendChild(circleIndicator);
  }

  createDragHandle() {
    const dragHandle = MathFieldUtils.createDragHandle();
    this.container.appendChild(dragHandle);
  }

  attachContainerEventListeners() {
    this.container.addEventListener('mousedown', (event) => this.handleContainerMouseDown(event));
    this.container.addEventListener('click', (event) => this.handleContainerClick(event));
  }

  handleContainerMouseDown(event) {
    if (!MathFieldUtils.isDragHandleClicked(event)) {
      MathFieldUtils.clearMathGroupSelections();
    }
    MathFieldUtils.highlightGroupExpressions(this.container);
  }

  handleContainerClick(event) {
    if (MathFieldUtils.isDragHandleClicked(event)) {
      event.stopPropagation();
      return;
    }

    event.stopPropagation();
    
    if (!MathFieldUtils.isCurrentlyEditing(this.container)) {
      MathFieldUtils.clearMathGroupSelections();
      MathField.edit(this.container);
    }

    MathFieldUtils.markContainerAsSelected(this.container);
  }

  isDragHandleClicked(event) {
    return MathFieldUtils.isDragHandleClicked(event);
  }

  isCurrentlyEditing() {
    return MathFieldUtils.isCurrentlyEditing(this.container);
  }

  clearMathGroupSelections() {
    MathFieldUtils.clearMathGroupSelections();
  }

  highlightGroupExpressions() {
    MathFieldUtils.highlightGroupExpressions(this.container);
  }

  markContainerAsSelected() {
    MathFieldUtils.markContainerAsSelected(this.container);
  }

  appendToMathGroup() {
    MathFieldUtils.validateMathGroupElement(this.mathGroup);
    this.mathGroup.element.appendChild(this.container);
  }

  createMathField() {
    if (this.hasMathField()) return;

    this.createMathFieldElement();
    this.initializeMathQuillField();
  }

  hasMathField() {
    return !!this.container.querySelector(':scope > .math-field');
  }

  createMathFieldElement() {
    this.mathFieldElement = MathFieldUtils.createMathFieldElement();
    MathFieldUtils.insertElementAfterHandle(this.container, this.mathFieldElement);
  }

  insertMathFieldElement() {
    MathFieldUtils.insertElementAfterHandle(this.container, this.mathFieldElement);
  }

  initializeMathQuillField() {
    this.mathField = MQ.MathField(this.mathFieldElement, this.getMathQuillConfig());
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

  attachEventListeners() {
    if (!this.mathFieldElement) return;
    if (this.mathFieldElement.dataset.listenersAttached === 'true') return;
    this.mathFieldElement.dataset.listenersAttached = 'true';

    this.mathFieldElement.addEventListener('keydown', (event) => this.handleKeyDown(event), true);
    this.mathFieldElement.addEventListener('blur', () => this.handleBlur());
  }

  handleKeyDown(event) {
    switch (event.key) {
      case 'Backspace':
        this.handleBackspace(event);
        break;
      case 'Enter':
        this.handleEnter(event);
        break;
    }
  }

  handleBackspace(event) {
    if (event.ctrlKey) {
      this.handleCtrlBackspace(event);
    } else {
      this.handleRegularBackspace(event);
    }
  }

  handleRegularBackspace(event) {
    const latexContent = this.mathField.latex().trim();
    if (!MathFieldUtils.isEmpty(latexContent)) return;

    const groupElement = this.mathGroup.element;
    if (MathFieldUtils.canNavigateToPrevious(this.container, groupElement)) {
      event.preventDefault();
      this.navigateToPreviousField();
    }
  }

  handleCtrlBackspace(event) {
    event.preventDefault();
    if (event.shiftKey) {
      this.mathGroup.remove();
    } else {
      this.removeCurrentField();
    }
    this.mathGroup.board.fileManager.saveState();
  }

  handleEnter(event) {
    event.preventDefault();
    this.finalize();

    const groupElement = this.mathGroup.element;
    if (document.body.contains(this.container) && groupElement) {
      this.handleEnterNavigation(event, groupElement);
    } else if (!document.body.contains(this.container) && groupElement && groupElement.children.length > 0) {
      this.editLastField(groupElement);
    }
  }

  handleEnterNavigation(event, groupElement) {
    if (event.ctrlKey) {
      // Ctrl+Enter behavior can be added here
    } else if (this.container === groupElement.lastElementChild) {
      this.mathGroup.addMathField(true);
    } else {
      this.editNextField();
    }
  }

  handleBlur() {
    setTimeout(() => {
      this.finalize();
    }, 50);
  }

  isEmpty(latexContent) {
    return MathFieldUtils.isEmpty(latexContent);
  }

  canNavigateToPrevious(groupElement) {
    return MathFieldUtils.canNavigateToPrevious(this.container, groupElement);
  }

  navigateToPreviousField() {
    const previousContainer = this.container.previousElementSibling;
    if (previousContainer && previousContainer.classList.contains('math-field-container')) {
      this.container.remove();
      MathField.edit(previousContainer);
      this.mathGroup.board.fileManager.saveState();
    }
  }

  removeCurrentField() {
    this.container.remove();
    if (!this.mathGroup.element.querySelector('.math-field-container')) {
      this.mathGroup.remove();
    }
  }

  editNextField() {
    const nextContainer = this.container.nextElementSibling;
    if (nextContainer && nextContainer.classList.contains('math-field-container')) {
      MathField.edit(nextContainer);
    }
  }

  editLastField(groupElement) {
    const lastContainer = groupElement.lastElementChild;
    if (lastContainer && lastContainer.classList.contains('math-field-container')) {
      MathField.edit(lastContainer);
    }
  }

  finalize() {
    const latex = this.mathField.latex().trim();
    if (!latex) {
      this.handleEmptyField();
      return;
    }
    
    this.updateLatexData(latex);
    this.replaceWithStaticMath(latex);
    this.mathGroup.board.fileManager.saveState();
    this.handleEquivalenceProcessing(latex);
  }

  handleEmptyField() {
    this.container.remove();
    if (!this.mathGroup.element.querySelector('.math-field-container')) {
      this.mathGroup.remove();
    }
    this.mathGroup.board.fileManager.saveState();
  }

  updateLatexData(latex) {
    this.container.dataset.latex = latex;
  }

  replaceWithStaticMath(latex) {
    const mathFieldElement = this.container.querySelector('.math-field');
    if (mathFieldElement) mathFieldElement.remove();

    const staticMath = MathFieldUtils.createStaticMathElement();
    MathFieldUtils.insertElementAfterHandle(this.container, staticMath);
    MQ.StaticMath(staticMath).latex(latex);
  }

  createStaticMathElement() {
    return MathFieldUtils.createStaticMathElement();
  }

  insertStaticMathElement(staticMath) {
    MathFieldUtils.insertElementAfterHandle(this.container, staticMath);
  }

  handleEquivalenceProcessing(latex) {
    const hasText = MathFieldUtils.hasTextContent(latex);
    MathFieldUtils.processEquivalenceColors(this.container, hasText);
  }

  hasTextContent(latex) {
    return MathFieldUtils.hasTextContent(latex);
  }

  static edit(container) {
    const existingLatex = container.dataset.latex || '';
    
    if (!MathField.canEdit(container)) return;
    
    MathField.clearGroupSelection(container);
    MathField.prepareContainerForEdit(container, existingLatex);
    MathField.attachEditEventListeners(container);
  }

  static canEdit(container) {
    return MathFieldUtils.canEdit(container);
  }

  static clearGroupSelection(container) {
    const mathGroupEl = container.closest('.math-group');
    if (mathGroupEl) {
      mathGroupEl.classList.remove('selected');
    }
  }

  static prepareContainerForEdit(container, existingLatex) {
    MathField.removeStaticMath(container);
    MathField.ensureContainerStructure(container);
    
    const mathFieldElement = MathField.createEditableMathField(container);
    const mathField = MathField.initializeEditableMathField(mathFieldElement, existingLatex, container);
    
    MathField.highlightExpressions(container);
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
      MathField.recreateContainerStructure(container);
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

  static highlightExpressions(container) {
    MathFieldUtils.highlightGroupExpressions(container);
  }

  static attachEditEventListeners(container) {
    const mathFieldElement = container.querySelector('.math-field');
    if (!mathFieldElement) return;

    MathField.attachEditKeydownListener(mathFieldElement, container);
    MathField.attachEditBlurListener(mathFieldElement, container);
  }

  static attachEditKeydownListener(mathFieldElement, container) {
    mathFieldElement.addEventListener('keydown', (event) => {
      const mathField = MQ(mathFieldElement);
      
      if (event.key === 'Backspace') {
        MathField.handleStaticBackspace(event, mathField, container);
      }
      
      if (event.key === 'Enter') {
        MathField.handleStaticEnter(event, mathField, container);
      }
    });
  }

  static handleStaticBackspace(event, mathField, container) {
    if (event.ctrlKey) {
      MathField.handleStaticCtrlBackspace(event, container);
    } else if (!mathField.latex().trim()) {
      MathField.handleStaticEmptyBackspace(event, container);
    }
  }

  static handleStaticCtrlBackspace(event, container) {
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

  static handleStaticEmptyBackspace(event, container) {
    const previousContainer = container.previousElementSibling;
    if (previousContainer && previousContainer.classList.contains('math-field-container')) {
      event.preventDefault();
      const currentLatex = container.dataset.latex;
      container.remove();
      MathField.edit(previousContainer);
      if (currentLatex && container.parentElement.mathGroup) {
        container.parentElement.mathGroup.board.fileManager.saveState();
      }
    } else if (container.parentElement.mathGroup && container.parentElement.children.length === 1) {
      event.preventDefault();
      container.parentElement.mathGroup.remove();
    }
  }

  static handleStaticEnter(event, mathField, container) {
    event.preventDefault();
    const latex = mathField.latex().trim();
    
    if (!latex) {
      MathField.handleStaticEmptyEnter(container);
      return;
    }
    
    MathField.finalizeStaticEdit(container, latex);
    MathField.handleStaticEnterNavigation(container);
  }

  static handleStaticEmptyEnter(container) {
    container.remove();
    const group = container.parentElement;
    if (group && !group.querySelector('.math-field-container')) {
      group.remove();
    }
  }

  static finalizeStaticEdit(container, latex) {
    container.dataset.latex = latex;
    MathFieldUtils.recreateStaticContainer(container, latex);
  }

  static recreateStaticContainer(container, latex) {
    MathFieldUtils.recreateStaticContainer(container, latex);
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
          MathField.handleStaticEmptyBlur(container);
        } else {
          MathField.handleStaticBlur(container, latexValue);
        }
      }, 50);
    });
  }

  static handleStaticEmptyBlur(container) {
    container.remove();
    const group = container.parentElement;
    if (group && !group.querySelector('.math-field-container')) {
      group.remove();
    }
  }

  static handleStaticBlur(container, latexValue) {
    const hasText = latexValue.includes('\\text{') || latexValue.includes('\\\\text{');
    
    container.dataset.latex = latexValue;
    MathField.recreateStaticContainer(container, latexValue);
    
    const group = container.parentElement;
    if (group && group.mathGroup) {
      group.mathGroup.board.fileManager.saveState();
      MathField.processEquivalenceOnBlur(container, hasText);
    }
  }

  static processEquivalenceOnBlur(container, hasText) {
    if (window.expressionEquivalence && !hasText) {
      window.expressionEquivalence.applyIndicatorColors();
      if (container.dataset.groupKey) {
        window.expressionEquivalence.highlightGroupExpressions(container.dataset.groupKey, false);
      } else {
        window.expressionEquivalence.removeAllHighlights();
      }
    }
  }
}
