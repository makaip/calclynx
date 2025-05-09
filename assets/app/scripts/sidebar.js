// Use the globally available supabaseClient from initsupabaseapp.js

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        console.error('Error formatting date:', e);
        return 'Invalid date';
    }
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return 'N/A';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    if (i < 0) return '0 B'; // Handle very small numbers if log is negative
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Make loadUserFiles globally accessible
window.loadUserFiles = async function() {
    const sidebarFileList = document.getElementById('sidebar-file-list');
    if (!sidebarFileList) {
        console.error("Sidebar file list element not found.");
        return;
    }

    sidebarFileList.innerHTML = '<li><span class="loading-text">Loading files...</span></li>'; // Show loading indicator

    try {
        // Access the global supabaseClient directly
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

        if (sessionError || !session) {
            console.warn("No user session found. Cannot load files.");
            sidebarFileList.innerHTML = '<li><span class="error-text">Log in to see files.</span></li>';
            return;
        }

        const userId = session.user.id;
        // Access the global supabaseClient directly
        const { data: files, error: filesError } = await supabaseClient
            .from('files')
            .select('id, file_name, last_modified, file_size') // Fetch last_modified and file_size
            .eq('user_id', userId)
            .order('file_name', { ascending: true });

        if (filesError) {
            throw filesError;
        }

        sidebarFileList.innerHTML = ''; // Clear loading/error message

        if (!files || files.length === 0) {
            sidebarFileList.innerHTML = '<li><span class="info-text">No files found.</span></li>';
            return;
        }

        // Get current file ID from URL to highlight it
        const urlParams = new URLSearchParams(window.location.search);
        const currentFileId = urlParams.get('fileId');

        files.forEach(file => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `/app.html?fileId=${file.id}`;
            a.title = file.file_name || 'Untitled'; // Tooltip for long names

            // Create a wrapper for title and metadata
            const fileLinkContent = document.createElement('div');
            fileLinkContent.classList.add('file-link-content');

            // Create title span
            const titleSpan = document.createElement('span');
            titleSpan.classList.add('file-title');
            titleSpan.textContent = file.file_name || 'Untitled';
            fileLinkContent.appendChild(titleSpan);

            // Create metadata div
            const metadataDiv = document.createElement('div');
            metadataDiv.classList.add('file-metadata');

            const lastModifiedSpan = document.createElement('span');
            lastModifiedSpan.classList.add('file-last-modified');
            lastModifiedSpan.textContent = formatDate(file.last_modified);

            const separatorSpan = document.createElement('span');
            separatorSpan.classList.add('metadata-separator');
            separatorSpan.textContent = ' • ';

            const fileSizeSpan = document.createElement('span');
            fileSizeSpan.classList.add('file-size');
            fileSizeSpan.textContent = formatFileSize(file.file_size || 0);

            metadataDiv.appendChild(lastModifiedSpan);
            metadataDiv.appendChild(separatorSpan);
            metadataDiv.appendChild(fileSizeSpan);
            fileLinkContent.appendChild(metadataDiv);

            a.appendChild(fileLinkContent); // Add content wrapper to link

            if (file.id === currentFileId) {
                a.classList.add('active'); // Highlight current file
            }

            // --- Add triple-dot action button ---
            const actionButton = document.createElement('button');
            actionButton.classList.add('file-actions-button');
            actionButton.innerHTML = '&#x22EE;'; // Vertical ellipsis (⋮)
            actionButton.title = 'File actions';
            a.appendChild(actionButton); // Append button to the <a> tag

            li.appendChild(a); // Append link (now containing content and button) to list item

            const actionMenu = document.createElement('div');
            actionMenu.classList.add('file-actions-menu');
            actionMenu.innerHTML = `
                <ul>
                    <li><a href="#" class="rename-file-link" data-file-id="${file.id}" data-file-name="${file.file_name || 'Untitled'}">Rename</a></li>
                    <li><a href="#" class="delete-file-link" data-file-id="${file.id}" data-file-name="${file.file_name || 'Untitled'}">Delete</a></li>
                </ul>
            `;
            li.appendChild(actionMenu);

            actionButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent li click event and sidebar closing
                e.preventDefault(); // Prevent default button behavior
                // Hide all other open menus before showing this one
                document.querySelectorAll('.file-actions-menu').forEach(menu => {
                    if (menu !== actionMenu) {
                        menu.style.display = 'none';
                    }
                });
                actionMenu.style.display = actionMenu.style.display === 'block' ? 'none' : 'block';
            });

            actionMenu.querySelector('.rename-file-link').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                actionMenu.style.display = 'none';
                const fileId = e.target.dataset.fileId;
                const fileName = e.target.dataset.fileName;
                handleRenameFileClick(fileId, fileName);
            });

            actionMenu.querySelector('.delete-file-link').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                actionMenu.style.display = 'none';
                const fileId = e.target.dataset.fileId;
                const fileName = e.target.dataset.fileName;
                handleDeleteFileClick(fileId, fileName);
            });
            // --- End action button and menu ---

            sidebarFileList.appendChild(li);
        });

        // Close action menus if clicking outside of them or their buttons
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.file-actions-button') && !e.target.closest('.file-actions-menu')) {
                document.querySelectorAll('.file-actions-menu').forEach(menu => {
                    menu.style.display = 'none';
                });
            }
        });

    } catch (error) {
        console.error("Error loading user files:", error);
        sidebarFileList.innerHTML = '<li><span class="error-text">Error loading files.</span></li>';
    }
};

