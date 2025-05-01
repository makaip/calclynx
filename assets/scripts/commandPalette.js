// Helper function to execute the correct MathGene calculation based on command name
function executeMathGeneOperation(commandName, sourceMg) {
    // Check for both MathGene interfaces - mgCalc (as used in equivalence.js) or mgCalculate
    if (typeof mgCalc !== 'undefined') {
        console.log(`Executing MathGene command via mgCalc: ${commandName}`);
        switch (commandName) {
            case 'Simplify':
                return mgCalc.Simplify(sourceMg);
            case 'Expand':
                return mgCalc.Expand(sourceMg);
            case 'Evaluate':
                return mgCalc.Simplify(sourceMg); // Use Simplify for Evaluate
            case 'Factor':
                return mgCalc.Factor ? mgCalc.Factor(sourceMg) : mgCalc.Simplify(sourceMg);
            default:
                console.warn("Unknown MathGene command:", commandName);
                return sourceMg;
        }
    } 
    else if (typeof mgCalculate !== 'undefined') {
        console.log(`Executing MathGene command via mgCalculate: ${commandName}`);
        switch (commandName) {
            case 'Simplify':
                return mgCalculate.xReduce(sourceMg);
            case 'Expand':
                if (typeof mgCalculate.xprExpand !== 'function') {
                    console.error("mgCalculate.xprExpand function not found.");
                    throw new Error("Expand function missing");
                }
                return mgCalculate.xprExpand(sourceMg);
            case 'Evaluate':
                return mgCalculate.xReduce(sourceMg);
            case 'Factor':
                if (typeof mgCalculate.pFactor !== 'function') {
                    console.error("mgCalculate.pFactor function not found.");
                    throw new Error("Factor function missing");
                }
                return mgCalculate.pFactor(sourceMg);
            default:
                console.warn("Unknown MathGene command:", commandName);
                return sourceMg;
        }
    }
    else {
        console.error("No MathGene calculation library found globally.");
        throw new Error("MathGene calculation library missing");
    }
}

function applyMathGeneCommand(commandName, sourceLatex, targetMathFieldInstance) {
    console.log("applyMathGeneCommand called");
    console.log("Command:", commandName);
    console.log("Source LaTeX:", sourceLatex);
    console.log("Target MathField Instance:", targetMathFieldInstance);

    // Check for both MathGene interfaces - mgCalc or mgTrans/mgCalculate
    const hasMgCalc = typeof mgCalc !== 'undefined';
    const hasMgTransCalculate = typeof mgTrans !== 'undefined' && typeof mgCalculate !== 'undefined';
    
    if (!hasMgCalc && !hasMgTransCalculate) {
        console.error("No MathGene libraries found globally.");
        if (targetMathFieldInstance && targetMathFieldInstance.mathField) {
            targetMathFieldInstance.mathField.latex(`\\text{Error: MathGene not available}`);
        }
        return;
    }

    if (!sourceLatex || !targetMathFieldInstance || !targetMathFieldInstance.mathField) {
        console.error("Missing source LaTeX or target MathField instance.");
        if (targetMathFieldInstance && targetMathFieldInstance.mathField) {
            targetMathFieldInstance.mathField.latex(`\\text{Error: Invalid input}`);
        }
        return;
    }

    try {
        let sourceMg, resultMg, mathGeneResult;
        
        // Use mgCalc if available (like in equivalence.js)
        if (hasMgCalc) {
            // When using mgCalc, we don't need to convert from LaTeX - it handles it directly
            resultMg = executeMathGeneOperation(commandName, sourceLatex);
            
            // mgCalc returns an object with a latex property
            if (!resultMg || !resultMg.latex) {
                console.error("MathGene operation returned invalid result.");
                targetMathFieldInstance.mathField.latex(`\\text{Error: Invalid calculation result}`);
                return;
            }
            
            // Use the latex property directly
            const resultLatex = resultMg.latex;
            console.log("Result LaTeX:", resultLatex);
            targetMathFieldInstance.mathField.latex(resultLatex);
        }
        // Fall back to mgTrans/mgCalculate
        else if (hasMgTransCalculate) {
            sourceMg = mgTrans.texImport(sourceLatex);
            console.log("Source MG:", sourceMg);

            resultMg = executeMathGeneOperation(commandName, sourceMg);
            console.log("Result MG:", resultMg);

            if (resultMg === undefined || resultMg === null) {
                console.error("MathGene operation returned undefined or null.");
                targetMathFieldInstance.mathField.latex(`\\text{Error: Calculation failed}`);
                return;
            }

            mathGeneResult = mgTrans.Output(resultMg);

            if (!mathGeneResult || typeof mathGeneResult.latex === 'undefined') {
                console.error("mgTrans.Output did not return a valid result with a latex property.");
                const originalOutputAttempt = mgTrans.Output(sourceMg);
                const fallbackLatex = (originalOutputAttempt && originalOutputAttempt.latex) ? originalOutputAttempt.latex : sourceLatex;
                targetMathFieldInstance.mathField.latex(`\\text{Error: Output failed} \\; ${fallbackLatex}`);
                return;
            }

            const resultLatex = mathGeneResult.latex;
            console.log("Result LaTeX:", resultLatex);
            targetMathFieldInstance.mathField.latex(resultLatex);
        }
    } catch (error) {
        console.error("Error during MathGene processing:", error);
        const errorMessage = error.message || 'Processing failed';
        const escapedErrorMessage = errorMessage.replace(/\\/g, '\\textbackslash ').replace(/_/g, '\\_').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
        targetMathFieldInstance.mathField.latex(`\\text{Error: ${escapedErrorMessage}}`);
    }
}

