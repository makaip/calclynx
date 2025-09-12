class MathFieldStateManager {
  constructor(mathField) {
    this.mathField = mathField;
    this.container = mathField.container;
    this.mathGroup = mathField.mathGroup;
    this.editor = mathField.editor;
  }

  finalize() {
    const latex = this.editor.getMathField().latex().trim();
    if (!latex) {
      this.handleEmptyField();
      return;
    }
    
    this.updateLatexData(latex);
    this.editor.replaceWithStaticMath(latex);
    this.saveState();
    this.handleEquivalenceProcessing(latex);
  }

  handleEmptyField() {
    this.container.remove();
    if (!this.mathGroup.element.querySelector('.math-field-container')) {
      this.mathGroup.remove();
    }
    this.saveState();
  }

  updateLatexData(latex) { 
    this.container.dataset.latex = latex; 
  }

  saveState() {
    if (this.mathGroup.board && this.mathGroup.board.fileManager) {
      this.mathGroup.board.fileManager.saveState();
    }
  }

  handleEquivalenceProcessing(latex) {
    const hasText = MathFieldUtils.hasTextContent(latex);
    MathFieldUIManager.processEquivalenceColors(this.container, hasText);
  }

  isValidLatex(latex) {
    return latex && latex.trim() !== '' && latex.trim() !== '\\placeholder';
  }

  isEmpty(latex) {
    return MathFieldUtils.isEmpty(latex);
  }

  hasTextContent(latex) {
    return MathFieldUtils.hasTextContent(latex);
  }

  getLatexData() {
    return this.container.dataset.latex || '';
  }

  setLatexData(latex) {
    this.updateLatexData(latex);
  }

  clearData() {
    this.container.dataset.latex = '';
  }
}