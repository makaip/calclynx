/**
 * CommandTemplate - Manages command templates with variable placeholders
 * Provides extensible command system following open/closed principle
 */
class CommandTemplate {
  constructor(label, config = {}) {
    this.label = label;
    this.config = {
      action: null,
      requiresVariable: false,
      variablePattern: null,
      description: '',
      category: 'default',
      ...config
    };
  }

  hasVariableInput() {
    return this.config.requiresVariable && this.config.variablePattern;
  }

  getDisplayLabel(variable = null) {
    if (this.hasVariableInput() && variable) {
      const pattern = window.variableInputManager?.getPattern(this.config.variablePattern);
      if (pattern) {
        return pattern.prefix + variable;
      }
    }
    return this.label;
  }

  getVariablePattern() {
    if (this.hasVariableInput()) {
      return window.variableInputManager?.getPattern(this.config.variablePattern);
    }
    return null;
  }

  execute(context = {}) {
    if (this.config.action) {
      return this.config.action(context);
    }
  }

  matchesInput(input) {
    const lowerInput = input.toLowerCase();
    const lowerLabel = this.label.toLowerCase();
    
    // Direct label match
    if (lowerLabel.includes(lowerInput)) {
      return { score: 1, type: 'label' };
    }

    // Variable pattern match
    if (this.hasVariableInput()) {
      const match = window.variableInputManager?.matchesPattern(input);
      if (match && match.key === this.config.variablePattern) {
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
}

/**
 * CommandRegistry - Manages all available commands
 * Implements dependency inversion principle
 */
class CommandRegistry {
  constructor() {
    this.commands = [];
    this.categories = new Map();
  }

  register(commandTemplate) {
    if (!(commandTemplate instanceof CommandTemplate)) {
      throw new Error("Command must be instance of CommandTemplate");
    }
    
    this.commands.push(commandTemplate);
    
    // Group by category
    const category = commandTemplate.config.category;
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category).push(commandTemplate);
  }

  unregister(commandTemplate) {
    const index = this.commands.indexOf(commandTemplate);
    if (index > -1) {
      this.commands.splice(index, 1);
      
      // Remove from category
      const category = commandTemplate.config.category;
      if (this.categories.has(category)) {
        const categoryCommands = this.categories.get(category);
        const categoryIndex = categoryCommands.indexOf(commandTemplate);
        if (categoryIndex > -1) {
          categoryCommands.splice(categoryIndex, 1);
        }
      }
    }
  }

  search(query, maxResults = 10) {
    if (!query.trim()) {
      // Return all commands with default match objects for empty queries
      return this.commands.slice(0, maxResults).map(command => ({
        command,
        match: { score: 1, type: 'label' },
        score: 1
      }));
    }

    const results = [];
    
    for (const command of this.commands) {
      const match = command.matchesInput(query);
      if (match) {
        results.push({
          command,
          match,
          score: match.score
        });
      }
    }

    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(result => result);
  }

  getByCategory(category) {
    return this.categories.get(category) || [];
  }

  getAllCategories() {
    return Array.from(this.categories.keys());
  }

  getAll() {
    return [...this.commands];
  }
}

// Global instance
window.commandRegistry = new CommandRegistry();
