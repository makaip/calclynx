export class ModalUtils {
    toggleModal(modalId) {
        const modalElement = document.getElementById(modalId);
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modalElement.classList.contains('show') ? modal.hide() : modal.show();
    }

    showError(element, message) {
        if (message) {
            element.textContent = message;
            element.style.display = 'block';
        }

        if (this.input) {
            this.input.classList.add('is-invalid');
        }
    }

    hideError(element) {
        if (element) {
            element.style.display = 'none';
        }

        if (this.input) {
            this.input.classList.remove('is-invalid');
        }
    }

    setButtonLoading(isLoading) {
        if (!this.button) return;
        
        this.button.disabled = isLoading;
        this.button.innerHTML = isLoading 
            ? '<i class="fas fa-spinner fa-spin"></i> Creating...'
            : 'Create File';
    }

    reset() {
        if (this.input) this.input.value = '';
        this.hideError();
        this.setButtonLoading(false);
    }

    sanitizeFileName(fileName) {
        if (!fileName || typeof fileName !== 'string') {
            return 'untitled';
        }

        return fileName.trim()
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_+|_+$/g, '') || 'untitled';
    }
}