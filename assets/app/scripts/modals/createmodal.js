import { userManager } from '../core/cloud.js';
import { ModalUtils } from './modalutils.js';

export class CreateFileModal {
    constructor() {
        this.modal = document.getElementById('createBlankFileModal');
        this.input = document.getElementById('newBlankFileNameInput');
        this.button = document.getElementById('confirmCreateBlankFileButton');
        this.error = document.getElementById('createBlankFile-error-message');
        this.jsonData = null;
    }

    async createBlankFile() {
        const fileName = this.input?.value.trim() || '';

        if (!fileName) {
            ModalUtils.showError(this.error, 'File name cannot be empty.');
            this.input?.focus();
            return;
        }

        ModalUtils.hideError(this.error);

        try {
            ModalUtils.setButtonLoading(this.button, true, 'Creating...', 'Create File');
            
            const result = this.jsonData 
                ? await userManager.createFileFromJson(fileName, this.jsonData)
                : await userManager.createBlankFile(fileName);
            
            if (!result.success) {
                throw new Error(result.error);
            }

            console.log("File created successfully:", fileName);
            const modalInstance = bootstrap.Modal.getInstance(this.modal);
            if (modalInstance) modalInstance.hide();
            
            window.location.href = `/app.html?fileId=${result.fileId}`;
        } catch (error) {
            console.error('Create file failed:', error);
            ModalUtils.showError(this.error, error.message || 'Failed to create file');
            this.input?.focus();
        } finally {
            ModalUtils.setButtonLoading(this.button, false, 'Creating...', 'Create File');
        }
    }

    openFromJson() {
        this.jsonData = null;
        const input = document.getElementById('importInput');
        if (input) {
            window.isCreateFromJsonMode = true;
            input.click();
        }
    }

    setJsonData(data) {
        this.jsonData = data;
        const modalInstance = bootstrap.Modal.getOrCreateInstance(this.modal);
        modalInstance.show();
        if (this.input) {
            this.input.value = '';
            setTimeout(() => this.input.focus(), 100);
        }
        ModalUtils.hideError(this.error);
    }

    reset() {
        if (this.input) this.input.value = '';
        this.jsonData = null;
        ModalUtils.hideError(this.error);
        ModalUtils.setButtonLoading(this.button, false, 'Creating...', 'Create File');
    }
}

window.createFileModal = new CreateFileModal();