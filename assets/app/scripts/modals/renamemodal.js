function initializeRenameFileModal() {
    const renameFileModal = document.getElementById('renameFileModal');
    const closeRenameFileModalBtn = document.getElementById('closeRenameFileModal');
    const cancelRenameFileBtn = document.getElementById('cancelRenameFileButton');
    const confirmRenameFileBtn = document.getElementById('confirmRenameFileButton');
    const newFileNameInput = document.getElementById('newFileNameInput');
    const renameErrorMessage = document.getElementById('rename-error-message');
    let fileIdToRename = null;

    window.handleRenameFileClick = function(fileId, currentName) {
        fileIdToRename = fileId;
        if (newFileNameInput) {
            newFileNameInput.value = currentName;
            newFileNameInput.focus();
        }
        ModalUtils.hideError(renameErrorMessage);
        ModalUtils.showModal(renameFileModal);
    };

    if (closeRenameFileModalBtn) {
        closeRenameFileModalBtn.addEventListener('click', () => {
            ModalUtils.hideModal(renameFileModal);
        });
    }

    if (cancelRenameFileBtn) {
        cancelRenameFileBtn.addEventListener('click', () => {
            ModalUtils.hideModal(renameFileModal);
        });
    }

    if (confirmRenameFileBtn) {
        confirmRenameFileBtn.addEventListener('click', async () => {
            const newName = newFileNameInput ? newFileNameInput.value.trim() : '';
            
            if (!newName) {
                ModalUtils.showError(renameErrorMessage, 'File name cannot be empty.');
                return;
            }

            ModalUtils.hideError(renameErrorMessage);

            try {
                ModalUtils.setButtonLoading(confirmRenameFileBtn, true, 'Renaming...', 'Rename');
                
                const result = await userManager.renameFile(fileIdToRename, newName);
                
                if (!result.success) {
                    ModalUtils.showError(renameErrorMessage, result.error);
                    return;
                }
                
                ModalUtils.hideModal(renameFileModal);
                if (typeof window.loadUserFiles === 'function') {
                    window.loadUserFiles();
                }
                
                const urlParams = new URLSearchParams(window.location.search);
                const currentFileId = urlParams.get('fileId');
                if (currentFileId === fileIdToRename) {
                    await userManager.updateFileTitle(fileIdToRename);
                }
            } catch (error) {
                console.error('Error renaming file:', error);
                ModalUtils.showError(renameErrorMessage, error.message || 'Failed to rename file.');
            } finally {
                ModalUtils.setButtonLoading(confirmRenameFileBtn, false, 'Renaming...', 'Rename');
            }
        });
    }
}