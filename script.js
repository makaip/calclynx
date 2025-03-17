document.addEventListener('DOMContentLoaded', () => {
  // Create and store MathBoard instance globally.
  window.mathBoard = new MathBoard();

  // Export data: triggers a JSON download.
  document.getElementById('exportBtn').addEventListener('click', () => {
    window.mathBoard.exportData();
  });

  // Import data: click triggers file input.
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importInput').click();
  });

  // When a file is chosen, read its contents and import the data.
  document.getElementById('importInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const jsonData = e.target.result;
          window.mathBoard.importData(jsonData);
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
