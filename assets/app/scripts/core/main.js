// script.js
document.addEventListener('DOMContentLoaded', () => {
  // Create and store MathBoard instance globally.
  window.mathBoard = new MathBoard();

  // Initialize ExpressionEquivalence and related systems
  if (typeof ExpressionEquivalence !== 'undefined') {
    window.expressionEquivalence = new ExpressionEquivalence();
  } else {
    console.error("ExpressionEquivalence class not found. Check script loading order.");
  }

  // Add global function to initialize math support for text fields
  window.initializeMathSupportForTextFields = function() {
    document.querySelectorAll('.text-field-container').forEach(container => {
      const textField = container.textFieldInstance;
      if (textField && typeof textField.initializeMathSupport === 'function') {
        textField.initializeMathSupport();
      }
    });
  };

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
    
    // Check if we're currently in an input field that should handle its own events
    const isInInput = e.target.closest('.image-url-input') || 
                      e.target.closest('.command-palette-input') ||
                      e.target.closest('.text-editor') ||
                      e.target.closest('.mq-editable-field');
    
    if (modifier && e.shiftKey && e.key === 'P' && !isInInput) {
      e.preventDefault();
      commandPalette.show();
    }
    
    // Add trigger for image URL input (Ctrl/Cmd + I)
    if (modifier && e.key === 'i' && !e.shiftKey && !e.altKey && !isInInput) {
      e.preventDefault();
      window.imageUrlInput.show((url) => {
        // Use current mouse position or center of screen if no mouse position available
        const coords = window.mathBoard ? 
          window.mathBoard.screenToCanvas(window.mathBoard.mouseX || window.innerWidth / 2, window.mathBoard.mouseY || window.innerHeight / 2) :
          { x: 100, y: 100 };
        const imageGroup = new ImageGroup(window.mathBoard, coords.x, coords.y);
        imageGroup.setImageUrl(url);
      });
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

  // Update user status display
  updateUserStatus();

  // Listen for auth state changes (e.g., login/logout in another tab)
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    console.log("Auth state changed:", _event, session);
    updateUserStatus();
    // The call to loadUserFiles() is now handled within updateUserStatus()
  });

  // File loading is handled in the MathBoard constructor
  // No need to call loadState() again here

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