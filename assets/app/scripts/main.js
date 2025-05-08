// script.js
document.addEventListener('DOMContentLoaded', () => {
  // Create and store MathBoard instance globally.
  window.mathBoard = new MathBoard();

  // Create a global VersionManager instance
  window.versionManager = new VersionManager(window.mathBoard.fileManager);

  // Instantiate ExpressionEquivalence after other initializations and DOM ready
  // Ensure MathGene scripts have had time to load.
  if (typeof ExpressionEquivalence !== 'undefined') {
    window.expressionEquivalence = new ExpressionEquivalence();
  } else {
    console.error("ExpressionEquivalence class not found. Check script loading order.");
  }

  // Example: Save an initial state snapshot.
  window.versionManager.saveState(); // This will now trigger the equivalence check if expressionEquivalence was created

  // Detect if user is on a Mac
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Get the hamburger button element (but don't add listeners)
  const hamburgerBtn = document.getElementById('hamburgerBtn');

  // Import JSON file handling (keep this if import is triggered elsewhere)
  const importInput = document.getElementById('importInput');
  importInput.addEventListener('change', (event) => {
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

  // Command Palette Initialization
  const commandPalette = new CommandPalette(window.mathBoard);
  // Add trigger for command palette (e.g., Ctrl+Shift+P or Cmd+Shift+P)
  document.addEventListener('keydown', (e) => {
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    if (modifier && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      commandPalette.show();
    }
  });

  // Initialize context menu (assuming contextmenu.js is loaded)
  if (typeof ContextMenu !== 'undefined') {
    // The context menu initialization is handled within contextmenu.js
  } else {
    console.error("ContextMenu class not found. Check script loading order.");
  }

  // Initialize navigation features
  if (typeof Navigation !== 'undefined') {
    window.navigation = new Navigation(window.mathBoard);
  } else {
    console.error("Navigation class not found. Check script loading order.");
  }

  // Initialize version manager UI (if applicable)
  // Example: window.versionManager.initializeUI();

  // Update user status display
  updateUserStatus();

  // Listen for auth state changes (e.g., login/logout in another tab)
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    console.log("Auth state changed:", _event, session);
    updateUserStatus();
    // Reload file list in the sidebar
    if (typeof window.loadUserFiles === 'function') {
        window.loadUserFiles();
    }
  });

  // Load file data if fileId is present in URL using the correct method
  window.mathBoard.fileManager.loadState(); // Corrected function call

}); // End DOMContentLoaded

// Function to update user status in the sidebar footer
async function updateUserStatus() {
  const userStatusTextElement = document.getElementById('user-status-text');
  if (!userStatusTextElement) return;

  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Error getting session:", error);
      userStatusTextElement.textContent = 'Error loading status';
      return;
    }

    if (session && session.user) {
      // User is logged in
      const userEmail = session.user.email;
      userStatusTextElement.textContent = `Logged in as ${userEmail}`;
      userStatusTextElement.title = `Logged in as ${userEmail}`; // Add title for full email on hover
    } else {
      // User is not logged in
      userStatusTextElement.textContent = 'Log in to save your work';
      userStatusTextElement.title = ''; // Clear title
    }
  } catch (err) {
    console.error("Exception checking auth status:", err);
    userStatusTextElement.textContent = 'Error loading status';
  }
}
