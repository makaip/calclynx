// This file handles UI interactions like the "New File" dropdown and settings modal toggle.

document.addEventListener('DOMContentLoaded', () => {
    // --- Settings link handler ---
    const settingsLink = document.getElementById('settings-link');
    const settingsModal = document.getElementById('settings-modal');
    
    if (settingsLink && settingsModal) {
        settingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            settingsModal.style.display = 'block';
        });
    }

    // --- New File Dropdown Logic ---
    const newFileBtnSidebar = document.getElementById('newFileBtnSidebar');
    const newFileDropdownSidebar = document.getElementById('newFileDropdownSidebar');
    const createBlankFileOpt = document.getElementById('createBlankFileSidebarOpt'); // From sidebar.html
    const createFromJsonOpt = document.getElementById('createFromJsonSidebarOpt'); // From sidebar.html
    const createBlankFileModal = document.getElementById('createBlankFileModal'); // Modal itself
    const importInput = document.getElementById('importInput'); // Used by "From JSON"
    const newBlankFileNameInput = document.getElementById('newBlankFileNameInput'); // Input in the modal
    const createBlankFileErrorMsg = document.getElementById('createBlankFile-error-message'); // Error message in modal
    const confirmCreateBlankFileBtn = document.getElementById('confirmCreateBlankFileButton'); // Confirm button in modal


    if (newFileBtnSidebar && newFileDropdownSidebar) {
        newFileBtnSidebar.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from bubbling to document
            newFileDropdownSidebar.style.display = newFileDropdownSidebar.style.display === 'block' ? 'none' : 'block';
        });
    }

    if (createBlankFileOpt && createBlankFileModal) {
        createBlankFileOpt.addEventListener('click', (e) => {
            e.preventDefault();
            if (newFileDropdownSidebar) newFileDropdownSidebar.style.display = 'none';
            if (createBlankFileModal) createBlankFileModal.style.display = 'block';
            if (newBlankFileNameInput) {
                newBlankFileNameInput.value = ''; // Clear previous input
                newBlankFileNameInput.focus();
            }
            if (createBlankFileErrorMsg) {
                createBlankFileErrorMsg.textContent = '';
                createBlankFileErrorMsg.style.display = 'none';
            }
            // Reset button state
            if (confirmCreateBlankFileBtn) {
                confirmCreateBlankFileBtn.disabled = false;
                confirmCreateBlankFileBtn.innerHTML = 'Create File';
            }
        });
    }
    
    if (createFromJsonOpt && importInput) {
        createFromJsonOpt.addEventListener('click', (e) => {
            e.preventDefault();
            if (newFileDropdownSidebar) newFileDropdownSidebar.style.display = 'none';
            importInput.click(); // Trigger the hidden file input
        });
    }

    // Consolidated click listener to close dropdowns/menus (specific to sidebar UI elements)
    // This is separate from the one in sidebar.js that handles file action menus
    document.addEventListener('click', (e) => {
        // Close new file dropdown
        if (newFileDropdownSidebar && newFileDropdownSidebar.style.display === 'block') {
            if (newFileBtnSidebar && !newFileBtnSidebar.contains(e.target) && !newFileDropdownSidebar.contains(e.target)) {
                newFileDropdownSidebar.style.display = 'none';
            }
        }
    });
});
