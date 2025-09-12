/**
 * ModularCommandPalette - Extended CommandPalette built on BaseModal
 * Provides modular command system with variable input support
 */
class ModularCommandPalette extends BaseModal {
  constructor(options = {}) {
    super({
      className: 'command-palette-modal',
      zIndex: 3000,
      ...options
    });
    
    this.inputElement = null;
    this.optionsElement = null;
    this.selectedIndex = -1;
    this.filteredResults = [];
    this.currentReferenceElement = null;
    this.lastFocusedMathField = null;
    this.variableInputMode = false;
    this.currentVariablePattern = null;
  }

  getModalHTML() {
    return `
      <div class="command-palette-content modal-content">
        <input class="command-palette-input" type="text" placeholder="Type a command..." />
        <div class="command-palette-options"></div>
      </div>
    `;
  }

  initialize() {
    this.modalElement = this.createModalElement();
    this.contentElement = this.modalElement.querySelector('.modal-content');
    this.setupCommandPaletteElements();
    this.setupMathFieldTracking();
    this.setupBaseEvents();
    this.setupCustomEvents();
  }

  setupCommandPaletteElements() {
    this.inputElement = this.modalElement.querySelector('.command-palette-input');
    this.optionsElement = this.modalElement.querySelector('.command-palette-options');
  }

  setupMathFieldTracking() {
    document.addEventListener('click', (event) => {
      const mathField = event.target.closest('.math-field-container');
      if (mathField) {
        this.lastFocusedMathField = mathField;
      }
    });
  }

