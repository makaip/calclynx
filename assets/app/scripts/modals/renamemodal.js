import { cloudManager } from '../core/cloud.js';
import { ModalUtils } from './modalutils.js';

export class RenameFileModal {
	constructor() {
		this.modal = document.getElementById('renameFileModal');
		this.input = document.getElementById('newFileNameInput');
		this.button = document.getElementById('confirmRenameFileButton');
		this.error = document.getElementById('rename-error-message');
		this.fileIdToRename = null;
		
		if (this.modal) {
			this.modal.addEventListener('shown.bs.modal', () => {
				this.input?.focus();
			});
		}
	}

	show(fileId, currentName) {
		this.fileIdToRename = fileId;
		if (this.input) this.input.value = currentName || '';
		
		ModalUtils.hideError(this.error);
		const modal = bootstrap.Modal.getOrCreateInstance(this.modal);
		modal.show();
	}

	async renameFile() {
		const newName = this.input?.value.trim() || '';
		
		if (!this.fileIdToRename) {
			ModalUtils.showError(this.error, 'No file selected to rename.');
			return;
		}

		if (!newName) {
			ModalUtils.showError(this.error, 'File name cannot be empty.');
			this.input?.focus();
			return;
		}

		ModalUtils.hideError(this.error);

		try {
			ModalUtils.setButtonLoading(this.button, true, 'Renaming...', 'Rename');
			const result = await cloudManager.renameFile(this.fileIdToRename, newName);

			if (!result.success) throw new Error(result.error);

			const modal = bootstrap.Modal.getInstance(this.modal);
			if (modal) modal.hide();
			
			if (window.loadUserFiles) window.loadUserFiles();
			
			const urlParams = new URLSearchParams(window.location.search);
			const currentFileId = urlParams.get('fileId');
			if (currentFileId === this.fileIdToRename) {
				await cloudManager.updateFileTitle(this.fileIdToRename);
			}
		} catch (error) {
			console.error('Error renaming file:', error);
			ModalUtils.showError(this.error, error.message || 'Failed to rename file');
			this.input?.focus();
		} finally {
			ModalUtils.setButtonLoading(this.button, false, 'Renaming...', 'Rename');
		}
	}

	reset() {
		if (this.input) this.input.value = '';
		this.fileIdToRename = null;
		ModalUtils.hideError(this.error);
		ModalUtils.setButtonLoading(this.button, false, 'Renaming...', 'Rename');
	}
}