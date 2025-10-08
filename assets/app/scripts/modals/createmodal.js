import { userManager } from '../core/cloud.js';
import { ModalUtils } from './modalutils.js';

export class CreateFileModal {
    constructor() {
        this.modal = document.getElementById('createBlankFileModal');
        this.input = document.getElementById('newBlankFileNameInput');
        this.button = document.getElementById('confirmCreateBlankFileButton');
        this.error = document.getElementById('createBlankFile-error-message');
    }

    async createBlankFile() {
        if (!this.input || !this.modal) this.init();

        const fileName = this.input?.value.trim() || '';

        if (!fileName) {
            this.showError('File name cannot be empty.');
            this.input?.focus();
            return;
        }

        this.hideError();

        try {
            this.setButtonLoading(true);
            const result = await userManager.createBlankFile(fileName);
            
            if (!result.success) {
                throw new Error(result.error);
            }

            console.log("Blank file created successfully:", fileName);
            const modalInstance = bootstrap.Modal.getInstance(this.modal);
            if (modalInstance) modalInstance.hide();
            
            window.location.href = `/app.html?fileId=${result.fileId}`;
        } catch (error) {
            console.error('Create blank file failed:', error);
            this.showError(error.message || 'Failed to create blank file');
            this.input?.focus();
        } finally {
            this.setButtonLoading(false);
        }
    }
}

window.createFileModal = new CreateFileModal();