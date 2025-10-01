import { userManager } from '../core/cloud.js';

const SidebarUtils = {
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
    },

    formatFileSize(bytes) {
        if (bytes === undefined || bytes === null || isNaN(bytes)) return 'N/A';
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        if (i < 0) return '0 B';
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },

    getCurrentFileId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('fileId');
    },

    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    createLoadingIndicator(message = 'Loading files...') {
        return `<li><span class="loading-text">${message}</span></li>`;
    },

    createErrorIndicator(message = 'Error loading files.') {
        return `<li><span class="error-text">${message}</span></li>`;
    },

    createInfoIndicator(message = 'No files found.') {
        return `<li><span class="info-text">${message}</span></li>`;
    }
};

function createFileItem(file, isActive = false) {
    const safeName = SidebarUtils.escapeHtml(file?.file_name ?? 'Untitled');
    const safeIdAttr = SidebarUtils.escapeHtml(String(file?.id ?? ''));
    const safeIdUrl = encodeURIComponent(String(file?.id ?? ''));
    return `
        <li class="${isActive ? 'active' : ''}">
            <a href="/app.html?fileId=${safeIdUrl}" title="${safeName}">
                <div class="file-link-content">
                    <span class="file-title">${safeName}</span>
                    <div class="file-metadata">
                        <span class="file-last-modified">${SidebarUtils.formatDate(file.last_modified)}</span>
                        <span class="metadata-separator"> • </span>
                        <span class="file-size">${SidebarUtils.formatFileSize(file.file_size ?? 0)}</span>
                    </div>
                </div>
            </a>
            <button type="button" class="file-actions-button" title="File actions" aria-haspopup="true" aria-expanded="false">&#x22EE;</button>
            <div class="file-actions-menu" role="menu" aria-hidden="true">
                <ul>
                    <li><a href="#" class="rename-file-link" data-file-id="${safeIdAttr}" data-file-name="${safeName}">Rename</a></li>
                    <li><a href="#" class="download-file-link" data-file-id="${safeIdAttr}" data-file-name="${safeName}">Download as JSON</a></li>
                    <li><a href="#" class="delete-file-link" data-file-id="${safeIdAttr}" data-file-name="${safeName}">Delete</a></li>
                </ul>
            </div>
        </li>
    `;
}

const loadUserFiles = async function() {
    const fileList = document.getElementById('sidebar-file-list');
    if (!fileList) return;
    
    fileList.innerHTML = '<li><span class="loading-text">Loading files...</span></li>';
    
    try {
        const result = await userManager.listUserFiles();
        if (!result.success) throw new Error(result.error);
        
        const currentFileId = SidebarUtils.getCurrentFileId();
        
        if (!result.files?.length) {
            fileList.innerHTML = '<li><span class="info-text">No files found.</span></li>';
            return;
        }
        
        fileList.innerHTML = result.files
            .map(file => createFileItem(file, file.id === currentFileId))
            .join('');
            
    } catch (error) {
        console.error('Error loading files:', error);
        fileList.innerHTML = '<li><span class="error-text">Error loading files.</span></li>';
    }
};

const ModalManager = {
    init() {
        window.addEventListener('click', this.handleModalBackdropClick.bind(this));
    },
    handleModalBackdropClick(event) {
        const modals = [
            'renameFileModal',
            'deleteSidebarFileModal', 
            'createBlankFileModal',
            'createFromJsonModal',
            'imageUrlModal'
        ];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && event.target === modal) {
                modal.style.display = 'none';
                // Clean up pending JSON data if closing the createFromJsonModal
                if (modalId === 'createFromJsonModal') {
                    window.pendingJsonData = null;
                }
            }
        });
    }
};

const SidebarResizer = {
    minWidth: 200,
    maxWidth: 800,
    currentWidth: 400,
    isResizing: false,
    init(elements) {
        this.elements = elements;
        this.setupEventListeners();
        this.setInitialState();
    },
    setupEventListeners() {
        const { hamburgerBtn, mainContent, resizer } = this.elements;
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', this.handleHamburgerClick.bind(this));
        }
        if (mainContent) {
            mainContent.addEventListener('click', this.handleMainContentClick.bind(this));
        }
        if (resizer) {
            resizer.addEventListener('mousedown', this.handleResizeStart.bind(this));
        }
    },

    setInitialState() {
        this.applyWidthWithTransition(this.currentWidth);
        loadUserFiles(); 
    },

    handleHamburgerClick(e) {
        e.stopPropagation();
        document.body.classList.toggle('sidebar-open');
        this.applyWidthWithTransition(this.currentWidth);
    },

    handleMainContentClick() {
        if (document.body.classList.contains('sidebar-open') && !this.isResizing) {
            document.body.classList.remove('sidebar-open');
            this.applyWidthWithTransition(this.currentWidth);
        }
    },

    handleResizeStart(e) {
        this.isResizing = true;
        document.body.classList.add('no-select');
        this._onMouseMove ||= this.handleMouseMove.bind(this);
        this._onMouseUp   ||= this.handleResizeEnd.bind(this);
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
    },

    handleMouseMove(e) {
        if (!this.isResizing) return;
        const newWidth = e.clientX;
        this.applyWidthImmediate(newWidth);
    },

    applyWidthImmediate(width) {
        const { sidebar } = this.elements;
        if (!sidebar) return;
        const clampedWidth = Math.max(this.minWidth, Math.min(width, this.maxWidth));
        sidebar.style.transition = 'none';
        sidebar.style.width = `${clampedWidth}px`;
        sidebar.style.left = document.body.classList.contains('sidebar-open') ? '0px' : `-${clampedWidth}px`;
        this.currentWidth = clampedWidth;
    },

    handleResizeEnd() {
        if (this.isResizing) {
            this.isResizing = false;
            document.body.classList.remove('no-select');
            if (this._onMouseMove) document.removeEventListener('mousemove', this._onMouseMove);
            if (this._onMouseUp)   document.removeEventListener('mouseup', this._onMouseUp);
            this.applyWidthWithTransition(this.currentWidth);
        }
    },

    applyWidthWithTransition(width) {
        const { sidebar } = this.elements;
        if (!sidebar) return;

        const clampedWidth = Math.max(this.minWidth, Math.min(width, this.maxWidth));
        sidebar.style.transition = 'width 0.3s ease, left 0.3s ease';
        sidebar.style.width = `${clampedWidth}px`;
        
        if (document.body.classList.contains('sidebar-open')) {
            sidebar.style.left = '0px';
        } else {
            sidebar.style.left = `-${clampedWidth}px`;
        }
        
        this.currentWidth = clampedWidth;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ModalManager.init();

    const elements = {
        hamburgerBtn: document.getElementById('hamburgerBtn'),
        sidebar: document.getElementById('sidebar'),
        mainContent: document.getElementById('main-content'),
        resizer: document.getElementById('sidebar-resizer')
    };

    const missingElements = Object.entries(elements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);

    if (missingElements.length > 0) {
        console.error('Missing required sidebar elements:', missingElements);
        return;
    }

    SidebarResizer.init(elements);

    initializeDocumentClickHandlers();
});

function initializeDocumentClickHandlers() {
    document.addEventListener('click', (e) => {
        const openActionMenus = document.querySelectorAll('.file-actions-menu');
        openActionMenus.forEach(menu => {
            if (menu.style.display === 'block' && 
                !e.target.closest('.file-actions-button') && 
                !menu.contains(e.target)) {
                menu.style.display = 'none';
            }
        });
    });
}

export { SidebarUtils, loadUserFiles };
