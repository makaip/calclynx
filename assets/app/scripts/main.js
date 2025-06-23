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
    // The call to loadUserFiles() is now handled within updateUserStatus()
  });

  // Load file data if fileId is present in URL using the correct method
  window.mathBoard.fileManager.loadState(); // Corrected function call

}); // End DOMContentLoaded

// Function to update user status in the sidebar footer
async function updateUserStatus() {
  const userEmailDisplay = document.getElementById('user-email-display');
  const authButton = document.getElementById('auth-button');

  if (!userEmailDisplay || !authButton) return;

  // Whenever status is updated, also reload the file list.
  // loadUserFiles has its own check for the user session.
  if (typeof window.loadUserFiles === 'function') {
    window.loadUserFiles();
  }

  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Error getting session:", error);
      userEmailDisplay.textContent = '';
      return;
    }

    if (session && session.user) {
      // User is logged in
      const userEmail = session.user.email;
      
      // Update email display
      userEmailDisplay.textContent = userEmail;
      userEmailDisplay.title = userEmail; // Add title for full email on hover
      
      // Update auth button to show Sign Out
      authButton.textContent = "Sign Out";
      authButton.onclick = async (e) => {
        e.preventDefault();
        try {
          authButton.disabled = true;
          authButton.textContent = "Signing Out...";
          await supabaseClient.auth.signOut();
          // Redirect will happen via onAuthStateChange listener
        } catch (err) {
          console.error("Error signing out:", err);
          alert("Error signing out. Please try again.");
          authButton.disabled = false;
          authButton.textContent = "Sign Out";
        }
      };
    } else {
      // User is not logged in
      userEmailDisplay.textContent = '';
      userEmailDisplay.title = ''; // Clear title
      
      // Update auth button to show Sign In
      authButton.textContent = "Sign In";
      authButton.onclick = (e) => {
        e.preventDefault();
        window.location.href = '/login.html';
      };
    }
  } catch (err) {
    console.error("Exception checking auth status:", err);
    userEmailDisplay.textContent = '';
  }
}
