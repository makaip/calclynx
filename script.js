// script.js
document.addEventListener('DOMContentLoaded', () => {
  // Create and store MathBoard instance globally.
  window.mathBoard = new MathBoard();

  // ----- New Hamburger Menu Logic -----
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
        } catch (err) {
          console.error("Error reading JSON file:", err);
        }
      };
      reader.readAsText(file);
    }
    // Reset the file input for future uploads.
    event.target.value = '';
  });

});
