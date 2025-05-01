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
    // Hide on Escape
    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
  }

  setCommands(cmds) {
    this.commands = cmds;
  }

  show() {
    this.paletteElement.style.display = 'block';
    this.inputElement.value = '';
    this.inputElement.focus();
    this.renderOptions();
  }

  hide() {
    this.paletteElement.style.display = 'none';
  }

  renderOptions() {
    const query = this.inputElement.value.toLowerCase();
    this.optionsElement.innerHTML = '';
    const filtered = this.commands.filter(c => c.label.toLowerCase().includes(query));

    filtered.forEach(cmd => {
      const optionEl = document.createElement('div');
      optionEl.className = 'command-palette-option';
      optionEl.textContent = cmd.label;
      optionEl.addEventListener('click', () => {
        cmd.action();
        this.hide();
      });
      this.optionsElement.appendChild(optionEl);
    });
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
});

// Event listener for clicks outside the command palette
document.addEventListener('click', function(event) {
  const palette = document.getElementById('command-palette');
  if (palette && !palette.contains(event.target) && 
      !event.target.classList.contains('command-palette-trigger')) {
    closeCommandPalette();
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
