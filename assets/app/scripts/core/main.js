(() => {
  const App = {
    mathBoard: null,
    expressionEquivalence: null,
  };

  const getById = (id) => document.getElementById(id);

  const readFileAsText = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const isModifierPressed = (e) =>
    (navigator.platform.toUpperCase().includes('MAC') ? e.metaKey : e.ctrlKey);

  const isInInput = (target) =>
    Boolean(
      target.closest('.image-url-input') ||
      target.closest('.command-palette-input') ||
      target.closest('.text-editor')
    );

  const setupImportInput = (el) => {
    if (!el) return;
    el.addEventListener('change', async (evt) => {
      const file = evt.target.files?.[0];
      if (file) {
        try {
          const jsonData = await readFileAsText(file);
          App.mathBoard?.fileManager?.importData(jsonData);
        } catch (err) {
          console.error('Error reading JSON file:', err);
        }
      }
      // reset to allow re-uploading same file
      evt.target.value = '';
    });
  };

  const showCommandPalette = () => {
    if (window.commandPalette && typeof window.commandPalette.show === 'function') {
      const refElement = document.activeElement?.closest('.math-field-container');
      window.commandPalette.show(refElement);
    }
  }; 

  const showImageUrlInput = () => {
    if (window.showImageUrlModal && typeof window.showImageUrlModal === 'function') {
      window.showImageUrlModal((url) => {
        const { x: mx, y: my } = App.mathBoard?.mouse ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const coords = App.mathBoard ? App.mathBoard.screenToCanvas(mx, my) : { x: 100, y: 100 };
        const imageGroup = new ImageGroup(App.mathBoard, coords.x, coords.y);
        imageGroup.setImageUrl(url);
        App.mathBoard.fileManager.saveState();
      });
    }
  };

  const onKeyDown = (e) => {
    const modifier = isModifierPressed(e);
    if (!modifier) return;

    if (isInInput(e.target)) return;

    if (e.key === 'k' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      showCommandPalette();
      return;
    }

    if (e.key === 'i' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      showImageUrlInput();
    }
  };

  window.updateUserStatus = null;

  document.addEventListener('DOMContentLoaded', () => {
    App.mathBoard = new MathBoard();
    App.expressionEquivalence = new ExpressionEquivalence();

    window.App = App;
    window.mathBoard = App.mathBoard; // expose for backwards compatibility
    window.initializeMathSupportForTextFields = () => {
      document.querySelectorAll('.text-field-container').forEach((container) => {
        const tf = container.textFieldInstance;
        if (tf?.initializeMathSupport) tf.initializeMathSupport();
      });
    };

    setupImportInput(getById('importInput'));

    // Capture phase so we intercept before other handlers
    document.addEventListener('keydown', onKeyDown, true);
    supabaseClient.auth.onAuthStateChange(() => {
      window.updateUserStatus?.();
    });

    window.updateUserStatus?.();
  });

  async function updateUserStatus() {
    const userEmailDisplay = getById('user-email-display');
    const authButton = getById('auth-button');

    if (!userEmailDisplay || !authButton) return;

    if (typeof window.loadUserFiles === 'function') window.loadUserFiles();

    try {
      const { data: { session } = {}, error } =
        (await supabaseClient.auth.getSession()) || {};

      if (error) {
        console.error('Error getting session:', error);
        userEmailDisplay.textContent = '';
        return;
      }

      if (session?.user) {
        const userEmail = session.user.email ?? '';
        userEmailDisplay.textContent = userEmail;
        userEmailDisplay.title = userEmail;

        authButton.textContent = 'Sign Out';
        authButton.onclick = async (evt) => {
          evt.preventDefault();
          try {
            authButton.disabled = true;
            authButton.textContent = 'Signing Out...';
            await supabaseClient.auth.signOut();
            // onAuthStateChange will refresh UI
          } catch (err) {
            console.error('Error signing out:', err);
            alert('Error signing out. Please try again.');
            authButton.disabled = false;
            authButton.textContent = 'Sign Out';
          }
        };
      } else {
        userEmailDisplay.textContent = '';
        userEmailDisplay.title = '';
        authButton.textContent = 'Sign In';
        authButton.onclick = (evt) => {
          evt.preventDefault();
          window.location.href = '/login.html';
        };
      }
    } catch (err) {
      console.error('Exception checking auth status:', err);
      userEmailDisplay.textContent = '';
    }
  }

  window.updateUserStatus = updateUserStatus;
  App.updateUserStatus = updateUserStatus;
  window.App = App;
})();
