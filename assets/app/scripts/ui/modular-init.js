/**
 * Modular Modal System Initialization
 * Sets up the new modular system
 */

// Initialize the modular system once DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(initializeModularSystem, 50);
});

function initializeModularSystem() {
  // Ensure all required classes are available
  if (typeof BaseModal === 'undefined' || 
      typeof CommandTemplate === 'undefined' || 
      typeof VariableInputManager === 'undefined') {
    console.error('Modular system dependencies not loaded');
    return;
  }

  // Initialize global instances
  if (!window.variableInputManager) {
    window.variableInputManager = new VariableInputManager();
  }
  
  if (!window.commandRegistry) {
    window.commandRegistry = new CommandRegistry();
  }

  // Set up default commands using the new system
  setupDefaultCommands();
  
  // Initialize modular command palette
  if (typeof ModularCommandPalette !== 'undefined') {
    window.commandPalette = new ModularCommandPalette();
  }

  // Initialize text input modals
  if (typeof TextInputModal !== 'undefined') {
    window.imageUrlInput = TextInputModalFactory.createImageUrlInput();
  }

  // System initialization complete
}

function setupDefaultCommands() {
  // Register default math commands
  const mathCommands = [
    new CommandTemplate('Simplify', {
      category: 'algebra',
      description: 'Simplify the mathematical expression'
    }),
    
    new CommandTemplate('Expand', {
      category: 'algebra',
      description: 'Expand the mathematical expression'
    }),
    
    new CommandTemplate('Factor', {
      category: 'algebra',
      description: 'Factor the mathematical expression'
    }),
    
    new CommandTemplate('Solve for', {
      category: 'algebra',
      description: 'Solve equation for a specified variable',
      requiresVariable: true,
      variablePattern: 'solve for'
    }),
    
    new CommandTemplate('Derivative with respect to', {
      category: 'calculus',
      description: 'Find the derivative with respect to a variable',
      requiresVariable: true,
      variablePattern: 'derivative with respect to'
    })
  ];

  // Register all commands
  mathCommands.forEach(command => {
    window.commandRegistry.register(command);
  });
}

// Add additional math commands easily
function addMathCommand(label, config = {}) {
  if (!window.commandRegistry) {
    console.error('Command registry not initialized');
    return;
  }
  
  const command = new CommandTemplate(label, {
    category: 'math',
    ...config
  });
  
  window.commandRegistry.register(command);
  return command;
}

// Add variable command helper
function addVariableCommand(label, variablePatternKey, config = {}) {
  return addMathCommand(label, {
    requiresVariable: true,
    variablePattern: variablePatternKey,
    ...config
  });
}

// Export helper functions globally
window.addMathCommand = addMathCommand;
window.addVariableCommand = addVariableCommand;

// Core MathGene command execution function
function applyMathGeneCommand(commandName, sourceLatex, targetMathFieldInstance) {
  if (!sourceLatex || !targetMathFieldInstance || !targetMathFieldInstance.mathField) {
    console.error("Missing source LaTeX or target MathField instance.");
    if (targetMathFieldInstance && targetMathFieldInstance.mathField) {
      targetMathFieldInstance.mathField.latex(`\\text{Error: Invalid input}`);
    }
    return;
  }

  try {
    let processedSourceLatex = sourceLatex;
    
    // For "Solve for" commands, check if there's an equals sign
    if (typeof commandName === 'string' && commandName.toLowerCase().startsWith('solve for ')) {
      if (!sourceLatex.includes('=')) {
        // If no equals sign, assume expression = 0
        processedSourceLatex = sourceLatex + ' = 0';
      }
    }
    
    // Use mgCalc if available
    if (typeof mgCalc !== 'undefined') {
      let resultMg;
      
      // Handle "Solve for x" using mgCalc.Solve
      if (typeof commandName === 'string' && commandName.toLowerCase().startsWith('solve for ')) {
        const variable = commandName.substring('solve for '.length).trim();
        resultMg = mgCalc.Solve ? mgCalc.Solve(processedSourceLatex, variable) : mgCalc.Simplify(processedSourceLatex);
      }
      // Handle "Derivative with respect to x" using mgCalc.Derivative
      else if (typeof commandName === 'string' && commandName.toLowerCase().startsWith('derivative with respect to ')) {
        const variable = commandName.substring('derivative with respect to '.length).trim();
        resultMg = mgCalc.Derivative ? mgCalc.Derivative(processedSourceLatex, variable) : mgCalc.Simplify(processedSourceLatex);
      }
      // Handle other commands
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
          default:
            resultMg = mgCalc.Simplify(processedSourceLatex);
            break;
        }
      }
      
      if (!resultMg || !resultMg.latex) {
        console.error("MathGene operation returned invalid result.");
        targetMathFieldInstance.mathField.latex(`\\text{Error: Invalid calculation result}`);
        return;
      }
      
      const resultLatex = resultMg.latex;
      targetMathFieldInstance.mathField.latex(resultLatex);
    }
    // Fall back to mgTrans/mgCalculate if mgCalc not available
    else if (typeof mgTrans !== 'undefined' && typeof mgCalculate !== 'undefined') {
      const sourceMg = mgTrans.texImport(processedSourceLatex);
      const resultMg = mgCalculate.Simplify(sourceMg); // Simple fallback
      const mathGeneResult = mgTrans.Output(resultMg);
      
      if (mathGeneResult && mathGeneResult.latex) {
        targetMathFieldInstance.mathField.latex(mathGeneResult.latex);
      } else {
        targetMathFieldInstance.mathField.latex(`\\text{Error: Processing failed}`);
      }
    } else {
      console.error("No MathGene libraries found globally.");
      targetMathFieldInstance.mathField.latex(`\\text{Error: MathGene not available}`);
    }
  } catch (error) {
    console.error("Error during MathGene processing:", error);
    const errorMessage = error.message || 'Processing failed';
    const escapedErrorMessage = errorMessage.replace(/\\/g, '\\textbackslash ').replace(/_/g, '\\_').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
    targetMathFieldInstance.mathField.latex(`\\text{Error: ${escapedErrorMessage}}`);
  }
}

// Export globally for use by the command palette
window.applyMathGeneCommand = applyMathGeneCommand;