class CommandOption {
  constructor(label, action) {
    this.label = label;
    this.action = action || (() => {}); 
  }
}

class CommandPalette {
  constructor() {
    this.paletteElement = this.createPaletteElement();
    this.inputElement = this.paletteElement.querySelector('.command-palette-input');
    this.optionsElement = this.paletteElement.querySelector('.command-palette-options');
    this.commands = [];
    this.selectedIndex = -1;
    this.filteredCommands = [];
    this.currentReferenceElement = null;
    this.lastFocusedMathField = null; // Track last focused math field
    this.setupEvents();
    
    document.addEventListener('click', (event) => {
      const mathField = event.target.closest('.math-field-container');
      if (mathField) {
        this.lastFocusedMathField = mathField;
      }
    });
  }

  createPaletteElement() {
    const modal = document.createElement('div');
    modal.className = 'command-palette-modal';
    modal.style.display = 'none';
    modal.id = 'command-palette';
    modal.innerHTML = `
      <div class="command-palette-content">
        <input class="command-palette-input" type="text" placeholder="Type a command..." />
        <div class="command-palette-options"></div>
      </div>
    `;
    document.body.appendChild(modal);
    
    return modal;
  }

  setupEvents() {
    this.inputElement.addEventListener('input', () => this.renderOptions());
    this.inputElement.addEventListener('keydown', (e) => {
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
    });
    
    document.addEventListener('mousedown', (e) => {
      if (this.paletteElement.style.display === 'block' && 
          !this.paletteElement.querySelector('.command-palette-content').contains(e.target) &&
          !e.target.classList.contains('command-palette-trigger')) {
        this.hide();
      }
    });
  }

  moveSelection(direction) {
    if (this.filteredCommands.length === 0) return;
    
    this.selectedIndex += direction;
    
    if (this.selectedIndex < 0) {
      this.selectedIndex = this.filteredCommands.length - 1;
    } else if (this.selectedIndex >= this.filteredCommands.length) {
      this.selectedIndex = 0;
    }
    
    this.updateSelectionVisual();
  }
  
  selectCurrent() {
    if (this.selectedIndex < 0 || this.selectedIndex >= this.filteredCommands.length) {
      this.hide();
      return;
    }

    const selectedCommand = this.filteredCommands[this.selectedIndex];
    const commandLabel = selectedCommand.label;

    let referenceContainer = this.currentReferenceElement?.closest('.math-field-container');
    
    if (!referenceContainer && this.lastFocusedMathField) {
      referenceContainer = this.lastFocusedMathField;
      console.log("Using fallback to last focused math field");
    }

    if (referenceContainer && referenceContainer.parentElement?.mathGroup) {
      const mathGroupInstance = referenceContainer.parentElement.mathGroup;
      const sourceLatex = referenceContainer.dataset.latex || '';

      const newMathFieldInstance = mathGroupInstance.insertMathFieldAfter(referenceContainer);

      newMathFieldInstance.mathField.latex(`\\text{Processing...}`);
      
      applyMathGeneCommand(commandLabel, sourceLatex, newMathFieldInstance);
    } else {
      console.warn("No reference math field found to apply command:", commandLabel);
      const notification = document.createElement('div');
      notification.textContent = `Please select a math field first before applying ${commandLabel}`;
      notification.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#f44336; color:white; padding:10px; border-radius:4px; z-index:9999;';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }

    this.hide();
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

  setCommands(cmds) {
    this.commands = cmds;
  }

  show(referenceElement = null) {
    this.currentReferenceElement = referenceElement;
    this.paletteElement.style.display = 'block';
    this.inputElement.value = '';
    this.selectedIndex = -1;
    this.inputElement.focus();
    this.renderOptions();
  }

  hide() {
    this.paletteElement.style.display = 'none';
    this.currentReferenceElement = null;
  }

  renderOptions() {
    const query = this.inputElement.value.toLowerCase();
    this.optionsElement.innerHTML = '';
    this.filteredCommands = this.commands.filter(c => c.label.toLowerCase().includes(query));
    this.selectedIndex = -1;

    this.filteredCommands.forEach((cmd, index) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'command-palette-option';
      optionEl.textContent = cmd.label;
      
      optionEl.addEventListener('mouseenter', () => {
        this.selectedIndex = index;
        this.updateSelectionVisual();
      });
      
      optionEl.addEventListener('click', () => {
        this.selectedIndex = index;
        this.selectCurrent();
      });
      
      this.optionsElement.appendChild(optionEl);
    });
    
    if (this.filteredCommands.length > 0) {
      this.selectedIndex = 0;
      this.updateSelectionVisual();
    }
  }
}

function closeCommandPalette() {
  const palette = document.getElementById('command-palette');
  if (palette && palette.style.display !== 'none') {
    palette.style.display = 'none';
  }
}

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeCommandPalette();
  }
  
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    const activeElement = document.activeElement;
    const refElement = activeElement?.closest('.math-field-container');
    window.commandPalette.show(refElement);
  }
});

window.commandPalette = new CommandPalette();
window.commandPalette.setCommands([
  new CommandOption('Simplify', () => {}),
  new CommandOption('Expand',   () => {}),
  new CommandOption('Evaluate', () => {}),
  new CommandOption('Factor',   () => {}),
  new CommandOption('Substitute', () => console.log('Substitute action (placeholder)')),
]);
