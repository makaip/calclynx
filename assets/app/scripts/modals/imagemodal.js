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
            imageUrlInput.focus();
        }
        ModalUtils.hideError(imageUrlErrorMessage);
        ModalUtils.showModal(imageUrlModal);
    };

    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    if (closeImageUrlModalBtn) {
        closeImageUrlModalBtn.addEventListener('click', () => {
            ModalUtils.hideModal(imageUrlModal);
            imageUrlCallback = null;
        });
    }

    if (cancelImageUrlBtn) {
        cancelImageUrlBtn.addEventListener('click', () => {
            ModalUtils.hideModal(imageUrlModal);
            imageUrlCallback = null;
        });
    }

    if (confirmImageUrlBtn) {
        confirmImageUrlBtn.addEventListener('click', () => {
            const url = imageUrlInput.value.trim();
            
            if (!url) {
                ModalUtils.showError(imageUrlErrorMessage, 'Please enter a URL.');
                return;
            }
            
            if (!isValidUrl(url)) {
                ModalUtils.showError(imageUrlErrorMessage, 'Please enter a valid URL.');
                return;
            }

            if (imageUrlCallback) {
                imageUrlCallback(url);
            }
            ModalUtils.hideModal(imageUrlModal);
            imageUrlCallback = null;
        });
    }

    if (imageUrlInput) {
        imageUrlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (confirmImageUrlBtn) {
                    confirmImageUrlBtn.click();
                }
            }
        });
        
        imageUrlInput.addEventListener('paste', () => {
            setTimeout(() => {
                ModalUtils.hideError(imageUrlErrorMessage);
            }, 0);
        });
    }
}
