// script.js
document.addEventListener('DOMContentLoaded', () => {
  // Create and store MathBoard instance globally.
  window.mathBoard = new MathBoard();

  // Create a global VersionManager instance
  window.versionManager = new VersionManager(window.mathBoard.fileManager);

  // Example: Save an initial state snapshot.
  window.versionManager.saveState();

  // New Hamburger Menu Logic (existing code) ...
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('menu');

  // Toggle menu display when clicking the hamburger button.
  hamburgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  });

  // Hide the menu when clicking outside the menu container.
  document.addEventListener('click', (e) => {
    if (!document.getElementById('menu-container').contains(e.target)) {
      menu.style.display = 'none';
    }
  });

  // Export JSON functionality.
  document.getElementById('exportOption').addEventListener('click', () => {
    window.mathBoard.fileManager.exportData();
    menu.style.display = 'none';
  });

  // Import JSON functionality.
  document.getElementById('importOption').addEventListener('click', () => {
    document.getElementById('importInput').click();
    menu.style.display = 'none';
  });

  // When a file is chosen, read its contents and import the data.
  document.getElementById('importInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const jsonData = e.target.result;
          window.mathBoard.fileManager.importData(jsonData);
          // Save state after import
          window.versionManager.saveState();
        } catch (err) {
          console.error("Error reading JSON file:", err);
        }
      };
      reader.readAsText(file);
    }
    // Reset the file input for future uploads.
    event.target.value = '';
  });

  // Listen for keyboard shortcuts to trigger undo (Ctrl+Z) and redo (Ctrl+Y).
  document.addEventListener('keydown', (e) => {
    // Check if the active element is editable.
    const activeEl = document.activeElement;
    const isEditable = activeEl &&
      (activeEl.tagName === 'INPUT' ||
       activeEl.tagName === 'TEXTAREA' ||
       activeEl.isContentEditable ||
       activeEl.classList.contains('mq-editable-field'));
    
    if (isEditable) {
      // Allow native behavior inside text fields.
      return;
    }
  
    if (e.ctrlKey && e.key === 'z') { // Ctrl+Z for Undo
      e.preventDefault();
      window.versionManager.undo();
    } else if (e.ctrlKey && e.key === 'y') { // Ctrl+Y for Redo
      e.preventDefault();
      window.versionManager.redo();
    }
  });
  
});
