class MathField {
  constructor(mathGroup, isNewField) {
    this.mathGroup = mathGroup;
    this.containerManager = new MathFieldContainer(mathGroup);
    this.container = this.containerManager.getContainer();
    this.container.mathFieldInstance = this;
    
    this.editor = new MathFieldEditor(this.container, mathGroup);

    if (isNewField) {
      this.editor.createMathField();
      this.attachEventListeners();

      if (this.editor.getMathField() && typeof this.editor.getMathField().focus === 'function') {
        this.editor.getMathField().focus();
      }
    }
  }

  attachEventListeners() {
    const mathFieldElement = this.editor.getMathFieldElement();
    if (!mathFieldElement) return;
    if (mathFieldElement.dataset.listenersAttached === 'true') return;
    mathFieldElement.dataset.listenersAttached = 'true';

    mathFieldElement.addEventListener('keydown', (event) => this.handleKeyDown(event), true);
    mathFieldElement.addEventListener('blur', () => this.handleBlur());
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
    const latexContent = this.editor.getMathField().latex().trim();
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
      // TODO: ctrl + enter auto-simplifies the expression?
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

  navigateToPreviousField() {
    const previousContainer = this.container.previousElementSibling;
    if (previousContainer && previousContainer.classList.contains('math-field-container')) {
      this.container.remove();
      MathFieldEditor.edit(previousContainer);
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
      MathFieldEditor.edit(nextContainer);
    }
  }

  editLastField(groupElement) {
    const lastContainer = groupElement.lastElementChild;
    if (lastContainer && lastContainer.classList.contains('math-field-container')) {
      MathFieldEditor.edit(lastContainer);
    }
  }

  finalize() {
    const latex = this.editor.getMathField().latex().trim();
    if (!latex) {
      this.handleEmptyField();
      return;
    }
    
    this.updateLatexData(latex);
    this.editor.replaceWithStaticMath(latex);
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

  updateLatexData(latex) { this.container.dataset.latex = latex; }

  handleEquivalenceProcessing(latex) {
    const hasText = MathFieldUtils.hasTextContent(latex);
    MathFieldUtils.processEquivalenceColors(this.container, hasText);
  }

}
