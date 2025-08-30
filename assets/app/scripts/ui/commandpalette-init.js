function closeCommandPalette() {
  if (window.commandPalette && window.commandPalette.paletteElement.style.display !== 'none') {
    window.commandPalette.hide();
  }
}

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeCommandPalette();
  }
  
  // Check if commandPalette is initialized before trying to show it
  if ((event.ctrlKey || event.metaKey) && event.key === 'k' && window.commandPalette) {
    event.preventDefault();
    const activeElement = document.activeElement;
    const refElement = activeElement?.closest('.math-field-container');
    window.commandPalette.show(refElement);
  }
});

// Ensure CommandPalette class is defined (from commandpalette.js)
// and CommandOption is defined (from commandpalette-helpers.js)
if (typeof CommandPalette !== 'undefined' && typeof CommandOption !== 'undefined') {
  window.commandPalette = new CommandPalette();
  window.commandPalette.setCommands([
    new CommandOption('Simplify', () => {}),
    new CommandOption('Expand',   () => {}),
    new CommandOption('Solve for', () => {}), // Action is handled internally by selectCurrent
    new CommandOption('Derivative with respect to', () => {}), // Action is handled internally by selectCurrent
    new CommandOption('Factor',   () => {}),
  ]);
} else {
  console.error("CommandPalette or CommandOption class not defined. Check script loading order.");
}
