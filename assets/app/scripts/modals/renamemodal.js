import { showError, hideError, setButtonLoading } from '../sidebar/sidebar-file-actions.js';
import { loadUserFiles } from '../sidebar/sidebar.js';
import { userManager } from '../core/cloud.js';

function initializeRenameFileModal() {
    const renameFileModal = document.getElementById('renameFileModal');
    const confirmRenameFileBtn = document.getElementById('confirmRenameFileButton');
    const newFileNameInput = document.getElementById('newFileNameInput');
    const renameErrorMessage = document.getElementById('rename-error-message');
    let fileIdToRename = null;

    window.handleRenameFileClick = function(fileId, currentName) {
        fileIdToRename = fileId;
        if (newFileNameInput) {
            newFileNameInput.value = currentName;
        }
        hideError(renameErrorMessage);
        const modal = bootstrap.Modal.getOrCreateInstance(renameFileModal);
        modal.show();

        if (newFileNameInput) {
            setTimeout(() => newFileNameInput.focus(), 100);
        }
    };

    confirmRenameFileBtn?.addEventListener('click', async () => {
        const newName = newFileNameInput?.value.trim() || '';
        
        if (!fileIdToRename) {
            showError(renameErrorMessage, 'No file selected to rename.');
            return;
        }

        if (!newName) {
            showError(renameErrorMessage, 'File name cannot be empty.');
            return;
        }

        const nameValidation = userManager.validateFileName?.(newName);
        if (nameValidation?.error) {
            showError(renameErrorMessage, nameValidation.error);
            return;
        }

        hideError(renameErrorMessage);

        try {
            confirmRenameFileBtn.disabled = true;
            setButtonLoading(confirmRenameFileBtn, true, 'Renaming...', 'Rename');
            
            const result = await userManager.renameFile(fileIdToRename, newName);
            
            if (!result.success) {
                showError(renameErrorMessage, result.error);
                return;
            }
            
            const modal = bootstrap.Modal.getInstance(renameFileModal);
            if (modal) modal.hide();
            loadUserFiles();
            
            const urlParams = new URLSearchParams(window.location.search);
            const currentFileId = urlParams.get('fileId');
            if (currentFileId === fileIdToRename) {
                await userManager.updateFileTitle(fileIdToRename);
            }
        } catch (error) {
            console.error('Error renaming file:', error);
            showError(renameErrorMessage, error.message || 'Failed to rename file.');
        } finally {
            setButtonLoading(confirmRenameFileBtn, false, 'Renaming...', 'Rename');
            confirmRenameFileBtn.disabled = false;
        }
    });
}

export { initializeRenameFileModal };