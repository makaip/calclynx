import { userManager } from '../core/cloud.js';

export class CreateFileModal {
    async createBlankFile(fileName) {
        const fileName = textInput?.value.trim() || '';

        if (!fileName) {
            // show 'File name cannot be empty.'
            textInput?.focus();
            return;
        }
        
        // use bootstrap instead of this custom hide/show error thing

        try {
            setButtonLoading(confirmCreateBlankFileBtn, true, 'Creating...', 'Create File');
            const result = await userManager.createBlankFile(fileName);
            if (!result.success) throw new Error(result.error);
            const modal = bootstrap.Modal.getInstance(createBlankFileModal);
            if (modal) modal.hide();
            window.location.href = `/app.html?fileId=${result.fileId}`;
        } catch (error) {
            console.error('Create blank file failed:', error);
            // show 'Failed to create blank file'
            textInput?.focus();
        } finally {
            setButtonLoading(confirmCreateBlankFileBtn, false, 'Creating...', 'Create File');
        }
    }
}