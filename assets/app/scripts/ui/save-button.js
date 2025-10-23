/* global bootstrap */
import { getSupabaseClient } from '../auth/initsupabaseapp.js';

class SaveButton {
	constructor() {
		this.button = null;
		this.isUserLoggedIn = false;
		this.hasUserEdited = false;
		this.hasFileLoaded = false;

		this.init();
	}

	init() {
		this.button = document.getElementById('save-button');
		if (!this.button) return;

		this.button.addEventListener('click', () => this.handleSaveClick());
		this.checkAuthState();
		this.checkFileState();
	}

	async checkAuthState() {
		try {
			const client = await getSupabaseClient();
			const { data: { session }, error } = await client.auth.getSession();

			if (error) {
				console.error('Error checking auth state:', error);
				this.isUserLoggedIn = false;
			} else {
				this.isUserLoggedIn = !!session;
			}

			this.updateVisibility();
		} catch (err) {
			console.error('Error in checkAuthState:', err);
			this.isUserLoggedIn = false;
		}
	}

	checkFileState() {
		const urlParams = new URLSearchParams(window.location.search);
		const fileId = urlParams.get('fileId');
		this.hasFileLoaded = !!fileId;
	}

	setSyncing(isSyncing) {
		if (isSyncing && !this.hasFileLoaded && !this.hasUserEdited) {
			this.hasUserEdited = true;
			this.updateVisibility();
		}
	}

	updateVisibility() {
		if (!this.button) return;
		const shouldShow = this.isUserLoggedIn && !this.hasFileLoaded && this.hasUserEdited;

		this.button.classList.toggle('show', shouldShow);
	}

	handleSaveClick() {
		if (window.createFileModal) {
			const modal = new bootstrap.Modal(document.getElementById('createBlankFileModal'));
			modal.show();
		}
	}

	async onAuthStateChange() {
		await this.checkAuthState();
	}

	onFileStateChange(fileId) {
		this.hasFileLoaded = !!fileId;
		if (this.hasFileLoaded) this.hasUserEdited = false;

		this.updateVisibility();
	}
}

export { SaveButton };
