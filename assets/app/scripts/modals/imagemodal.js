import { ModalUtils } from './modalutils.js';

export class ImageUrlModal {
    constructor() {
        this.modal = document.getElementById('imageUrlModal');
        this.input = document.getElementById('imageUrlInput');
        this.button = document.getElementById('confirmImageUrlButton');
        this.error = document.getElementById('imageUrl-error-message');
        this.callback = null;
    }

    show(callback) {
        this.callback = callback;
        if (this.input) this.input.value = '';
        ModalUtils.hideError(this.error);
        
        const modal = bootstrap.Modal.getOrCreateInstance(this.modal);
        modal.show();
        
        setTimeout(() => this.input?.focus(), 500);
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    addImageFromUrl() {
        const url = this.input?.value.trim() || '';

        if (!url) {
            ModalUtils.showError(this.error, 'Please enter a URL.');
            this.input?.focus();
            return;
        }

        if (!this.isValidUrl(url)) {
            ModalUtils.showError(this.error, 'Please enter a valid URL.');
            this.input?.focus();
            return;
        }

        ModalUtils.hideError(this.error);

        if (this.callback) {
            this.callback(url);
            this.callback = null;
        }

        const modal = bootstrap.Modal.getInstance(this.modal);
        if (modal) modal.hide();
    }

    reset() {
        if (this.input) this.input.value = '';
        this.callback = null;
        ModalUtils.hideError(this.error);
    }
}