/**
 * VariableInputManager - Handles variable input patterns for commands
 * Provides reusable functionality for commands that require variable input
 */
class VariableInputManager {
  constructor() {
    this.variablePatterns = new Map();
    this.setupDefaultPatterns();
  }

  setupDefaultPatterns() {
    // Define patterns for commands that require variables
    this.addPattern('solve for', {
      prefix: 'Solve for ',
      placeholder: 'variable',
      validator: (variable) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(variable),
      extractor: (input) => input.substring('solve for '.length).trim()
    });

    this.addPattern('derivative with respect to', {
      prefix: 'Derivative with respect to ',
      placeholder: 'variable',
      validator: (variable) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(variable),
      extractor: (input) => input.substring('derivative with respect to '.length).trim()
    });
  }

  addPattern(key, config) {
    this.variablePatterns.set(key, config);
  }

  removePattern(key) {
    this.variablePatterns.delete(key);
  }

  getPattern(key) {
    return this.variablePatterns.get(key);
  }

  getAllPatterns() {
    return Array.from(this.variablePatterns.entries());
  }

  matchesPattern(input) {
    const lowerInput = input.toLowerCase();
    for (const [key, pattern] of this.variablePatterns) {
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

  createVariableInputHTML(pattern, currentVariable = '') {
    return `
      <span class="variable-input-container">
        <span class="variable-prefix">${pattern.prefix}</span>
        <span class="variable-placeholder" data-placeholder="${pattern.placeholder}">
          ${currentVariable || `[${pattern.placeholder}]`}
        </span>
      </span>
    `;
  }

  extractVariable(input, patternKey) {
    const pattern = this.getPattern(patternKey);
    if (!pattern) return null;
    
    return pattern.extractor(input.toLowerCase());
  }

  validateVariable(variable, patternKey) {
    const pattern = this.getPattern(patternKey);
    if (!pattern) return false;
    
    return pattern.validator(variable);
  }

  formatCommand(patternKey, variable) {
    const pattern = this.getPattern(patternKey);
    if (!pattern) return null;
    
    return pattern.prefix + variable;
  }
}

// Global instance
window.variableInputManager = new VariableInputManager();
