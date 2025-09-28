import { MathFieldUtils } from './mathfield-utils.js';
import { MathFieldUIManager } from './mathfield-ui-manager.js';
import { MathFieldEditor } from './mathfield-editor.js';

class MathFieldEventHandler {
  constructor(mathField) {
    this.mathField = mathField;
    this.container = mathField.container;
    this.mathGroup = mathField.mathGroup;
    this.editor = mathField.editor;
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
    if (MathFieldUIManager.canNavigateToPrevious(this.container, groupElement)) {
      event.preventDefault();
      this.navigateToPreviousField();
    }
  }

  handleCtrlBackspace(event) {
    event.preventDefault();
    const board = this.mathGroup?.board;
    if (event.shiftKey) {
      this.mathGroup.remove();
    } else {
      this.removeCurrentField();
    }
    board?.fileManager?.saveState();
  }

  handleEnter(event) {
    event.preventDefault();
    this.mathField.finalize();

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
      this.mathField.finalize();
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
}

export { MathFieldEventHandler };