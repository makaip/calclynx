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

const FileListManager = {
    createFileLinkContent(file) {
        const fileLinkContent = document.createElement('div');
        fileLinkContent.classList.add('file-link-content');
        const titleSpan = document.createElement('span');
        titleSpan.classList.add('file-title');
        titleSpan.textContent = file.file_name || 'Untitled';
        fileLinkContent.appendChild(titleSpan);
        const metadataDiv = document.createElement('div');
        metadataDiv.classList.add('file-metadata');
        const lastModifiedSpan = document.createElement('span');
        lastModifiedSpan.classList.add('file-last-modified');
        lastModifiedSpan.textContent = SidebarUtils.formatDate(file.last_modified);
        const separatorSpan = document.createElement('span');
        separatorSpan.classList.add('metadata-separator');
        separatorSpan.textContent = ' • ';
        const fileSizeSpan = document.createElement('span');
        fileSizeSpan.classList.add('file-size');
        fileSizeSpan.textContent = SidebarUtils.formatFileSize(file.file_size || 0);
        metadataDiv.appendChild(lastModifiedSpan);
        metadataDiv.appendChild(separatorSpan);
        metadataDiv.appendChild(fileSizeSpan);
        fileLinkContent.appendChild(metadataDiv);
        return fileLinkContent;
    },

    createActionMenu(file) {
        const actionMenu = document.createElement('div');
        actionMenu.classList.add('file-actions-menu');
        actionMenu.innerHTML = `
            <ul>
                <li><a href="#" class="rename-file-link" data-file-id="${file.id}" data-file-name="${file.file_name || 'Untitled'}">Rename</a></li>
                <li><a href="#" class="download-file-link" data-file-id="${file.id}" data-file-name="${file.file_name || 'Untitled'}">Download as JSON</a></li>
                <li><a href="#" class="delete-file-link" data-file-id="${file.id}" data-file-name="${file.file_name || 'Untitled'}">Delete</a></li>
            </ul>
        `;
        return actionMenu;
    },

    attachActionMenuListeners(actionMenu, actionButton) {
        actionButton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            document.querySelectorAll('.file-actions-menu').forEach(menu => {
                if (menu !== actionMenu) {
                    menu.style.display = 'none';
                }
            });
            actionMenu.style.display = actionMenu.style.display === 'block' ? 'none' : 'block';
        });
        this.attachActionHandlers(actionMenu);
    },

    attachActionHandlers(actionMenu) {
        const downloadLink = actionMenu.querySelector('.download-file-link');
        const renameLink = actionMenu.querySelector('.rename-file-link');
        const deleteLink = actionMenu.querySelector('.delete-file-link');
        if (downloadLink) {
            downloadLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                actionMenu.style.display = 'none';
                const fileId = e.target.dataset.fileId;
                const fileName = e.target.dataset.fileName;
                if (typeof window.handleDownloadFileClick === 'function') {
                    window.handleDownloadFileClick(fileId, fileName);
                } else {
                    console.error('handleDownloadFileClick function not found');
                }
            });
        }

        if (renameLink) {
            renameLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                actionMenu.style.display = 'none';
                const fileId = e.target.dataset.fileId;
                const fileName = e.target.dataset.fileName;
                if (typeof window.handleRenameFileClick === 'function') {
                    window.handleRenameFileClick(fileId, fileName);
                } else {
                    console.error('handleRenameFileClick function not found');
                }
            });
        }

        if (deleteLink) {
            deleteLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                actionMenu.style.display = 'none';
                const fileId = e.target.dataset.fileId;
                const fileName = e.target.dataset.fileName;
                if (typeof window.handleDeleteFileClick === 'function') {
                    window.handleDeleteFileClick(fileId, fileName);
                } else {
                    console.error('handleDeleteFileClick function not found');
                }
            });
        }
    },

    createFileListItem(file, currentFileId) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `/app.html?fileId=${file.id}`;
        a.title = file.file_name || 'Untitled';
        const fileLinkContent = this.createFileLinkContent(file);
        a.appendChild(fileLinkContent);
        li.appendChild(a);
        if (file.id === currentFileId) {
            li.classList.add('active');
        }
        const actionButton = document.createElement('button');
        actionButton.classList.add('file-actions-button');
        actionButton.innerHTML = '&#x22EE;';
        actionButton.title = 'File actions';
        li.appendChild(actionButton);
        const actionMenu = this.createActionMenu(file);
        li.appendChild(actionMenu);
        this.attachActionMenuListeners(actionMenu, actionButton);
        return li;
    }
};

window.loadUserFiles = async function() {
    const sidebarFileList = document.getElementById('sidebar-file-list');
    if (!sidebarFileList) {
        console.error("Sidebar file list element not found");
        return;
    }
    console.debug("Loading user files");
    sidebarFileList.innerHTML = SidebarUtils.createLoadingIndicator();
    try {
        const result = await userManager.listUserFiles();
        if (!result.success) {
            console.error("Failed to load files:", result.error);
            sidebarFileList.innerHTML = SidebarUtils.createErrorIndicator('Failed to load files.');
            return;
        }
        const files = result.files;
        sidebarFileList.innerHTML = '';
        if (!files || files.length === 0) {
            console.log("No files found");
            sidebarFileList.innerHTML = SidebarUtils.createInfoIndicator();
            return;
        }
        const currentFileId = SidebarUtils.getCurrentFileId();
        console.log(`Loading ${files.length} files`, { currentFileId });
        files.forEach(file => {
            const listItem = FileListManager.createFileListItem(file, currentFileId);
            sidebarFileList.appendChild(listItem);
        });
        initializeActionMenuClickHandler();
        console.debug("User files loaded successfully");
    } catch (error) {
        console.error("Error loading user files:", error);
        sidebarFileList.innerHTML = SidebarUtils.createErrorIndicator();
    }
};

function initializeActionMenuClickHandler() {
    document.removeEventListener('click', handleActionMenuClose);
    document.addEventListener('click', handleActionMenuClose);
}

function handleActionMenuClose(e) {
    if (!e.target.closest('.file-actions-button') && !e.target.closest('.file-actions-menu')) {
        document.querySelectorAll('.file-actions-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
}

const ModalManager = {
    init() {
        window.addEventListener('click', this.handleModalBackdropClick.bind(this));
    },
    handleModalBackdropClick(event) {
        const modals = [
            'renameFileModal',
            'deleteSidebarFileModal', 
            'createBlankFileModal',
            'imageUrlModal'
        ];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && event.target === modal) {
                modal.style.display = 'none';
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
        window.loadUserFiles(); 
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
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleResizeEnd.bind(this));
    },

    handleMouseMove(e) {
        if (!this.isResizing) return;
        const newWidth = e.clientX;
        this.applyWidthImmediate(newWidth);
    },

    handleResizeEnd() {
        if (this.isResizing) {
            this.isResizing = false;
            document.body.classList.remove('no-select');
            document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
            document.removeEventListener('mouseup', this.handleResizeEnd.bind(this));
            this.applyWidthWithTransition(this.currentWidth);
        }
    },

    applyWidthImmediate(width) {
        const { sidebar } = this.elements;
        if (!sidebar) return;

        const clampedWidth = Math.max(this.minWidth, Math.min(width, this.maxWidth));
        sidebar.style.transition = 'none';
        sidebar.style.width = `${clampedWidth}px`;
        
        if (document.body.classList.contains('sidebar-open')) {
            sidebar.style.left = '0px';
        } else {
            sidebar.style.left = `-${clampedWidth}px`;
        }
        
        this.currentWidth = clampedWidth;
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
