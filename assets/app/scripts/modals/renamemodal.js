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
        }
        hideError(renameErrorMessage);
        showModal(renameFileModal);

        if (newFileNameInput) {
            newFileNameInput.focus();
        }
    };

    closeRenameFileModalBtn?.addEventListener('click', () => {
        hideModal(renameFileModal);
    });

    cancelRenameFileBtn?.addEventListener('click', () => {
        hideModal(renameFileModal);
    });

    confirmRenameFileBtn?.addEventListener('click', async () => {
        const newName = newFileNameInput?.value.trim() || '';
        
        if (!newName) {
            showError(renameErrorMessage, 'File name cannot be empty.');
            return;
        }

            hideError(renameErrorMessage);

            try {
                setButtonLoading(confirmRenameFileBtn, true, 'Renaming...', 'Rename');
                
                const result = await userManager.renameFile(fileIdToRename, newName);
                
                if (!result.success) {
                    showError(renameErrorMessage, result.error);
                    return;
                }
                
                hideModal(renameFileModal);
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
                showError(renameErrorMessage, error.message || 'Failed to rename file.');
            } finally {
                setButtonLoading(confirmRenameFileBtn, false, 'Renaming...', 'Rename');
            }
    });
}