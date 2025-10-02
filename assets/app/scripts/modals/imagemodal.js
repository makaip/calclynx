import { showError, hideError } from '../sidebar/sidebar-file-actions.js';

function initializeImageUrlModal() {
    const imageUrlModal = document.getElementById('imageUrlModal');
    const confirmImageUrlBtn = document.getElementById('confirmImageUrlButton');
    const imageUrlInput = document.getElementById('imageUrlInput');
    const imageUrlErrorMessage = document.getElementById('imageUrl-error-message');
    let imageUrlCallback = null;

    window.showImageUrlModal = function(callback) {
        imageUrlCallback = callback;
        if (imageUrlInput) {
            imageUrlInput.value = '';
        }
        hideError(imageUrlErrorMessage);
        const modal = bootstrap.Modal.getOrCreateInstance(imageUrlModal);
        modal.show();
        
        if (imageUrlInput) {
            imageUrlInput.focus();
        }
    };

    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    confirmImageUrlBtn?.addEventListener('click', () => {
        const url = imageUrlInput.value.trim();
        
        if (!url) {
            showError(imageUrlErrorMessage, 'Please enter a URL.');
            return;
        }
        
        if (!isValidUrl(url)) {
            showError(imageUrlErrorMessage, 'Please enter a valid URL.');
            return;
        }

        if (imageUrlCallback) {
            imageUrlCallback(url);
        }
        const modal = bootstrap.Modal.getInstance(imageUrlModal);
        if (modal) modal.hide();
        imageUrlCallback = null;
    });

    imageUrlInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmImageUrlBtn?.click();
        }
    });
    
    imageUrlInput?.addEventListener('paste', () => {
        setTimeout(() => {
            hideError(imageUrlErrorMessage);
        }, 0);
    });
}

export { initializeImageUrlModal };
