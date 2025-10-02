import { initializeCreateBlankFileModal } from '../modals/createmodal.js';
import { initializeDeleteFileModal } from '../modals/deletemodal.js';
import { initializeImageUrlModal } from '../modals/imagemodal.js';
import { initializeRenameFileModal } from '../modals/renamemodal.js';
import { initializeSettingsModal } from '../modals/settingsmodal.js';
import { userManager } from '../core/cloud.js';
import { 
    initializeFileDownloadHandler,
    showError,
    hideError,
    setButtonLoading
} from './sidebar-file-actions.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeSettingsModal();
    initializeCreateBlankFileModal();
    initializeDeleteFileModal();
    initializeImageUrlModal();
    initializeRenameFileModal();
    initializeFileDownloadHandler();
    initializeCreateFromJsonModal();
    initializeEventDelegation();
});

function initializeEventDelegation() {
    document.addEventListener('click', (e) => {
        const target = e.target;
                
        const settingsLink = target.closest('#settings-link');
        if (settingsLink) {
            e.preventDefault();
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) {
                const modal = bootstrap.Modal.getOrCreateInstance(settingsModal);
                modal.show();
            }
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

        const createFromJsonLink = target.closest('#createFromJsonSidebarOpt');
        if (createFromJsonLink) {
            e.preventDefault();
            showCreateFromJsonDialog();
            return;
        }
    });
}

function showCreateBlankModal() {
    const modal = document.getElementById('createBlankFileModal');
    const input = document.getElementById('newBlankFileNameInput');
    
    UIStateManager.resetFormElements(modal);
    const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
    bsModal.show();
    setTimeout(() => input?.focus(), 100);
}

function showCreateFromJsonDialog() {
    const importInput = document.getElementById('importInput');
    
    if (importInput) {
        window.isCreateFromJsonMode = true;
        importInput.click();
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

function initializeCreateFromJsonModal() {
    const createFromJsonModal = document.getElementById('createFromJsonModal');
    const confirmCreateFromJsonBtn = document.getElementById('confirmCreateFromJsonButton');
    const newJsonFileNameInput = document.getElementById('newJsonFileNameInput');
    const createFromJsonErrorMsg = document.getElementById('createFromJson-error-message');

    window.handleCreateFromJson = async function() {
        const fileName = newJsonFileNameInput?.value.trim() || '';

        if (!fileName) {
            showError(createFromJsonErrorMsg, 'File name cannot be empty.');
            newJsonFileNameInput?.focus();
            return;
        }

        if (!window.pendingJsonData) {
            showError(createFromJsonErrorMsg, 'No JSON data available. Please try again.');
            return;
        }
        
        hideError(createFromJsonErrorMsg);

        try {
            setButtonLoading(confirmCreateFromJsonBtn, true, 'Creating...', 'Create File');

            const result = await userManager.createFileFromJson(fileName, window.pendingJsonData);

            if (!result.success) {
                throw new Error(result.error);
            }

            console.log("File created from JSON successfully:", fileName);
            const modal = bootstrap.Modal.getInstance(createFromJsonModal);
            if (modal) modal.hide();
            window.pendingJsonData = null;
            window.location.href = `/app.html?fileId=${result.fileId}`;

        } catch (error) {
            console.error('Create from JSON failed:', error);
            showError(createFromJsonErrorMsg, error.message || 'Failed to create file from JSON');
            newJsonFileNameInput?.focus();
        } finally {
            setButtonLoading(confirmCreateFromJsonBtn, false, 'Creating...', 'Create File');
        }
    };

    confirmCreateFromJsonBtn?.addEventListener('click', () => {
        window.handleCreateFromJson();
    });
}

export {
    initializeCreateBlankFileModal,
    initializeDeleteFileModal,
    initializeImageUrlModal,
    initializeRenameFileModal,
    initializeFileDownloadHandler,
    initializeCreateFromJsonModal,
    initializeEventDelegation
};