import { showError, hideError, setButtonLoading } from '../sidebar/sidebar-file-actions.js';
import { loadUserFiles } from '../sidebar/sidebar.js';
import { userManager } from '../core/cloud.js';

function initializeDeleteFileModal() {
    const deleteSidebarFileModal = document.getElementById('deleteSidebarFileModal');
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
        hideError(deleteSidebarFileErrorMessage);
        if (doNotAskAgainDeleteFileCheckbox) {
            doNotAskAgainDeleteFileCheckbox.checked = false;
        }

        if (sessionStorage.getItem('doNotAskAgainDeleteFile') === 'true') {
            confirmActualFileDelete();
        } else {
            const modal = bootstrap.Modal.getOrCreateInstance(deleteSidebarFileModal);
            modal.show();
        }
    };

    async function confirmActualFileDelete() {
        if (!fileIdToDeleteFromSidebar) return;
        
        try {
            setButtonLoading(confirmDeleteSidebarFileBtn, true, 'Deleting...', 'Delete File');
            
            const result = await userManager.deleteFileRecord(fileIdToDeleteFromSidebar);
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            const modal = bootstrap.Modal.getInstance(deleteSidebarFileModal);
            if (modal) modal.hide();
            loadUserFiles();

            const urlParams = new URLSearchParams(window.location.search);
            const currentFileId = urlParams.get('fileId');
            if (currentFileId === fileIdToDeleteFromSidebar) {
                await userManager.updateFileTitle(null);
                window.location.href = '/app.html';
            }

        } catch (error) {
            console.error('Error deleting file from sidebar:', error);
            showError(deleteSidebarFileErrorMessage, error.message || 'Failed to delete file.');
        } finally {
            setButtonLoading(confirmDeleteSidebarFileBtn, false, 'Deleting...', 'Delete File');
        }
    }

    confirmDeleteSidebarFileBtn?.addEventListener('click', async () => {
        if (doNotAskAgainDeleteFileCheckbox?.checked) {
            sessionStorage.setItem('doNotAskAgainDeleteFile', 'true');
        }
        await confirmActualFileDelete();
    });
}

export { initializeDeleteFileModal };
