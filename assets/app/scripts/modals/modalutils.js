import { userManager } from '../core/cloud.js';

export class ModalUtils {
    showError(message) {
        if (message) {
            this.error.textContent = message;
            this.error.style.display = 'block';
        }

        if (this.input) {
            this.input.classList.add('is-invalid');
        }
    }

    hideError() {
        if (this.error) {
            this.error.style.display = 'none';
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
}