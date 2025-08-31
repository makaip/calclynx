/**
 * Modular Modal System Initialization
 * Sets up the new modular system
 */

// Add a flag to prevent double initialization
let isInitialized = false;

// Initialize the modular system once DOM is ready and all scripts are loaded
document.addEventListener('DOMContentLoaded', function() {
  if (!isInitialized) {
    setTimeout(initializeModularSystem, 100); // Increased timeout to ensure all scripts are loaded
  }
});

/**
 * Perform one-time setup of the modular UI system (command registry, palette, input managers, and default commands).
 *
 * Initializes global singletons and UI components used by the modular command system. This function is idempotent
 * (returns early if initialization already completed) and performs a dependency check for required classes
 * (BaseModal, CommandTemplate, VariableInputManager) before creating instances. On success it will:
 * - create window.variableInputManager (VariableInputManager) if missing
 * - create window.commandRegistry (CommandRegistry) if missing
 * - register default math commands via setupDefaultCommands()
 * - create window.commandPalette (ModularCommandPalette) when available
 * - create window.imageUrlInput using TextInputModalFactory when available
 * It sets the module state flags (isInitializing, isInitialized) and logs progress. If required dependencies are
 * absent or an error occurs, the function logs an error and resets initialization flags to allow retrying later.
 */
function initializeModularSystem() {
  // Prevent double initialization
  if (isInitialized) {
    console.log('Modular system already initialized.');
    return;
  }
  
  console.log('Initializing modular system...');
  
  try {
    // Ensure all required classes are available
    if (typeof BaseModal === 'undefined' || 
        typeof CommandTemplate === 'undefined' || 
        typeof VariableInputManager === 'undefined') {
      console.error('Modular system dependencies not loaded:', {
        BaseModal: typeof BaseModal,
        CommandTemplate: typeof CommandTemplate,
        VariableInputManager: typeof VariableInputManager
      });
      isInitialized = false; // Allow re-initialization attempt
      return;
    }

    // Initialize global instances
    if (!window.variableInputManager) {
      window.variableInputManager = new VariableInputManager();
      console.log('VariableInputManager initialized');
    }
    
    if (!window.commandRegistry) {
      window.commandRegistry = new CommandRegistry();
      console.log('CommandRegistry initialized');
    }

    // Set up default commands using the new system
    setupDefaultCommands();
    console.log('Default commands set up');
    
    // Initialize modular command palette
    if (typeof ModularCommandPalette !== 'undefined') {
      window.commandPalette = new ModularCommandPalette();
      console.log('ModularCommandPalette initialized:', window.commandPalette);
    } else {
      console.error('ModularCommandPalette class not found');
    }

    // Initialize text input modals
    if (typeof TextInputModal !== 'undefined' && typeof TextInputModalFactory !== 'undefined') {
      window.imageUrlInput = TextInputModalFactory.createImageUrlInput();
      console.log('TextInputModal initialized');
    } else {
      console.error('TextInputModal or TextInputModalFactory class not found');
    }

    // Mark initialization as complete
    isInitializing = false;
    isInitialized = true;
    
    console.log('Modular system initialization complete');
    
  } catch (error) {
    console.error('Error during modular system initialization:', error);
    isInitializing = false;
    isInitialized = false; // Reset flag on error
  }
}

/**
 * Register a set of default math command templates on the global command registry.
 *
 * Creates and registers common algebra and calculus commands (Simplify, Expand, Factor,
 * Solve for, Derivative with respect to, Integrate with respect to) using CommandTemplate
 * and window.commandRegistry.register.
 *
 * Requires window.commandRegistry to be present; if it's absent the function will throw a
 * runtime error when attempting to call register.
 */
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
    }),
    
    new CommandTemplate('Integrate with respect to', {
      category: 'calculus',
      description: 'Find the indefinite integral with respect to a variable',
      requiresVariable: true,
      variablePattern: 'integrate with respect to'
    })
  ];

  // Register all commands
  mathCommands.forEach(command => {
    window.commandRegistry.register(command);
  });
}

/**
 * Register a math-scoped command and return the created CommandTemplate.
 *
 * @param {string} label - Visible label/name for the command.
 * @param {Object} [config={}] - Optional CommandTemplate configuration; merged with `{ category: 'math' }`.
 * @returns {CommandTemplate|undefined} The created CommandTemplate, or `undefined` if the global command registry is not initialized.
 */
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

/**
 * Convenience wrapper to create and register a math-scoped command that requires a variable.
 * @param {string} label - Command label shown in the UI.
 * @param {string} variablePatternKey - Key identifying the variable pattern to use (assigned to the command's `variablePattern`).
 * @param {Object} [config={}] - Additional CommandTemplate configuration merged into the created command.
 * @return {CommandTemplate} The registered CommandTemplate instance.
 */
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
window.initializeModularSystem = initializeModularSystem;

/**
 * Execute a MathGene command on a target MathQuill-like field and write the resulting LaTeX into it.
 *
 * Attempts to run the named command (e.g., "Simplify", "Expand", "Factor",
 * "Solve for x", "Derivative with respect to x", "Integrate with respect to x") against
 * the provided LaTeX source. Prefers the global `mgCalc` API and falls back to
 * `mgTrans`/`mgCalculate` when available. On success the resulting `.latex` is
 * written to `targetMathFieldInstance.mathField.latex(...)`. Input validation
 * and runtime errors are logged and rendered as an escaped LaTeX error message
 * into the target field.
 *
 * @param {string} commandName - The command to execute (case-sensitive for simple commands; prefix forms like `"solve for x"` or `"derivative with respect to x"` are supported).
 * @param {string} sourceLatex - The input expression in LaTeX. For "solve for" commands, an `=` is appended as ` = 0` when missing.
 * @param {object} targetMathFieldInstance - The target object that must expose a `mathField` with a `.latex(string)` method where the result or error message will be written.
 * @returns {void}
 */
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
      // Handle "Integrate with respect to x" using mgCalc.Integral
      else if (typeof commandName === 'string' && commandName.toLowerCase().startsWith('integrate with respect to ')) {
        const variable = commandName.substring('integrate with respect to '.length).trim();
        resultMg = mgCalc.Integral ? mgCalc.Integral(processedSourceLatex, variable) : mgCalc.Simplify(processedSourceLatex);
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
          case 'Integral':
            // For a simple "Integral" command, we'll assume integration with respect to 'x'
            resultMg = mgCalc.Integral ? mgCalc.Integral(processedSourceLatex, 'x') : mgCalc.Simplify(processedSourceLatex);
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