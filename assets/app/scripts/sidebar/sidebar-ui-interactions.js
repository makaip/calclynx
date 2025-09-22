document.addEventListener('DOMContentLoaded', () => {
    initializeSettingsHandler();
    initializeNewFileDropdown();
    initializeDocumentClickHandlers();

    initializeCreateBlankFileModal();
    initializeDeleteFileModal();
    initializeImageUrlModal();
    initializeRenameFileModal();
    initializeFileDownloadHandler();
});

const UIStateManager = {
    toggleVisibility(element, forceState = null) {
        if (!element) return;
        
        if (forceState !== null) {
            element.style.display = forceState ? 'block' : 'none';
        } else {
            element.style.display = element.style.display === 'block' ? 'none' : 'block';
        }
    },

    resetFormElements(container) {
        if (!container) return;
        
        const inputs = container.querySelectorAll('input[type="text"], input[type="email"], textarea');
        inputs.forEach(input => {
            input.value = '';
        });
        
        const errorMessages = container.querySelectorAll('.error-message, [id*="error"]');
        errorMessages.forEach(error => {
            error.textContent = '';
            error.style.display = 'none';
        });
        
        const buttons = container.querySelectorAll('button[type="submit"], .primary-button');
        buttons.forEach(button => {
            button.disabled = false;
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
            }
        });
    },

    focusFirstInput(container) {
        if (!container) return;
        
        const firstInput = container.querySelector('input[type="text"], input[type="email"], textarea');
        if (firstInput) {
            firstInput.focus();
        }
    }
};

function initializeSettingsHandler() {
    const settingsLink = document.getElementById('settings-link');
    const settingsModal = document.getElementById('settings-modal');
    
    if (!settingsLink || !settingsModal) {
        // settings elements not found, disable functionality
        return;
    }

    console.debug("Settings modal handler initialized");
    settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        UIStateManager.toggleVisibility(settingsModal, true);
        console.debug("Settings modal opened");
    });
}

function initializeNewFileDropdown() {
    const elements = {
        button: document.getElementById('newFileBtnSidebar'),
        dropdown: document.getElementById('newFileDropdownSidebar'),
        createBlankOption: document.getElementById('createBlankFileSidebarOpt'),
        createFromJsonOption: document.getElementById('createFromJsonSidebarOpt'),
        modal: document.getElementById('createBlankFileModal'),
        importInput: document.getElementById('importInput'),
        nameInput: document.getElementById('newBlankFileNameInput'),
        errorMessage: document.getElementById('createBlankFile-error-message'),
        confirmButton: document.getElementById('confirmCreateBlankFileButton')
    };

    if (!elements.button || !elements.dropdown) {
        // new file dropdown elements not found, disable functionality
        return;
    }

    console.debug("New file dropdown handler initialized");

    elements.button.addEventListener('click', (e) => {
        e.stopPropagation();
        UIStateManager.toggleVisibility(elements.dropdown);
    });

    if (elements.createBlankOption && elements.modal) {
        elements.createBlankOption.addEventListener('click', (e) => {
            e.preventDefault();
            UIStateManager.toggleVisibility(elements.dropdown, false);
            UIStateManager.resetFormElements(elements.modal);
            UIStateManager.toggleVisibility(elements.modal, true);
            UIStateManager.focusFirstInput(elements.modal);
            
            // Store original button text for reset functionality
            if (elements.confirmButton && !elements.confirmButton.dataset.originalText) {
                elements.confirmButton.dataset.originalText = elements.confirmButton.innerHTML;
            }
        });
    }
    
    if (elements.createFromJsonOption && elements.importInput) {
        elements.createFromJsonOption.addEventListener('click', (e) => {
            e.preventDefault();
            UIStateManager.toggleVisibility(elements.dropdown, false);
            elements.importInput.click();
        });
    }
}

function initializeDocumentClickHandlers() {
    const newFileBtnSidebar = document.getElementById('newFileBtnSidebar');
    const newFileDropdownSidebar = document.getElementById('newFileDropdownSidebar');

    document.addEventListener('click', (e) => {
        if (newFileDropdownSidebar && 
            newFileDropdownSidebar.style.display === 'block' &&
            newFileBtnSidebar &&
            !newFileBtnSidebar.contains(e.target) && 
            !newFileDropdownSidebar.contains(e.target)) {
            UIStateManager.toggleVisibility(newFileDropdownSidebar, false);
        }
    });
}