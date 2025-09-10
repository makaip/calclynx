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
    
    if (lowerLabel.includes(lowerInput)) {
      return { score: 1, type: 'label' };
    }

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

class CommandRegistry {
  constructor() {
    this.commands = [];
    this.categories = new Map();
    this.setupDefaultCommands();
  }

  setupDefaultCommands() {
    // Define all commands here - easy to add new ones
    const commandDefinitions = [
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

    // Create CommandTemplate instances and organize them
    commandDefinitions.forEach(def => {
      const command = new CommandTemplate(def.label, def);
      this.commands.push(command);
      
      const category = command.config.category;
      if (!this.categories.has(category)) {
        this.categories.set(category, []);
      }
      this.categories.get(category).push(command);
    });
  }

  search(query, maxResults = 10) {
    if (!query.trim()) {
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

window.commandRegistry = new CommandRegistry();