  setupCustomEvents() {
    // Guard against missing input element
    if (!this.inputElement) {
      console.warn('ModularCommandPalette: inputElement not found during setupCustomEvents');
      return;
    }
    
    this.inputElement.addEventListener('input', () => this.renderOptions());
    this.inputElement.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleKeyDown(e) {
    if (e.key === 'Escape') {
      this.hide();
      return;
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.moveSelection(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.moveSelection(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.selectCurrent();
    }
  }

  moveSelection(direction) {
    if (this.filteredResults.length === 0) return;
    
    this.selectedIndex += direction;
    
    if (this.selectedIndex < 0) {
      this.selectedIndex = this.filteredResults.length - 1;
    } else if (this.selectedIndex >= this.filteredResults.length) {
      this.selectedIndex = 0;
    }
    
    this.updateSelectionVisual();
  }

  selectCurrent() {
    const typedInput = this.inputElement.value.trim();
    
    // Check for direct variable pattern input
    const patternMatch = window.variableInputManager?.matchesPattern(typedInput);
    if (patternMatch && patternMatch.isComplete) {
      this.executeVariableCommand(patternMatch.key, patternMatch.variable);
      return;
    }

    // Handle selection from filtered results
    if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredResults.length) {
      const result = this.filteredResults[this.selectedIndex];
      this.executeCommand(result);
      return;
    }

    // If no selection but we have a variable pattern, enter variable input mode
    if (patternMatch && !patternMatch.isComplete) {
      this.enterVariableInputMode(patternMatch);
      return;
    }

    this.hide();
  }

  executeCommand(result) {
    const { command, match } = result;
    
    // Add defensive check for match object
    const matchVariable = match && match.variable;
    
    if (command.hasVariableInput() && !matchVariable) {
      // Enter variable input mode
      this.enterVariableInputMode({
        key: command.config.variablePattern,
        pattern: command.getVariablePattern()
      });
      return;
    }

    // Execute the command
    const context = this.buildExecutionContext(command, matchVariable);
    
    if (command.hasVariableInput() && matchVariable) {
      this.executeVariableCommand(command.config.variablePattern, matchVariable, context);
    } else {
      this.executeStandardCommand(command, context);
    }
  }

  enterVariableInputMode(patternMatch) {
    this.variableInputMode = true;
    this.currentVariablePattern = patternMatch.key;
    
    const pattern = window.variableInputManager?.getPattern(patternMatch.key);
    if (pattern) {
      this.inputElement.value = pattern.prefix;
      this.inputElement.classList.add('variable-input-mode');
      this.inputElement.focus();
      
      // Position cursor at end
      setTimeout(() => {
        this.inputElement.setSelectionRange(
          this.inputElement.value.length, 
          this.inputElement.value.length
        );
      }, 0);
    }
  }

  executeVariableCommand(patternKey, variable, context = null) {
    if (!context) {
      context = this.buildExecutionContext(null, variable);
    }
    
    // Use the applyMathGeneCommand function
    const commandName = window.variableInputManager?.formatCommand(patternKey, variable);
    if (commandName && context.targetMathField && context.sourceLatex) {
      applyMathGeneCommand(commandName, context.sourceLatex, context.targetMathField);
    }
    
    this.hide();
  }

  executeStandardCommand(command, context) {
    // Execute command action if available
    if (command.config.action) {
      command.execute(context);
    } else {
      // Fallback to existing system
      if (context.targetMathField && context.sourceLatex) {
        applyMathGeneCommand(command.label, context.sourceLatex, context.targetMathField);
      }
    }
    
    this.hide();
  }

  buildExecutionContext(command = null, variable = null) {
    let referenceContainer = this.currentReferenceElement?.closest('.math-field-container');
    
    if (!referenceContainer && this.lastFocusedMathField) {
      referenceContainer = this.lastFocusedMathField;
    }

    const context = {
      command,
      variable,
      referenceContainer,
      targetMathField: null,
      sourceLatex: null
    };

    if (referenceContainer && referenceContainer.parentElement?.mathGroup) {
      // Create a new math field after the current one to display the result
      const targetMathField = referenceContainer.parentElement.mathGroup.insertMathFieldAfter(referenceContainer);
      context.targetMathField = targetMathField;
      
      // Get the LaTeX from the reference container
      const sourceMathFieldInstance = referenceContainer.mathFieldInstance;
      if (sourceMathFieldInstance && sourceMathFieldInstance.editor.getMathField()) {
        // If the field is currently being edited, get LaTeX from the active mathField
        context.sourceLatex = sourceMathFieldInstance.editor.getMathField().latex();
      } else if (referenceContainer.dataset.latex) {
        // If the field is not being edited (loaded from data), get LaTeX from dataset
        context.sourceLatex = referenceContainer.dataset.latex;
      }
    }

    return context;
  }

  renderOptions() {
    const query = this.inputElement.value.toLowerCase();
    this.optionsElement.innerHTML = '';
    
    // Handle variable input mode
    if (this.variableInputMode) {
      this.renderVariableInputMode(query);
      return;
    }

    // Search for commands
    this.filteredResults = window.commandRegistry?.search(query) || [];
    this.selectedIndex = -1;

    this.filteredResults.forEach((result, index) => {
      const option = this.createOptionElement(result, index);
      this.optionsElement.appendChild(option);
    });
    
    if (this.filteredResults.length > 0) {
      this.selectedIndex = 0;
      this.updateSelectionVisual();
    }
  }

  renderVariableInputMode(query) {
    const pattern = window.variableInputManager?.getPattern(this.currentVariablePattern);
    if (!pattern) return;

    const variable = pattern.extractor(query);
    const isValid = variable && pattern.validator(variable);
    
    const option = document.createElement('div');
    option.className = 'command-palette-option variable-input-option';
    option.innerHTML = window.variableInputManager?.createVariableInputHTML(pattern, variable) || '';
    
    if (isValid) {
      option.classList.add('valid');
    }
    
    this.optionsElement.appendChild(option);
  }

  createOptionElement(result, index) {
    const { command, match } = result;
    
    const option = document.createElement('div');
    option.className = 'command-palette-option';
    option.dataset.index = index;
    
    // Add defensive check for match object
    if (match && match.type === 'variable' && match.variable) {
      option.innerHTML = command.getDisplayLabel(match.variable);
      if (match.isComplete) {
        option.classList.add('complete-variable');
      }
    } else {
      option.innerHTML = command.label;
      if (command.hasVariableInput()) {
        option.innerHTML += ' <span class="variable-indicator">[variable]</span>';
      }
    }
    
    option.addEventListener('click', () => {
      this.selectedIndex = index;
      this.selectCurrent();
    });
    
    return option;
  }

  updateSelectionVisual() {
    const options = this.optionsElement.querySelectorAll('.command-palette-option');
    
    options.forEach((option, index) => {
      if (index === this.selectedIndex) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
    });
  }

  onShow(referenceElement = null) {
    this.currentReferenceElement = referenceElement;
    this.inputElement.value = '';
    this.selectedIndex = -1;
    this.variableInputMode = false;
    this.currentVariablePattern = null;
    this.inputElement.classList.remove('variable-input-mode');
    this.inputElement.focus();
    this.renderOptions();
  }

  onHide() {
    this.currentReferenceElement = null;
    this.variableInputMode = false;
    this.currentVariablePattern = null;
    this.inputElement.classList.remove('variable-input-mode');
  }
}
