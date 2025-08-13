class VersionManager {
  constructor(fileManager, maxHistory = 10) {
    this.fileManager = fileManager;
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = maxHistory;
  }

  getCurrentState() {
    const groups = [];
    
    // Save math groups
    const mathGroupElements = this.fileManager.board.canvas.querySelectorAll('.math-group');
    mathGroupElements.forEach((group) => {
      const left = group.style.left;
      const top = group.style.top;
      const fields = [];
      group.querySelectorAll('.math-field-container').forEach((container) => {
        if (container.dataset.latex) {
          fields.push(container.dataset.latex);
        }
      });
      groups.push({ type: 'math', left, top, fields });
    });
    
    // Save text groups
    const textGroupElements = this.fileManager.board.canvas.querySelectorAll('.text-group');
    textGroupElements.forEach((group) => {
      const left = group.style.left;
      const top = group.style.top;
      const fields = [];
      group.querySelectorAll('.text-field-container').forEach((container) => {
        const textField = container.textFieldInstance;
        if (textField) {
          fields.push(textField.getContent());
        }
      });
      groups.push({ type: 'text', left, top, fields });
    });
    
    return JSON.stringify(groups);
  }

  pushUndoState(state) {
    this.undoStack.push(state);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
  }

  saveState() {
    const state = this.getCurrentState();
    this.pushUndoState(state);
    this.redoStack = [];
  }

  restoreState(state) {
    this.fileManager.importData(state);
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const currentState = this.getCurrentState();
    this.redoStack.push(currentState);
    const previousState = this.undoStack.pop();
    this.restoreState(previousState);
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const currentState = this.getCurrentState();
    this.pushUndoState(currentState);
    const nextState = this.redoStack.pop();
    this.restoreState(nextState);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VersionManager;
} else {
  window.VersionManager = VersionManager;
}
