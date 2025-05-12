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
    this.variableInputMode = false;
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
    console.log("selectCurrent called with input:", this.inputElement.value);
    const typedInput = this.inputElement.value.trim();
    
    // Special case: User typed "Solve for x" but no command is selected
    if (this.selectedIndex < 0 && typedInput.toLowerCase().startsWith('solve for ')) {
      console.log("No selection but detected 'Solve for x' pattern - proceeding anyway");
      const variable = typedInput.substring('solve for '.length).trim();
      
      if (variable) {
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
          
          console.log(`Directly solving for variable: ${variable}`);
          applyMathGeneCommand(typedInput, sourceLatex, newMathFieldInstance);
          this.hide();
          return;
        }
      }
      
      // If we got here, we couldn't process the command
      console.log("Couldn't process Solve command with no reference container");
      this.hide();
      return;
    }
    
    if (this.selectedIndex < 0 || this.selectedIndex >= this.filteredCommands.length) {
      console.log("No valid selection index, hiding palette");
      this.hide();
      return;
    }

    const selectedCommand = this.filteredCommands[this.selectedIndex];
    const commandLabel = selectedCommand.label;
    
    console.log("Selected command:", commandLabel);
    console.log("Typed input:", typedInput);
    console.log("Variable input mode:", this.variableInputMode);

    // Check if the user directly typed a complete "Solve for x" command
    if (typedInput.toLowerCase().startsWith('solve for ') && !this.variableInputMode) {
      console.log("Detected direct 'Solve for x' input pattern");
      // User directly typed "Solve for x" - extract variable and process
      const variable = typedInput.substring('solve for '.length).trim();
      console.log("Extracted variable:", variable);
      
      if (variable) {
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
          
          console.log(`Directly solving for variable: ${variable}`);
          applyMathGeneCommand(typedInput, sourceLatex, newMathFieldInstance);
          this.hide();
          return;
        } else {
          console.warn("No reference container found for solve operation");
        }
      }
    }

    // Handle "Solve for" special case (when selected from list but no variable yet)
    if (commandLabel === 'Solve for' && !this.variableInputMode) {
      this.inputElement.value = 'Solve for ';
      this.inputElement.classList.add('variable-input-mode');
      this.variableInputMode = true;
      this.inputElement.focus();
      
      // Position cursor at the right position
      const cursorPosition = 'Solve for '.length;
      this.inputElement.setSelectionRange(cursorPosition, cursorPosition);
      return;
    }

    // If we're in variable input mode and Enter is pressed
    if (this.variableInputMode) {
      const variable = typedInput.substring('Solve for '.length).trim();
      
      if (!variable) {
        // If no variable provided, just remind the user
        this.inputElement.classList.add('error');
        setTimeout(() => this.inputElement.classList.remove('error'), 500);
        return;
      }
      
      // Variable is entered, proceed with solving
      this.variableInputMode = false;
      this.inputElement.classList.remove('variable-input-mode');
      
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
        
        // Pass the full "Solve for variable" command to be processed
        console.log(`Solving for variable: ${variable}`);
        applyMathGeneCommand(`Solve for ${variable}`, sourceLatex, newMathFieldInstance);
      } else {
        console.warn("No reference math field found to apply Solve for:", variable);
        const notification = document.createElement('div');
        notification.textContent = `Please select a math field first before solving for ${variable}`;
        notification.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#f44336; color:white; padding:10px; border-radius:4px; z-index:9999;';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      }

      this.hide();
      return;
    }

    // For commands other than "Solve for variable"
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
      
      // Use the command label from the selection instead of typed input for standard commands
      console.log(`Processing standard command: ${commandLabel}`);
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
    this.variableInputMode = false;
    this.inputElement.classList.remove('variable-input-mode');
  }

  renderOptions() {
    const query = this.inputElement.value.toLowerCase();
    console.log("Rendering options for query:", query);
    this.optionsElement.innerHTML = '';
    
    // Special case for "Solve for x" - keep the "Solve for" command visible
    if (query.startsWith('solve for ') && query.length > 'solve for '.length) {
      console.log("Special case: keeping 'Solve for' command for solve operation");
      this.filteredCommands = this.commands.filter(c => 
        c.label.toLowerCase() === 'solve for' || c.label.toLowerCase().includes(query)
      );
    } else {
      this.filteredCommands = this.commands.filter(c => c.label.toLowerCase().includes(query));
    }
    
    console.log("Filtered commands:", this.filteredCommands.map(c => c.label));
    this.selectedIndex = -1;

    this.filteredCommands.forEach((cmd, index) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'command-palette-option';
      if (cmd.label.toLowerCase() === 'solve for') {
        optionEl.innerHTML = 'Solve for <span class="solve-for-variable">variable</span>';
      } else {
        optionEl.textContent = cmd.label;
      }
      
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
