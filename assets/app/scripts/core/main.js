document.addEventListener('DOMContentLoaded', () => {

  window.mathBoard = new MathBoard();
  window.expressionEquivalence = new ExpressionEquivalence();

  // Initialize math support for text fields
  window.initializeMathSupportForTextFields = function() {
    document.querySelectorAll('.text-field-container').forEach(container => {
      const textField = container.textFieldInstance;
      if (textField && typeof textField.initializeMathSupport === 'function') {
        textField.initializeMathSupport();
      }
    });
  };

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
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

  // Set up keyboard shortcuts early to prevent browser defaults
  document.addEventListener('keydown', (e) => {
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    
    // Check if we're currently in an input field that should handle its own events
    // Removed .mq-editable-field to allow command palette to work in mathfields
    const isInInput = e.target.closest('.image-url-input') || 
                      e.target.closest('.command-palette-input') ||
                      e.target.closest('.text-editor');
    
    // Command Palette shortcut (Ctrl+K only) - handle early to prevent browser default
    if (modifier && e.key === 'k' && !e.shiftKey && !e.altKey && !isInInput) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      console.log('Command palette keyboard shortcut triggered!');
      
      // Use the global command palette instance created by modular-init.js
      // Wait for initialization if needed with more robust retry mechanism
      let retryCount = 0;
      const maxRetries = 50; // Try for up to 500ms
      
      const tryShowCommandPalette = () => {
        retryCount++;
        if (window.commandPalette && typeof window.commandPalette.show === 'function') {
          console.log('Command palette found, showing...');
          const activeElement = document.activeElement;
          const refElement = activeElement?.closest('.math-field-container');
          window.commandPalette.show(refElement);
        } else if (retryCount < maxRetries) {
          console.log(`Command palette not ready yet, retrying... (${retryCount}/${maxRetries})`);
          // If not ready yet, try again in a short moment
          setTimeout(tryShowCommandPalette, 10);
        } else {
          console.error('Command palette failed to initialize after maximum retries');
          // Fallback: try to initialize the modular system manually
          if (typeof initializeModularSystem === 'function') {
            console.log('Attempting manual modular system initialization...');
            initializeModularSystem();
            setTimeout(() => {
              if (window.commandPalette && typeof window.commandPalette.show === 'function') {
                const activeElement = document.activeElement;
                const refElement = activeElement?.closest('.math-field-container');
                window.commandPalette.show(refElement);
              }
            }, 50);
          }
        }
      };
      tryShowCommandPalette();
      return false; // Additional prevention
    }
    
    // Add trigger for image URL input (Ctrl/Cmd + I)
    if (modifier && e.key === 'i' && !e.shiftKey && !e.altKey && !isInInput) {
      e.preventDefault();
      const tryShowImageInput = () => {
        if (window.imageUrlInput) {
          window.imageUrlInput.show((url) => {
            // Use current mouse position or center of screen if no mouse position available
            const coords = window.mathBoard ? 
              window.mathBoard.screenToCanvas(window.mathBoard.mouseX || window.innerWidth / 2, window.mathBoard.mouseY || window.innerHeight / 2) :
              { x: 100, y: 100 };
            const imageGroup = new ImageGroup(window.mathBoard, coords.x, coords.y);
            imageGroup.setImageUrl(url);
          });
        } else {
          // If not ready yet, try again in a short moment
          setTimeout(tryShowImageInput, 10);
        }
      };
      tryShowImageInput();
    }
  }, true); // Use capture phase to handle before other listeners

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