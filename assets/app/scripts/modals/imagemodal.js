import { userManager } from '../core/cloud.js';

export class ImageUrlModal {
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    addImageFromUrl(inputUrl) {
        const url = inputUrl.value.trim();

        // TODO: use boostrap form validation
        // https://getbootstrap.com/docs/5.3/forms/validation/

        if (!url) {
            // show 'Please enter a URL.'
            return;
        }

        if (!this.isValidUrl(url)) {
            // show 'Please enter a valid URL.'
            return;
        }

        if (imageUrlCallback) imageUrlCallback(url);

        const modal = bootstrap.Modal.getInstance(imageUrlModal);
        if (modal) modal.hide();
        imageUrlCallback = null;
    }
}