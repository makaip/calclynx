class CommandOption {
  constructor(label, action) {
    this.label = label;
    this.action = action;
  }
}

class CommandPalette {
  constructor() {
    this.paletteElement = this.createPaletteElement();
    this.inputElement = this.paletteElement.querySelector('.command-palette-input');
    this.optionsElement = this.paletteElement.querySelector('.command-palette-options');
    this.commands = [];
    this.selectedIndex = -1; // Track the selected option
    this.filteredCommands = []; // Store filtered commands
    this.setupEvents();
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
    // Handle search
    this.inputElement.addEventListener('input', () => this.renderOptions());
    
    // Handle keyboard navigation
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
    
    // Make sure the modal closes when clicking outside
    document.addEventListener('mousedown', (e) => {
      if (this.paletteElement.style.display === 'block' && 
          !this.paletteElement.querySelector('.command-palette-content').contains(e.target) &&
          !e.target.classList.contains('command-palette-trigger')) {
        this.hide();
      }
    });
  }

  // Method to move selection up or down
  moveSelection(direction) {
    if (this.filteredCommands.length === 0) return;
    
    this.selectedIndex += direction;
    
    // Handle wrapping
    if (this.selectedIndex < 0) {
      this.selectedIndex = this.filteredCommands.length - 1;
    } else if (this.selectedIndex >= this.filteredCommands.length) {
      this.selectedIndex = 0;
    }
    
    this.updateSelectionVisual();
  }
  
  // Method to select the current option
  selectCurrent() {
    if (this.filteredCommands.length === 0) return;
    
    // If no option is selected, use the first option
    const indexToSelect = this.selectedIndex === -1 ? 0 : this.selectedIndex;
    
    if (indexToSelect >= 0 && indexToSelect < this.filteredCommands.length) {
      const selectedCommand = this.filteredCommands[indexToSelect];
      selectedCommand.action();
      const focusedField = document.querySelector('.mq-focused')?.closest('.math-field-container');
      const referenceContainer = focusedField 
        || document.querySelector('.math-field-container.selected-field');
      if (referenceContainer && referenceContainer.parentElement?.mathGroup) {
        referenceContainer.parentElement.mathGroup.insertMathFieldAfter(referenceContainer);
      }
      this.hide();
    }
  }
  
  // Update the visual selection indicator
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

  show() {
    this.paletteElement.style.display = 'block';
    this.inputElement.value = '';
    this.selectedIndex = -1; // Reset selection
    this.inputElement.focus();
    this.renderOptions();
  }

  hide() {
    this.paletteElement.style.display = 'none';
  }

  renderOptions() {
    const query = this.inputElement.value.toLowerCase();
    this.optionsElement.innerHTML = '';
    this.filteredCommands = this.commands.filter(c => c.label.toLowerCase().includes(query));
    this.selectedIndex = -1; // Reset selection when filtering changes

    this.filteredCommands.forEach((cmd, index) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'command-palette-option';
      optionEl.textContent = cmd.label;
      
      // Add hover effect to change selection
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
    
    // Initialize first item as selected if available
    if (this.filteredCommands.length > 0) {
      this.selectedIndex = 0;
      this.updateSelectionVisual();
    }
  }
}

// Function to close the command palette
function closeCommandPalette() {
  const palette = document.getElementById('command-palette');
  if (palette && palette.style.display !== 'none') {
    palette.style.display = 'none';
  }
}

// Event listener for Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeCommandPalette();
  }
  
  // Add keyboard shortcut for command palette (Ctrl+K or Cmd+K)
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault(); // Prevent browser's default behavior
    window.commandPalette.show();
  }
});

// Provide a global instance to be used in main.js or elsewhere
window.commandPalette = new CommandPalette();
// Default commands can be easily changed or extended
window.commandPalette.setCommands([
  new CommandOption('Simplify', () => console.log('Simplify action')),
  new CommandOption('Expand',   () => console.log('Expand action')),
  new CommandOption('Evaluate', () => console.log('Evaluate action')),
  new CommandOption('Factor',   () => console.log('Factor action')),
  new CommandOption('Substitute', () => console.log('Substitute action')),
]);
