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
        return `<div class="list-group-item text-secondary"><span class="loading-text">${message}</span></div>`;
    },

    createErrorIndicator(message = 'Error loading files.') {
        return `<div class="list-group-item text-danger"><span class="error-text">${message}</span></div>`;
    },

    createInfoIndicator(message = 'No files found.') {
        return `<div class="list-group-item text-secondary"><span class="info-text">${message}</span></div>`;
    }
};

function createFileItem(file, isActive = false) {
    const safeName = SidebarUtils.escapeHtml(file?.file_name ?? 'Untitled');
    const safeIdAttr = SidebarUtils.escapeHtml(String(file?.id ?? ''));
    const safeIdUrl = encodeURIComponent(String(file?.id ?? ''));
    return `
        <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${isActive ? 'active' : ''}">
            <a href="/app.html?fileId=${safeIdUrl}" title="${safeName}" 
               class="text-decoration-none flex-grow-1 file-link-content">
                <div class="file-content">
                    <div class="file-title fw-medium mb-1">${safeName}</div>
                    <div class="file-metadata small">
                        <span class="file-last-modified">${SidebarUtils.formatDate(file.last_modified)}</span>
                        <span class="metadata-separator"> • </span>
                        <span class="file-size">${SidebarUtils.formatFileSize(file.file_size ?? 0)}</span>
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

const loadUserFiles = async function() {
    const fileList = document.getElementById('sidebar-file-list');
    if (!fileList) return;
    
    fileList.innerHTML = SidebarUtils.createLoadingIndicator();
    
    try {
        const result = await userManager.listUserFiles();
        if (!result.success) throw new Error(result.error);
        
        const currentFileId = SidebarUtils.getCurrentFileId();
        
        if (!result.files?.length) {
            fileList.innerHTML = SidebarUtils.createInfoIndicator();
            return;
        }
        
        fileList.innerHTML = result.files
            .map(file => createFileItem(file, file.id === currentFileId))
            .join('');
            
    } catch (error) {
        console.error('Error loading files:', error);
        fileList.innerHTML = SidebarUtils.createErrorIndicator();
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
        this.showSidebar();
        loadUserFiles(); 
    },

    handleHamburgerClick(e) {
        e.stopPropagation();
        const { sidebar } = this.elements;
        if (sidebar) {
            if (document.body.classList.contains('sidebar-open')) {
                this.hideSidebar();
            } else {
                this.showSidebar();
            }
        }
    },

    handleMainContentClick() {
        if (document.body.classList.contains('sidebar-open') && !this.isResizing) {
            this.hideSidebar();
        }
    },

    showSidebar() {
        const { sidebar } = this.elements;
        const mainContent = document.getElementById('main-content');
        
        if (sidebar) {
            sidebar.style.transform = 'translateX(0)';
            document.body.classList.add('sidebar-open');
            
            if (mainContent) {
                mainContent.style.marginLeft = `${this.currentWidth}px`;
            }
        }
    },

    hideSidebar() {
        const { sidebar } = this.elements;
        const mainContent = document.getElementById('main-content');
        
        if (sidebar) {
            sidebar.style.transform = `translateX(-${this.currentWidth}px)`;
            document.body.classList.remove('sidebar-open');
            
            if (mainContent) {
                mainContent.style.marginLeft = '0';
            }
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
        
        const mainContent = document.getElementById('main-content');
        if (document.body.classList.contains('sidebar-open')) {
            sidebar.style.transform = 'translateX(0)';
            if (mainContent) {
                mainContent.style.marginLeft = `${clampedWidth}px`;
            }
        } else {
            sidebar.style.transform = `translateX(-${clampedWidth}px)`;
            if (mainContent) {
                mainContent.style.marginLeft = '0';
            }
        }
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
        sidebar.style.transition = 'width 0.3s ease, transform 0.3s ease';
        sidebar.style.width = `${clampedWidth}px`;
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.transition = 'margin-left 0.3s ease';
        }
        
        if (document.body.classList.contains('sidebar-open')) {
            sidebar.style.transform = 'translateX(0)';
            if (mainContent) {
                mainContent.style.marginLeft = `${clampedWidth}px`;
            }
        } else {
            sidebar.style.transform = `translateX(-${clampedWidth}px)`;
            if (mainContent) {
                mainContent.style.marginLeft = '0';
            }
        }
        
        this.currentWidth = clampedWidth;
    }
};

document.addEventListener('DOMContentLoaded', () => {
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
