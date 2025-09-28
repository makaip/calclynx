import { MathBoard } from './canvas.js';
import { ExpressionEquivalence } from '../utils/equivalence.js';
import { TextFieldCompatibility } from '../text/textfield-compatibility.js';
import { ImageGroup } from '../image/imagegroup.js';
import { supabaseClient } from '../auth/initsupabaseapp.js';
import { loadUserFiles } from '../sidebar/sidebar.js';
import { TextFormatToolbar } from '../ui/toolbar.js';

const App = {
  mathBoard: null,
  expressionEquivalence: null,
};

const getById = (id) => document.getElementById(id);

const initializeApp = () => {
  if (TextFieldCompatibility.shouldUseProseMirror()) {
    App.mathBoard = new MathBoard();
    App.expressionEquivalence = new ExpressionEquivalence();
  } else {
    setTimeout(initializeApp, 100);
  }
};

async function updateUserStatus() {
  const userEmailDisplay = getById('user-email-display');
  const authButton = getById('auth-button');

  if (!userEmailDisplay || !authButton) return;

  loadUserFiles();

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

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });

const isModifierPressed = (e) => (navigator.platform.toUpperCase().includes('MAC') ? e.metaKey : e.ctrlKey);

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

        try {
          JSON.parse(jsonData);
        } catch (parseError) {
          alert('The selected file does not contain valid JSON. Please check the file format and try again.');
          return;
        }
        
        if (window.isCreateFromJsonMode) {
          window.pendingJsonData = jsonData;
          window.isCreateFromJsonMode = false;
          
          const modal = document.getElementById('createFromJsonModal');
          const input = document.getElementById('newJsonFileNameInput');
          const errorMsg = document.getElementById('createFromJson-error-message');
          
          if (modal) {
            modal.style.display = 'block';
            if (input) {
              input.value = '';
              input.focus();
            }
            if (errorMsg) {
              errorMsg.style.display = 'none';
              errorMsg.textContent = '';
            }
          }
        } else {
          App.mathBoard?.fileManager?.importData(jsonData);
        }
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
      if (!App?.mathBoard) return;
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

function initializeAppCore() {
  initializeApp();

  // Note: Removed global assignments - use proper imports instead

  setupImportInput(getById('importInput'));

  // Capture phase so we intercept before other handlers
  document.addEventListener('keydown', onKeyDown, true);
  supabaseClient.auth.onAuthStateChange(() => {
    updateUserStatus();
  });

  updateUserStatus();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeAppCore();
});

// Set up internal references
App.updateUserStatus = updateUserStatus;

export { App, updateUserStatus, initializeApp };
export default { App, updateUserStatus, initializeApp };
