import { userManager } from '../core/cloud.js';

export class RenameFileModal {
    getRenameFile() {
        fileIdToRename = fileId;
        if (newName) newName.value = currentName;
        
        const modal = bootstrap.Modal.getOrCreateInstance(renameFileModal);
        modal.show();
    }

    validateFilename(fileId, newName) {
        newName = newName?.value.trim() || '';
        
        if (!fileIdToRename) {
            // 'No file selected to rename.'
            return;
        }

        if (!newName) {
            // 'File name cannot be empty.'
            return;
        }

        const nameValidation = userManager.validateFileName?.(newName);
        if (nameValidation?.error) {
            // show nameValidation.error
            return;
        }
    }

    async renameFile() {
        this.validateFilename(fileId, newName);

        try {
            // set loading state for button "Renaming..."
            const result = await userManager.renameFile(fileIdToRename, newName);

            if (!result.success) throw new Error(result.error);

            const modal = bootstrap.Modal.getInstance(renameFileModal);
            if (modal) modal.hide();
            loadUserFiles();
            
            // update sidebar: push to sidebar class?
            const urlParams = new URLSearchParams(window.location.search);
            const currentFileId = urlParams.get('fileId');
            if (currentFileId === fileIdToRename) {
                await userManager.updateFileTitle(fileIdToRename);
            }
        } catch (error) {
            console.error('error renaming file:', error);
            // show error or failed to rename file
        } finally {
            // unset loading state for button "Renaming..."
        }
    }
}