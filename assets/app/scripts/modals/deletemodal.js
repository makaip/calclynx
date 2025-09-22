function initializeDeleteFileModal() {
    const deleteSidebarFileModal = document.getElementById('deleteSidebarFileModal');
    const closeDeleteSidebarFileModalBtn = document.getElementById('closeDeleteSidebarFileModal');
    const cancelDeleteSidebarFileBtn = document.getElementById('cancelDeleteSidebarFileButton');
    const confirmDeleteSidebarFileBtn = document.getElementById('confirmDeleteSidebarFileButton');
    const fileNameToDeleteSidebarElement = document.getElementById('fileNameToDeleteSidebar');
    const doNotAskAgainDeleteFileCheckbox = document.getElementById('doNotAskAgainDeleteFile');
    const deleteSidebarFileErrorMessage = document.getElementById('delete-sidebar-file-error-message');
    let fileIdToDeleteFromSidebar = null;

    window.handleDeleteFileClick = function(fileId, fileName) {
        fileIdToDeleteFromSidebar = fileId;
        if (fileNameToDeleteSidebarElement) {
            fileNameToDeleteSidebarElement.textContent = fileName;
        }
        ModalUtils.hideError(deleteSidebarFileErrorMessage);
        if (doNotAskAgainDeleteFileCheckbox) {
            doNotAskAgainDeleteFileCheckbox.checked = false;
        }

        if (sessionStorage.getItem('doNotAskAgainDeleteFile') === 'true') {
            confirmActualFileDelete();
        } else {
            ModalUtils.showModal(deleteSidebarFileModal);
        }
    };

    async function confirmActualFileDelete() {
        if (!fileIdToDeleteFromSidebar) return;
        
        try {
            ModalUtils.setButtonLoading(confirmDeleteSidebarFileBtn, true, 'Deleting...', 'Delete File');
            
            const result = await userManager.deleteFileRecord(fileIdToDeleteFromSidebar);
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            ModalUtils.hideModal(deleteSidebarFileModal);
            if (typeof window.loadUserFiles === 'function') {
                window.loadUserFiles();
            }

            const urlParams = new URLSearchParams(window.location.search);
            const currentFileId = urlParams.get('fileId');
            if (currentFileId === fileIdToDeleteFromSidebar) {
                await userManager.updateFileTitle(null);
                window.location.href = '/app.html';
            }

        } catch (error) {
            console.error('Error deleting file from sidebar:', error);
            ModalUtils.showError(deleteSidebarFileErrorMessage, error.message || 'Failed to delete file.');
        } finally {
            ModalUtils.setButtonLoading(confirmDeleteSidebarFileBtn, false, 'Deleting...', 'Delete File');
        }
    }

    if (closeDeleteSidebarFileModalBtn) {
        closeDeleteSidebarFileModalBtn.addEventListener('click', () => {
            ModalUtils.hideModal(deleteSidebarFileModal);
        });
    }

    if (cancelDeleteSidebarFileBtn) {
        cancelDeleteSidebarFileBtn.addEventListener('click', () => {
            ModalUtils.hideModal(deleteSidebarFileModal);
        });
    }

    if (confirmDeleteSidebarFileBtn) {
        confirmDeleteSidebarFileBtn.addEventListener('click', async () => {
            if (doNotAskAgainDeleteFileCheckbox && doNotAskAgainDeleteFileCheckbox.checked) {
                sessionStorage.setItem('doNotAskAgainDeleteFile', 'true');
            }
            await confirmActualFileDelete();
        });
    }
}
