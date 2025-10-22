import { MathBoard } from './canvas.js';
import { ExpressionEquivalence } from '../utils/equivalence.js';
import { TextFieldCompatibility } from '../text/textfield-compatibility.js';
import { ImageGroup } from '../image/imagegroup.js';
import { getSupabaseClient } from '../auth/initsupabaseapp.js';
import { loadUserFiles } from '../sidebar/sidebar.js';
import { TextFormatToolbar } from '../ui/toolbar.js';
import '../ui/contextmenu.js';
import '../ui/commandpalette.js';

const App = {
	mathBoard: null,
	expressionEquivalence: null,
};

const onKeyDown = (e) => {
	const modifier = isModifierPressed(e);
	if (!modifier) return;

	if (e.key === 'd') {
		e.preventDefault();
		toggleTextFieldWidth();
		return;
	}

	if (isInInput(e.target)) return;

	if (e.key === 'k' && !e.shiftKey && !e.altKey) {
		e.preventDefault();
		e.stopPropagation();
		showCommandPalette();
		return;
	}

	if (e.key === 'i' && !e.shiftKey && !e.altKey) {
		e.preventDefault();
		showImageUrlInput();
	}
};

async function initializeAppCore() {
	initializeApp();
	setupImportInput(document.getElementById('importInput'));

	document.addEventListener('keydown', onKeyDown, true);

	try {
		const client = await getSupabaseClient();
		client.auth.onAuthStateChange(() => {
			updateUserStatus();
		});
		updateUserStatus();
	} catch (error) {
		console.error('Failed to initialize Supabase client:', error);
	}
}

const toggleTextFieldWidth = () => { // i feel like theres a better place to put this but idk where
	try {
		const activeElement = document.activeElement;
		if (!activeElement) return;

		const textEditor = activeElement.closest('.text-editor');
		if (!textEditor) return;

		const container = textEditor.closest('.text-field-container');
		if (!container || !container.textFieldInstance) return;

		const textField = container.textFieldInstance;
		if (textField.resizeHandler && typeof textField.resizeHandler.toggleFreeWidth === 'function') {
			textField.resizeHandler.toggleFreeWidth();
		}
	} catch (error) {
		console.warn('Error toggling text field width:', error);
	}
};

window.updateUserStatus = null;


const initializeApp = () => {
	if (TextFieldCompatibility.shouldUseProseMirror()) {
		App.mathBoard = new MathBoard();
		App.expressionEquivalence = new ExpressionEquivalence();
		if (window.saveButton && App.mathBoard?.fileManager?.fileWriter) {
			App.mathBoard.fileManager.fileWriter.setSaveButton(window.saveButton);
		}
	} else {
		setTimeout(initializeApp, 100);
	}
};

async function updateUserStatus() {
	const userEmailDisplay = document.getElementById('user-email-display');
	const authButton = document.getElementById('auth-button');

	if (!userEmailDisplay || !authButton) return;

	try {
		const client = await getSupabaseClient();
		const { data: { session } = {}, error } =
			(await client.auth.getSession()) || {};

		if (error) {
			console.error('Error getting session:', error);
			userEmailDisplay.textContent = '';
			return;
		}

		if (session?.user) {
			loadUserFiles();

			const userEmail = session.user.email ?? '';
			userEmailDisplay.textContent = userEmail;
			userEmailDisplay.title = userEmail;

			authButton.textContent = 'Sign Out';
			authButton.onclick = async (evt) => {
				evt.preventDefault();
				try {
					authButton.disabled = true;
					authButton.textContent = 'Signing Out...';
					const client = await getSupabaseClient();
					await client.auth.signOut();
					// onAuthStateChange will refresh UI
				} catch (err) {
					console.error('Error signing out:', err);
					alert('Error signing out. Please try again.');
					authButton.disabled = false;
					authButton.textContent = 'Sign Out';
				}
			};

			if (window.saveButton) window.saveButton.onAuthStateChange();
		} else {
			userEmailDisplay.textContent = '';
			userEmailDisplay.title = '';
			authButton.textContent = 'Sign In';
			authButton.onclick = (evt) => {
				evt.preventDefault();
				window.location.href = '/login.html';
			};

			const fileList = document.getElementById('sidebar-file-list');
			if (fileList) fileList.innerHTML = '';
			if (window.saveButton) window.saveButton.onAuthStateChange();
		}
	} catch (err) {
		console.error('Exception checking auth status:', err);
		userEmailDisplay.textContent = '';
	}
}

const readFileAsText = (file) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => resolve(e.target.result);
		reader.onerror = reject;
		reader.readAsText(file);
	});

const isModifierPressed = (e) => (navigator.platform.toUpperCase().includes('MAC') ? e.metaKey : e.ctrlKey);

const isInInput = (target) =>
	Boolean(
		target.closest('.image-url-input') ||
		target.closest('.command-palette-input') ||
		target.closest('.text-editor')
	);

const setupImportInput = (el) => {
	if (!el) return;
	el.addEventListener('change', async (evt) => {
		const file = evt.target.files?.[0];
		if (file) {
			try {
				const jsonData = await readFileAsText(file);

				try {
					JSON.parse(jsonData);
				} catch (parseError) {
					alert('The selected file does not contain valid JSON. Please check the file format and try again.');
					return;
				}

				if (window.isCreateFromJsonMode) {
					window.isCreateFromJsonMode = false;

					if (window.createFileModal) {
						window.createFileModal.setJsonData(jsonData);
					}
				} else {
					App.mathBoard?.fileManager?.importData(jsonData);
				}
			} catch (err) {
				console.error('Error reading JSON file:', err);
			}
		}
		// reset to allow re-uploading same file
		evt.target.value = '';
	});
};

const showCommandPalette = () => {
	if (window.commandPalette && typeof window.commandPalette.show === 'function') {
		const refElement = document.activeElement?.closest('.math-field-container');
		window.commandPalette.show(refElement);
	}
};

const showImageUrlInput = () => {
	if (window.imageUrlModal && typeof window.imageUrlModal.show === 'function') {
		window.imageUrlModal.show((url) => {
			if (!App?.mathBoard) return;
			const { x: mx, y: my } = App.mathBoard?.mouse ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
			const coords = App.mathBoard ? App.mathBoard.screenToCanvas(mx, my) : { x: 100, y: 100 };
			const imageGroup = new ImageGroup(App.mathBoard, coords.x, coords.y);
			imageGroup.setImageUrl(url);
			App.mathBoard.fileManager.saveState();
		});
	}
};

initializeAppCore();
App.updateUserStatus = updateUserStatus;
window.App = App;

export { App, updateUserStatus, initializeApp };
export default { App, updateUserStatus, initializeApp };