// --- Rename File Modal Logic ---
const renameFileModal = document.getElementById('renameFileModal');
const closeRenameFileModalBtn = document.getElementById('closeRenameFileModal');
const cancelRenameFileBtn = document.getElementById('cancelRenameFileButton');
const confirmRenameFileBtn = document.getElementById('confirmRenameFileButton');
const newFileNameInput = document.getElementById('newFileNameInput');
const renameErrorMessage = document.getElementById('rename-error-message');
let fileIdToRename = null;

function handleRenameFileClick(fileId, currentName) {
    fileIdToRename = fileId;
    if (newFileNameInput) newFileNameInput.value = currentName;
    if (renameErrorMessage) renameErrorMessage.style.display = 'none';
    if (renameFileModal) renameFileModal.style.display = 'block';
    if (newFileNameInput) newFileNameInput.focus();
}

if (closeRenameFileModalBtn) {
    closeRenameFileModalBtn.addEventListener('click', () => {
        if (renameFileModal) renameFileModal.style.display = 'none';
    });
}
if (cancelRenameFileBtn) {
    cancelRenameFileBtn.addEventListener('click', () => {
        if (renameFileModal) renameFileModal.style.display = 'none';
    });
}

if (confirmRenameFileBtn) {
    confirmRenameFileBtn.addEventListener('click', async () => {
        const newName = newFileNameInput ? newFileNameInput.value.trim() : '';
        if (!newName) {
            if (renameErrorMessage) {
                renameErrorMessage.textContent = 'File name cannot be empty.';
                renameErrorMessage.style.display = 'block';
            }
            return;
        }
        if (renameErrorMessage) renameErrorMessage.style.display = 'none';

        try {
            confirmRenameFileBtn.disabled = true;
            confirmRenameFileBtn.textContent = 'Renaming...';
            if (window.mathBoard && window.mathBoard.fileManager) {
                await window.mathBoard.fileManager.renameFile(fileIdToRename, newName);
            } else {
                throw new Error("FileManager not available.");
            }
            if (renameFileModal) renameFileModal.style.display = 'none';
            if (typeof window.loadUserFiles === 'function') window.loadUserFiles(); 
            // If the current file was renamed, fileManager.renameFile handles title update via this.updateFileTitle()
        } catch (error) {
            console.error('Error renaming file:', error);
            if (renameErrorMessage) {
                renameErrorMessage.textContent = error.message || 'Failed to rename file.';
                renameErrorMessage.style.display = 'block';
            }
        } finally {
            confirmRenameFileBtn.disabled = false;
            confirmRenameFileBtn.textContent = 'Rename';
        }
    });
}


// --- Delete File Confirmation Modal Logic (Sidebar) ---
const deleteSidebarFileModal = document.getElementById('deleteSidebarFileModal');
const closeDeleteSidebarFileModalBtn = document.getElementById('closeDeleteSidebarFileModal');
const cancelDeleteSidebarFileBtn = document.getElementById('cancelDeleteSidebarFileButton');
const confirmDeleteSidebarFileBtn = document.getElementById('confirmDeleteSidebarFileButton');
const fileNameToDeleteSidebarElement = document.getElementById('fileNameToDeleteSidebar');
const doNotAskAgainDeleteFileCheckbox = document.getElementById('doNotAskAgainDeleteFile');
const deleteSidebarFileErrorMessage = document.getElementById('delete-sidebar-file-error-message');
let fileIdToDeleteFromSidebar = null;

function handleDeleteFileClick(fileId, fileName) {
    fileIdToDeleteFromSidebar = fileId;
    if (fileNameToDeleteSidebarElement) fileNameToDeleteSidebarElement.textContent = fileName;
    if (deleteSidebarFileErrorMessage) deleteSidebarFileErrorMessage.style.display = 'none';
    if (doNotAskAgainDeleteFileCheckbox) doNotAskAgainDeleteFileCheckbox.checked = false;

    if (sessionStorage.getItem('doNotAskAgainDeleteFile') === 'true') {
        confirmActualFileDelete(); 
    } else {
        if (deleteSidebarFileModal) deleteSidebarFileModal.style.display = 'block';
    }
}

if (closeDeleteSidebarFileModalBtn) {
    closeDeleteSidebarFileModalBtn.addEventListener('click', () => {
        if (deleteSidebarFileModal) deleteSidebarFileModal.style.display = 'none';
    });
}
if (cancelDeleteSidebarFileBtn) {
    cancelDeleteSidebarFileBtn.addEventListener('click', () => {
        if (deleteSidebarFileModal) deleteSidebarFileModal.style.display = 'none';
    });
}

