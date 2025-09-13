class MathFieldContainer {
  constructor(mathGroup) {
    this.mathGroup = mathGroup;
    this.container = null;

    this.container = document.createElement('div');
    this.container.className = 'math-field-container';
    this.container.dataset.latex = '';
    this.container.mathFieldInstance = this;
    
    const circleIndicator = MathFieldUtils.createCircleIndicator();
    this.container.appendChild(circleIndicator);

    const dragHandle = MathFieldUtils.createDragHandle();
    this.container.appendChild(dragHandle);

    this.container.addEventListener('mousedown', (event) => this.handleContainerMouseDown(event));
    this.container.addEventListener('click', (event) => this.handleContainerClick(event));

    MathFieldUtils.validateMathGroupElement(this.mathGroup);
    this.mathGroup.element.appendChild(this.container);
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

  getContainer() {
    return this.container;
  }
}