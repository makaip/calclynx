class MathFieldContainer {
  constructor(mathGroup) {
    this.mathGroup = mathGroup;
    this.container = null;
    this.createContainer();
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
      MathFieldUIManager.clearMathGroupSelections();
    }
    MathFieldUIManager.highlightGroupExpressions(this.container);
  }

  handleContainerClick(event) {
    if (MathFieldUtils.isDragHandleClicked(event)) {
      event.stopPropagation();
      return;
    }

    event.stopPropagation();
    
    if (!MathFieldUIManager.isCurrentlyEditing(this.container)) {
      MathFieldUIManager.clearMathGroupSelections();
      MathFieldEditor.edit(this.container);
    }

    MathFieldUIManager.markContainerAsSelected(this.container);
  }

  appendToMathGroup() {
    MathFieldUtils.validateMathGroupElement(this.mathGroup);
    this.mathGroup.element.appendChild(this.container);
  }

  getContainer() {
    return this.container;
  }
}

