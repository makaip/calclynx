import { userManager } from '../core/cloud.js';

export class DeleteFileModal {
    initializeDeleteFileModal(fileId, fileName) {
        fileToDelete = fileId;
        if (fileElement) {
            fileElement.textContent = fileName;
        }

        hideError(deleteSidebarFileErrorMessage);
        if (dontAskAgain) {
            dontAskAgain.checked = false;
        }

        if (sessionStorage.getItem('doNotAskAgainDeleteFile') === 'true') {
            confirmDeletion();
        } else {
            const modal = bootstrap.Modal.getOrCreateInstance(deleteSidebarFileModal);
            modal.show();
        }
    }

    async confirmDeletion() {
        if (!fileToDelete) return;

        try {
            //bootstrap? 
            setButtonLoading(confirmDeleteSidebarFileBtn, true, 'Deleting...', 'Delete File');
            const result = await userManager.deleteFileRecord(fileToDelete);
            
            if (!result.success) throw new Error(result.error);
            
            const modal = bootstrap.Modal.getInstance(deleteSidebarFileModal);
            if (modal) modal.hide();
            loadUserFiles();

            const urlParams = new URLSearchParams(window.location.search);
            const currentFileId = urlParams.get('fileId');
            if (currentFileId === fileToDelete) {
                await userManager.updateFileTitle(null);
                window.location.href = '/app.html';
            }

        } catch (error) {
            console.error('Error deleting file from sidebar:', error);
            // show error message

        } finally {
            setButtonLoading(confirmDeleteSidebarFileBtn, false, 'Deleting...', 'Delete File');
        }
    }
}