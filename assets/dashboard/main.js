import { initializeAuthButtons, checkAuthAndLoadFiles } from './auth.js';
import { initializeFileModals } from './fileManager.js';
// Note: initializeCheckboxLogic is called within renderFiles in fileManager.js

// --- DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Dashboard DOM loaded.");

    // Initialize authentication buttons (like Sign Out)
    initializeAuthButtons();

    // Initialize modal interactions (New File, Delete File)
    initializeFileModals();

    // Check authentication status and load initial files
    // This will also trigger the first render and checkbox initialization via fetchUserFiles -> renderFiles
    checkAuthAndLoadFiles();

    // Other initializations can go here (e.g., search bar logic if added later)
});
