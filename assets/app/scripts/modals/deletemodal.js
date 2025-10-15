import { userManager } from '../core/cloud.js';
import { ModalUtils } from './modalutils.js';

export class DeleteFileModal {
	constructor() {
		this.modal = document.getElementById('deleteSidebarFileModal');
		this.fileNameElement = document.getElementById('fileNameToDeleteSidebar');
		this.button = document.getElementById('confirmDeleteSidebarFileButton');
		this.error = document.getElementById('delete-sidebar-file-error-message');
		this.checkbox = document.getElementById('doNotAskAgainDeleteFile');
		this.fileToDelete = null;
	}

	initDeleteFileModal(fileId, fileName) {
		this.fileToDelete = fileId;
		if (this.fileNameElement) {
			this.fileNameElement.textContent = fileName;
		}

		ModalUtils.hideError(this.error);
		if (this.checkbox) {
			this.checkbox.checked = false;
		}

		if (sessionStorage.getItem('doNotAskAgainDeleteFile') === 'true') {
			this.confirmDeletion();
		} else {
			const modal = bootstrap.Modal.getOrCreateInstance(this.modal);
			modal.show();
		}
	}

	async confirmDeletion() {
		if (!this.fileToDelete) return;

		if (this.checkbox?.checked) {
			sessionStorage.setItem('doNotAskAgainDeleteFile', 'true');
		}

		try {
			ModalUtils.setButtonLoading(this.button, true, 'Deleting...', 'Delete File');
			const result = await userManager.deleteFileRecord(this.fileToDelete);
			
			if (!result.success) throw new Error(result.error);
			
			const modal = bootstrap.Modal.getInstance(this.modal);
			if (modal) modal.hide();
			
			// refresh file list
			if (window.loadUserFiles) window.loadUserFiles();

			const urlParams = new URLSearchParams(window.location.search);
			const currentFileId = urlParams.get('fileId');
			if (currentFileId === this.fileToDelete) {
				await userManager.updateFileTitle(null);
				window.location.href = '/app.html';
			}

		} catch (error) {
			console.error('Error deleting file from sidebar:', error);
			ModalUtils.showError(this.error, error.message || 'Failed to delete file');
		} finally {
			ModalUtils.setButtonLoading(this.button, false, 'Deleting...', 'Delete File');
		}
	}

	reset() {
		this.fileToDelete = null;
		if (this.checkbox) this.checkbox.checked = false;
		ModalUtils.hideError(this.error);
		ModalUtils.setButtonLoading(this.button, false, 'Deleting...', 'Delete File');
	}
}