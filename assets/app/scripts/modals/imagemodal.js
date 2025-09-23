function initializeImageUrlModal() {
    const imageUrlModal = document.getElementById('imageUrlModal');
    const closeImageUrlModalBtn = document.getElementById('closeImageUrlModal');
    const cancelImageUrlBtn = document.getElementById('cancelImageUrlButton');
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
        showModal(imageUrlModal);
        
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

    closeImageUrlModalBtn?.addEventListener('click', () => {
        hideModal(imageUrlModal);
        imageUrlCallback = null;
    });

    cancelImageUrlBtn?.addEventListener('click', () => {
        hideModal(imageUrlModal);
        imageUrlCallback = null;
    });

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
            hideModal(imageUrlModal);
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
