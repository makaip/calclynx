class CommandPalette {
  constructor(options = {}) {
    this.modalElement = null;
    this.bootstrapModal = null;
    this.inputElement = null;
    this.optionsElement = null;
    this.selectedIndex = -1;
    this.filteredResults = [];
    this.currentReferenceElement = null;
    this.lastFocusedMathField = null;
    this.variableInputMode = false;
    this.currentVariablePattern = null;
    
    this.setupCommands();
    this.setupVariablePatterns();
    this.initialize();
  }

  setupCommands() {
    this.commands = [
      {
        label: 'Simplify',
        category: 'algebra',
        description: 'Simplify the mathematical expression'
      },
      {
        label: 'Expand',
        category: 'algebra',
        description: 'Expand the mathematical expression'
      },
      {
        label: 'Factor',
        category: 'algebra',
        description: 'Factor the mathematical expression'
      },
      {
        label: 'Solve for',
        category: 'algebra',
        description: 'Solve equation for a specified variable',
        requiresVariable: true,
        variablePattern: 'solve for'
      },
      {
        label: 'Derivative with respect to',
        category: 'calculus',
        description: 'Find the derivative with respect to a variable',
        requiresVariable: true,
        variablePattern: 'derivative with respect to'
      },
      {
        label: 'Integrate with respect to',
        category: 'calculus',
        description: 'Find the indefinite integral with respect to a variable',
        requiresVariable: true,
        variablePattern: 'integrate with respect to'
      }
    ];
  }

  setupVariablePatterns() {
    this.variablePatterns = {
      'solve for': {
        prefix: 'Solve for ',
        placeholder: 'variable',
        validator: (variable) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(variable),
        extractor: (input) => input.substring('solve for '.length).trim()
      },
      'derivative with respect to': {
        prefix: 'Derivative with respect to ',
        placeholder: 'variable',
        validator: (variable) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(variable),
        extractor: (input) => input.substring('derivative with respect to '.length).trim()
      },
      'integrate with respect to': {
        prefix: 'Integrate with respect to ',
        placeholder: 'variable',
        validator: (variable) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(variable),
        extractor: (input) => input.substring('integrate with respect to '.length).trim()
      }
    };
  }

  initialize() {
    this.getModalReferences();
    this.setupMathFieldTracking();
    this.setupEventHandlers();
  }

  getModalReferences() {
    this.modalElement = document.getElementById('commandPaletteModal');
    this.inputElement = this.modalElement.querySelector('.command-palette-input');
    this.optionsElement = this.modalElement.querySelector('.command-palette-options');
    
    this.bootstrapModal = new bootstrap.Modal(this.modalElement, {
      backdrop: true,
      keyboard: false
    });
  }

  setupMathFieldTracking() {
    this.modalElement.classList.add('command-palette-ready');
  }

  setupEventHandlers() {
    this.inputElement.addEventListener('input', () => this.renderOptions());
    this.inputElement.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.modalElement.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        this.hide();
      }
    });
  }

  handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
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
    const patternMatch = this.matchesVariablePattern(typedInput);
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
    const matchVariable = match && match.variable;
    
    if (command.requiresVariable && !matchVariable) {
      // Enter variable input mode
      this.enterVariableInputMode({
        key: command.variablePattern,
        pattern: this.variablePatterns[command.variablePattern]
      });
      return;
    }

    // Execute the command
    const context = this.buildExecutionContext(command, matchVariable);
    
    if (command.requiresVariable && matchVariable) {
      this.executeVariableCommand(command.variablePattern, matchVariable, context);
    } else {
      this.executeStandardCommand(command, context);
    }
  }

  enterVariableInputMode(patternMatch) {
    this.variableInputMode = true;
    this.currentVariablePattern = patternMatch.key;
    
    const pattern = this.variablePatterns[patternMatch.key];
    if (pattern) {
      this.inputElement.value = pattern.prefix;
      this.inputElement.classList.add('variable-input-mode');
      this.inputElement.focus();
      this.inputElement.setSelectionRange(
        this.inputElement.value.length, 
        this.inputElement.value.length
      );
    }
  }

  executeVariableCommand(patternKey, variable, context = null) {
    if (!context) {
      context = this.buildExecutionContext(null, variable);
    }
    
    // Format the command name and execute
    const pattern = this.variablePatterns[patternKey];
    if (pattern) {
      const commandName = pattern.prefix + variable;
      if (context.targetMathField && context.sourceLatex) {
        this.applyMathGeneCommand(commandName, context.sourceLatex, context.targetMathField);
      }
    }
    
    this.hide();
  }

  executeStandardCommand(command, context) {
    if (context.targetMathField && context.sourceLatex) {
      this.applyMathGeneCommand(command.label, context.sourceLatex, context.targetMathField);
    }
    
    this.hide();
  }

  buildExecutionContext(command = null, variable = null) {
    const mathFields = document.querySelectorAll('.math-field-container');
    let referenceContainer = this.currentReferenceElement?.closest('.math-field-container');
    
    if (!referenceContainer && mathFields.length > 0) {
      referenceContainer = mathFields[mathFields.length - 1];
    }

    const context = {
      command,
      variable,
      referenceContainer,
      targetMathField: null,
      sourceLatex: null
    };

    if (referenceContainer && referenceContainer.parentElement?.mathGroup) {
      const targetMathField = referenceContainer.parentElement.mathGroup.insertMathFieldAfter(referenceContainer);
      context.targetMathField = targetMathField;
      
      const sourceMathFieldInstance = referenceContainer.mathFieldInstance;
      if (sourceMathFieldInstance && sourceMathFieldInstance.editor.getMathField()) {
        context.sourceLatex = sourceMathFieldInstance.editor.getMathField().latex();
      } else if (referenceContainer.dataset.latex) {
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
    this.filteredResults = this.searchCommands(query);
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
    const pattern = this.variablePatterns[this.currentVariablePattern];
    if (!pattern) return;

    const variable = pattern.extractor(query);
    const isValid = variable && pattern.validator(variable);
    
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'list-group-item list-group-item-action variable-input-option';
    option.innerHTML = `
      <span class="variable-input-container">
        <span class="variable-prefix">${pattern.prefix}</span>
        <span class="variable-placeholder badge bg-primary ms-1" data-placeholder="${pattern.placeholder}">
          ${variable || pattern.placeholder}
        </span>
      </span>
    `;
    
    if (isValid) {
      option.classList.add('active');
    }
    
    this.optionsElement.appendChild(option);
  }

  searchCommands(query, maxResults = 10) {
    if (!query.trim()) {
      return this.commands.slice(0, maxResults).map(command => ({
        command,
        match: { score: 1, type: 'label' },
        score: 1
      }));
    }

    const results = [];
    
    for (const command of this.commands) {
      const match = this.matchCommand(command, query);
      if (match) {
        results.push({
          command,
          match,
          score: match.score
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  matchCommand(command, input) {
    const lowerInput = input.toLowerCase();
    const lowerLabel = command.label.toLowerCase();
    
    if (lowerLabel.includes(lowerInput)) {
      return { score: 1, type: 'label' };
    }

    if (command.requiresVariable) {
      const match = this.matchesVariablePattern(input);
      if (match && match.key === command.variablePattern) {
        return { 
          score: 0.9, 
          type: 'variable',
          variable: match.variable,
          isComplete: match.isComplete
        };
      }
    }

    return null;
  }

  matchesVariablePattern(input) {
    const lowerInput = input.toLowerCase();
    for (const [key, pattern] of Object.entries(this.variablePatterns)) {
      if (lowerInput.startsWith(key + ' ')) {
        return {
          key,
          pattern,
          variable: pattern.extractor(lowerInput),
          isComplete: this.isCompleteVariableInput(lowerInput, pattern)
        };
      }
    }
    return null;
  }

  isCompleteVariableInput(input, pattern) {
    const variable = pattern.extractor(input);
    return variable && pattern.validator(variable);
  }

  createOptionElement(result, index) {
    const { command, match } = result;
    
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'list-group-item list-group-item-action';
    option.dataset.index = index;
    
    if (match && match.type === 'variable' && match.variable) {
      const pattern = this.variablePatterns[command.variablePattern];
      option.innerHTML = pattern.prefix + match.variable;
      if (match.isComplete) {
        option.classList.add('complete-variable');
      }
    } else {
      option.innerHTML = command.label;
      if (command.requiresVariable) {
        option.innerHTML += ' <span class="variable-indicator text-secondary fst-italic small">[variable]</span>';
      }
    }
    
    option.addEventListener('click', () => {
      this.selectedIndex = index;
      this.selectCurrent();
    });
    
    return option;
  }

  updateSelectionVisual() {
    const options = this.optionsElement.querySelectorAll('.list-group-item');
    
    options.forEach((option, index) => {
      if (index === this.selectedIndex) {
        option.classList.add('active');
        option.scrollIntoView({ block: 'nearest' });
      } else {
        option.classList.remove('active');
      }
    });
  }

  show(referenceElement = null) {
    this.currentReferenceElement = referenceElement;
    this.inputElement.value = '';
    this.selectedIndex = -1;
    this.variableInputMode = false;
    this.currentVariablePattern = null;
    this.inputElement.classList.remove('variable-input-mode');
    this.renderOptions();
    this.bootstrapModal.show();
    this.inputElement.focus();
  }

  hide() {
    this.bootstrapModal.hide();
  }

  onHide() {
    this.currentReferenceElement = null;
    this.variableInputMode = false;
    this.currentVariablePattern = null;
    this.inputElement.classList.remove('variable-input-mode');
  }

  // Core MathGene command execution function
  applyMathGeneCommand(commandName, sourceLatex, targetMathFieldInstance) {
    if (!sourceLatex || !targetMathFieldInstance || !targetMathFieldInstance.editor.getMathField()) {
      console.error("Missing source LaTeX or target MathField instance.");
      if (targetMathFieldInstance && targetMathFieldInstance.editor.getMathField()) {
        targetMathFieldInstance.editor.getMathField().latex(`\\text{Error: Invalid input}`);
      }
      return;
    }

    try {
      let processedSourceLatex = sourceLatex;
      
      // For "Solve for" commands, check if there's an equals sign
      if (typeof commandName === 'string' && commandName.toLowerCase().startsWith('solve for ')) {
        if (!sourceLatex.includes('=')) {
          processedSourceLatex = sourceLatex + ' = 0';
        }
      }
      
      // Use mgCalc if available
      if (typeof mgCalc !== 'undefined') {
        let resultMg;
        
        if (typeof commandName === 'string' && commandName.toLowerCase().startsWith('solve for ')) {
          const variable = commandName.substring('solve for '.length).trim();
          resultMg = mgCalc.Solve ? mgCalc.Solve(processedSourceLatex, variable) : mgCalc.Simplify(processedSourceLatex);
        }
        else if (typeof commandName === 'string' && commandName.toLowerCase().startsWith('derivative with respect to ')) {
          const variable = commandName.substring('derivative with respect to '.length).trim();
          resultMg = mgCalc.Derivative ? mgCalc.Derivative(processedSourceLatex, variable) : mgCalc.Simplify(processedSourceLatex);
        }
        else if (typeof commandName === 'string' && commandName.toLowerCase().startsWith('integrate with respect to ')) {
          const variable = commandName.substring('integrate with respect to '.length).trim();
          resultMg = mgCalc.Integral ? mgCalc.Integral(processedSourceLatex, variable) : mgCalc.Simplify(processedSourceLatex);
        }
        else {
          switch (commandName) {
            case 'Simplify':
              resultMg = mgCalc.Simplify(processedSourceLatex);
              break;
            case 'Expand':
              resultMg = mgCalc.Expand(processedSourceLatex);
              break;
            case 'Factor':
              resultMg = mgCalc.Factor ? mgCalc.Factor(processedSourceLatex) : mgCalc.Simplify(processedSourceLatex);
              break;
            case 'Integral':
              resultMg = mgCalc.Integral ? mgCalc.Integral(processedSourceLatex, 'x') : mgCalc.Simplify(processedSourceLatex);
              break;
            default:
              resultMg = mgCalc.Simplify(processedSourceLatex);
              break;
          }
        }
        
        if (!resultMg || !resultMg.latex) {
          console.error("MathGene operation returned invalid result.");
          targetMathFieldInstance.editor.getMathField().latex(`\\text{Error: Invalid calculation result}`);
          return;
        }
        
        const resultLatex = resultMg.latex;
        targetMathFieldInstance.editor.getMathField().latex(resultLatex);
      }
      // Fall back to mgTrans/mgCalculate if mgCalc not available
      else if (typeof mgTrans !== 'undefined' && typeof mgCalculate !== 'undefined') {
        const sourceMg = mgTrans.texImport(processedSourceLatex);
        const resultMg = mgCalculate.Simplify(sourceMg);
        const mathGeneResult = mgTrans.Output(resultMg);
        
        if (mathGeneResult && mathGeneResult.latex) {
          targetMathFieldInstance.editor.getMathField().latex(mathGeneResult.latex);
        } else {
          targetMathFieldInstance.editor.getMathField().latex(`\\text{Error: Processing failed}`);
        }
      } else {
        console.error("No MathGene libraries found globally.");
        targetMathFieldInstance.editor.getMathField().latex(`\\text{Error: MathGene not available}`);
      }
    } catch (error) {
      console.error("Error during MathGene processing:", error);
      const errorMessage = error.message || 'Processing failed';
      const escapedErrorMessage = errorMessage.replace(/\\/g, '\\textbackslash ').replace(/_/g, '\\_').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
      targetMathFieldInstance.editor.getMathField().latex(`\\text{Error: ${escapedErrorMessage}}`);
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
    try {
      window.commandPalette = new CommandPalette();
    } catch (error) {
      console.error('Error initializing command palette:', error);
    }
});

export { CommandPalette };