if (confirmDeleteSidebarFileBtn) {
    confirmDeleteSidebarFileBtn.addEventListener('click', async () => {
        if (doNotAskAgainDeleteFileCheckbox && doNotAskAgainDeleteFileCheckbox.checked) {
            sessionStorage.setItem('doNotAskAgainDeleteFile', 'true');
        }
        await confirmActualFileDelete();
    });
}

async function confirmActualFileDelete() {
    if (!fileIdToDeleteFromSidebar) return;
    try {
        if (confirmDeleteSidebarFileBtn) {
            confirmDeleteSidebarFileBtn.disabled = true;
            confirmDeleteSidebarFileBtn.textContent = 'Deleting...';
        }
        if (window.mathBoard && window.mathBoard.fileManager) {
            await window.mathBoard.fileManager.deleteFile(fileIdToDeleteFromSidebar);
        } else {
            throw new Error("FileManager not available.");
        }
        
        if (deleteSidebarFileModal) deleteSidebarFileModal.style.display = 'none';
        if (typeof window.loadUserFiles === 'function') window.loadUserFiles();

        const urlParams = new URLSearchParams(window.location.search);
        const currentFileId = urlParams.get('fileId');
        if (currentFileId === fileIdToDeleteFromSidebar) {
            window.location.href = '/app.html'; 
        }

    } catch (error) {
        console.error('Error deleting file from sidebar:', error);
        if (deleteSidebarFileErrorMessage) {
            deleteSidebarFileErrorMessage.textContent = error.message || 'Failed to delete file.';
            deleteSidebarFileErrorMessage.style.display = 'block';
        }
    } finally {
        if (confirmDeleteSidebarFileBtn) {
            confirmDeleteSidebarFileBtn.disabled = false;
            confirmDeleteSidebarFileBtn.textContent = 'Delete File';
        }
    }
}

// Close modals when clicking outside of their content area
window.addEventListener('click', (event) => {
    if (renameFileModal && event.target === renameFileModal) {
        renameFileModal.style.display = 'none';
    }
    if (deleteSidebarFileModal && event.target === deleteSidebarFileModal) {
        deleteSidebarFileModal.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const resizer = document.getElementById('sidebar-resizer');
    const body = document.body;
    const minWidth = 200; // Minimum sidebar width
    const maxWidth = 800; // Maximum sidebar width
    
    // Add settings link handler
    const settingsLink = document.getElementById('settings-link');
    const settingsModal = document.getElementById('settings-modal');
    
    if (settingsLink && settingsModal) {
        settingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            settingsModal.style.display = 'block';
        });
    }

    let isResizing = false;
    let currentSidebarWidth = 400; // Initial width

    if (hamburgerBtn && sidebar && mainContent && resizer) {
        // Function to apply width changes WITHOUT transition
        const applyWidthImmediate = (width) => {
            const clampedWidth = Math.max(minWidth, Math.min(width, maxWidth));
            sidebar.style.transition = 'none'; // Disable transition during drag
            sidebar.style.width = `${clampedWidth}px`;
            if (body.classList.contains('sidebar-open')) {
                sidebar.style.left = '0px';
            } else {
                 sidebar.style.left = `-${clampedWidth}px`;
            }
            currentSidebarWidth = clampedWidth;
        };

        // Function to set initial/final state WITH transition
        const applyWidthWithTransition = (width) => {
             const clampedWidth = Math.max(minWidth, Math.min(width, maxWidth));
             // Ensure transitions are enabled
             sidebar.style.transition = 'width 0.3s ease, left 0.3s ease';
             sidebar.style.width = `${clampedWidth}px`;
             if (body.classList.contains('sidebar-open')) {
                 sidebar.style.left = '0px';
             } else {
                  sidebar.style.left = `-${clampedWidth}px`;
             }
             currentSidebarWidth = clampedWidth;
        };

        // Set initial state based on currentSidebarWidth
        applyWidthWithTransition(currentSidebarWidth); // Use function with transition for init

        // Load user files when the sidebar is ready
        loadUserFiles(); // Call the global function

        // Toggle sidebar on hamburger button click
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            body.classList.toggle('sidebar-open');
            // Apply width with transition handles the logic now
            applyWidthWithTransition(currentSidebarWidth);
        });

        // Close sidebar if clicking on the main content area
        mainContent.addEventListener('click', () => {
            if (body.classList.contains('sidebar-open') && !isResizing) {
                body.classList.remove('sidebar-open');
                // Apply width with transition handles the logic now
                applyWidthWithTransition(currentSidebarWidth);
            }
        });

        // Resizer logic
        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            body.classList.add('no-select'); // Prevent text selection
            // Transitions are disabled within applyWidthImmediate
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });

        const handleMouseMove = (e) => {
            if (!isResizing) return;
            let newWidth = e.clientX;
            applyWidthImmediate(newWidth); // Use immediate application during drag
        };

        const handleMouseUp = () => {
            if (isResizing) {
                isResizing = false;
                body.classList.remove('no-select'); // Re-enable text selection
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                // Re-enable transitions by calling the appropriate function
                applyWidthWithTransition(currentSidebarWidth);
            }
        };

    } else {
        console.error('Sidebar or resizer elements not found');
    }
});
