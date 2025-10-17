export const ModalUtils = {
	toggleModal(modalId) {
		const modalElement = document.getElementById(modalId);
		const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
		modalElement.classList.contains('show') ? modal.hide() : modal.show();
	},

	showError(element, message) {
		if (!element) return;

		if (message) {
			element.textContent = message;
			element.style.display = 'block';
		}
	},

	hideError(element) {
		if (element) {
			element.style.display = 'none';
			element.textContent = '';
		}
	},

	setButtonLoading(button, isLoading, loadingText = 'Loading...', normalText = 'Submit') {
		if (!button) return;

		button.disabled = isLoading;
		button.innerHTML = isLoading
			? `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`
			: normalText;
	},

	sanitizeFileName(fileName) {
		if (!fileName || typeof fileName !== 'string') {
			return 'untitled';
		}

		return fileName.trim()
			.replace(/[<>:"/\\|?*]/g, '_')
			.replace(/\s+/g, '_')
			.replace(/_{2,}/g, '_')
			.replace(/^_+|_+$/g, '') || 'untitled';
	},

	ensureJsonExt(fileName) {
		if (!fileName || typeof fileName !== 'string') {
			return 'untitled.json';
		}

		return fileName.endsWith('.json') ? fileName : `${fileName}.json`;
	}
}