import { cloudManager } from '../core/cloud.js';
import { SidebarResizer } from './sidebar-resizer.js';

export class Sidebar {
	constructor() {
		this.minWidth = 200;
		this.maxWidth = 800;
		this.currentWidth = 400;
		this.isResizing = false;
		this.elements = {};
		this.resizer = null;
	}

	formatDate(dateString) {
		if (!dateString) return 'N/A';
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch (e) {
			console.error('Error formatting date:', e);
			return 'Invalid date';
		}
	}

	formatFileSize(bytes) {
		if (bytes === undefined || bytes === null || isNaN(bytes)) return 'N/A';
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		if (i < 0) return '0 B';
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	getCurrentFileId() {
		const urlParams = new URLSearchParams(window.location.search);
		return urlParams.get('fileId');
	}

	escapeHtml(unsafe) {
		if (typeof unsafe !== 'string') return '';
		return unsafe
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}

	createIndicator(message, type = 'info') {
		let className = 'text-secondary';
		if (type === 'error') className = 'text-danger';
		else if (type === 'loading') className = 'text-secondary';
		else if (type === 'info') className = 'text-secondary';

		let spanClass = 'info-text';
		if (type === 'error') spanClass = 'error-text';
		else if (type === 'loading') spanClass = 'loading-text';

		return `<div class="list-group-item ${className}"><span class="${spanClass}">${message}</span></div>`;
	}

	createFileItem(file, isActive = false) {
		const safeName = this.escapeHtml(file?.file_name ?? 'Untitled');
		const safeIdAttr = this.escapeHtml(String(file?.id ?? ''));
		const safeIdUrl = encodeURIComponent(String(file?.id ?? ''));
		return `
			<div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${isActive ? 'active' : ''}">
				<a href="/app.html?fileId=${safeIdUrl}" title="${safeName}" 
				class="text-decoration-none flex-grow-1 file-link-content">
					<div class="file-content">
						<div class="file-title fw-medium mb-1">${safeName}</div>
						<div class="file-metadata small">
							<span class="file-last-modified">${this.formatDate(file.last_modified)}</span>
							<span class="metadata-separator"> • </span>
							<span class="file-size">${this.formatFileSize(file.file_size ?? 0)}</span>
						</div>
					</div>
				</a>
				<div class="dropdown">
					<button class="btn btn-sm file-actions-button" type="button" 
							data-bs-toggle="dropdown" aria-expanded="false" title="File actions">
						<i class="fas fa-ellipsis-v"></i>
					</button>
					<ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end">
						<li><a class="dropdown-item rename-file-link" href="#" onclick="renameFileModal.show('${safeIdAttr}', '${safeName}')">Rename</a></li>
						<li><a class="dropdown-item download-file-link" href="#" onclick="fileDownloader.downloadAsJson('${safeIdAttr}', '${safeName}'); return false;">Download as JSON</a></li>
						<li><hr class="dropdown-divider"></li>
						<li><a class="dropdown-item text-danger delete-file-link" href="#" onclick="deleteFileModal.initDeleteFileModal('${safeIdAttr}', '${safeName}')">Delete</a></li>
					</ul>
				</div>
			</div>
		`;
	}

	async loadUserFiles() {
		const fileList = document.getElementById('sidebar-file-list');
		if (!fileList) return;

		fileList.innerHTML = this.createIndicator('Loading files...', 'loading');

		try {
			const result = await cloudManager.listUserFiles();
			if (!result.success) throw new Error(result.error);

			const currentFileId = this.getCurrentFileId();

			if (!result.files?.length) {
				fileList.innerHTML = this.createIndicator('No files found.', 'info');
				return;
			}

			fileList.innerHTML = result.files
				.map(file => this.createFileItem(file, file.id === currentFileId))
				.join('');

		} catch (error) {
			console.error('Error loading files:', error);
			fileList.innerHTML = this.createIndicator('Error loading files.', 'error');
		}
	}

	init() {
		this.elements = {
			sidebar: document.getElementById('sidebar'),
			mainContent: document.getElementById('main-content'),
			resizer: document.getElementById('sidebar-resizer')
		};

		const missingElements = Object.entries(this.elements)
			.filter(([, element]) => !element)
			.map(([key]) => key);

		if (missingElements.length > 0) {
			console.error('Missing required sidebar elements:', missingElements);
			return;
		}

		this.resizer = new SidebarResizer(
			this.elements.sidebar,
			this.elements.mainContent,
			this.elements.resizer
		);

		this.resizer.init();
		this.loadUserFiles();
	}
}

// todo: move globalization to mjs
document.addEventListener('DOMContentLoaded', () => {
	window.sidebar = new Sidebar();
	window.sidebar.init();
});

export function loadUserFiles() { //fix later
	if (window.sidebar) {
		window.sidebar.loadUserFiles();
	}
}
