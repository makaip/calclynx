document.addEventListener('DOMContentLoaded', () => {
    initializeSettingsHandler();
    initializeCreateBlankFileModal();
    initializeDeleteFileModal();
    initializeImageUrlModal();
    initializeRenameFileModal();
    initializeFileDownloadHandler();
    initializeEventDelegation();
});

function initializeEventDelegation() {
    document.addEventListener('click', (e) => {
        const target = e.target;
        
        if (target.matches('.modal-close, .modal-cancel')) {
            const modal = target.closest('.modal');
            if (modal) hideModal(modal);
            return;
        }
        
        const newFileBtn = target.closest('#newFileBtnSidebar');
        if (newFileBtn) {
            e.preventDefault();
            toggleNewFileDropdown();
            return;
        }
        
        const actionsBtn = target.closest('.file-actions-button');
        if (actionsBtn) {
            e.preventDefault();
            toggleFileActionMenu(actionsBtn);
            return;
        }
        
        const settingsLink = target.closest('#settings-link');
        if (settingsLink) {
            e.preventDefault();
            showModal(document.getElementById('settings-modal'));
            return;
        }
        
        const renameLink = target.closest('.rename-file-link');
        if (renameLink) {
            e.preventDefault();
            const fileId = renameLink.dataset.fileId;
            const fileName = renameLink.dataset.fileName;
            if (fileId && fileName && typeof window.handleRenameFileClick === 'function') {
                window.handleRenameFileClick(fileId, fileName);
            }

            const menu = renameLink.closest('.file-actions-menu');
            if (menu) UIStateManager.toggleVisibility(menu, false);
            return;
        }
        
        const downloadLink = target.closest('.download-file-link');
        if (downloadLink) {
            e.preventDefault();
            const fileId = downloadLink.dataset.fileId;
            const fileName = downloadLink.dataset.fileName;
            if (fileId && fileName && typeof window.handleDownloadFileClick === 'function') {
                window.handleDownloadFileClick(fileId, fileName);
            }

            const menu = downloadLink.closest('.file-actions-menu');
            if (menu) UIStateManager.toggleVisibility(menu, false);
            return;
        }
        
        const deleteLink = target.closest('.delete-file-link');
        if (deleteLink) {
            e.preventDefault();
            const fileId = deleteLink.dataset.fileId;
            const fileName = deleteLink.dataset.fileName;
            if (fileId && fileName && typeof window.handleDeleteFileClick === 'function') {
                window.handleDeleteFileClick(fileId, fileName);
            }

            const menu = deleteLink.closest('.file-actions-menu');
            if (menu) UIStateManager.toggleVisibility(menu, false);
            return;
        }

        const createBlankLink = target.closest('#createBlankFileSidebarOpt');
        if (createBlankLink) {
            e.preventDefault();
            showCreateBlankModal();
            return;
        }
        
        if (!target.closest('.dropdown, .file-actions-menu')) {
            document.querySelectorAll('.dropdown-content, .file-actions-menu').forEach(menu => {
                UIStateManager.toggleVisibility(menu, false);
            });
        }
    });
}

function toggleNewFileDropdown() {
    const dropdown = document.getElementById('newFileDropdownSidebar');
    UIStateManager.toggleVisibility(dropdown);
}

function showCreateBlankModal() {
    const dropdown = document.getElementById('newFileDropdownSidebar');
    const modal = document.getElementById('createBlankFileModal');
    const input = document.getElementById('newBlankFileNameInput');
    
    UIStateManager.toggleVisibility(dropdown, false);
    UIStateManager.resetFormElements(modal);
    showModal(modal);
    input?.focus();
}

function toggleFileActionMenu(button) {
    const menu = button.nextElementSibling;
    if (menu?.classList.contains('file-actions-menu')) {
        UIStateManager.toggleVisibility(menu);
    }
}

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
    
    if (!settingsLink || !settingsModal) return;

    console.debug("Settings modal handler initialized");
    settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showModal(settingsModal);
        console.debug("Settings modal opened");
    });
}