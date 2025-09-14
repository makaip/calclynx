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

// Helper function to generate UUID - this is now global
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
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

            li.appendChild(a); // Append link to list item
            a.appendChild(fileLinkContent); // Add content wrapper to link

            if (file.id === currentFileId) {
                li.classList.add('active'); // Highlight current file by adding class to li
            }

            // --- Add triple-dot action button ---
            const actionButton = document.createElement('button');
            actionButton.classList.add('file-actions-button');
            actionButton.innerHTML = '&#x22EE;'; // Vertical ellipsis (⋮)
            actionButton.title = 'File actions';
            li.appendChild(actionButton); // Append button to the li tag, not the a tag

            const actionMenu = document.createElement('div');
            actionMenu.classList.add('file-actions-menu');
            actionMenu.innerHTML = `
                <ul>
                    <li><a href="#" class="rename-file-link" data-file-id="${file.id}" data-file-name="${file.file_name || 'Untitled'}">Rename</a></li>
                    <li><a href="#" class="download-file-link" data-file-id="${file.id}" data-file-name="${file.file_name || 'Untitled'}">Download as JSON</a></li>
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

            actionMenu.querySelector('.download-file-link').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                actionMenu.style.display = 'none';
                const fileId = e.target.dataset.fileId;
                const fileName = e.target.dataset.fileName;
                if (typeof window.handleDownloadFileClick === 'function') {
                    window.handleDownloadFileClick(fileId, fileName);
                } else {
                    console.error('handleDownloadFileClick function not found.');
                }
            });

            actionMenu.querySelector('.rename-file-link').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                actionMenu.style.display = 'none';
                const fileId = e.target.dataset.fileId;
                const fileName = e.target.dataset.fileName;
                // Call the globally defined handler from sidebar-file-actions.js
                if (typeof window.handleRenameFileClick === 'function') {
                    window.handleRenameFileClick(fileId, fileName);
                } else {
                    console.error('handleRenameFileClick function not found.');
                }
            });

            actionMenu.querySelector('.delete-file-link').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                actionMenu.style.display = 'none';
                const fileId = e.target.dataset.fileId;
                const fileName = e.target.dataset.fileName;
                // Call the globally defined handler from sidebar-file-actions.js
                if (typeof window.handleDeleteFileClick === 'function') {
                    window.handleDeleteFileClick(fileId, fileName);
                } else {
                    console.error('handleDeleteFileClick function not found.');
                }
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

// Close modals when clicking outside of their content area
window.addEventListener('click', (event) => {
    const renameFileModalInstance = document.getElementById('renameFileModal');
    if (renameFileModalInstance && event.target === renameFileModalInstance) {
        renameFileModalInstance.style.display = 'none';
    }
    const deleteSidebarFileModalInstance = document.getElementById('deleteSidebarFileModal');
    if (deleteSidebarFileModalInstance && event.target === deleteSidebarFileModalInstance) {
        deleteSidebarFileModalInstance.style.display = 'none';
    }
    const createBlankFileModalInstance = document.getElementById('createBlankFileModal');
    if (createBlankFileModalInstance && event.target === createBlankFileModalInstance) {
        createBlankFileModalInstance.style.display = 'none';
    }
    const imageUrlModalInstance = document.getElementById('imageUrlModal');
    if (imageUrlModalInstance && event.target === imageUrlModalInstance) {
        imageUrlModalInstance.style.display = 'none';
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

    // Consolidated click listener to close dropdowns/menus
    // This one specifically handles the file action menus from loadUserFiles
    document.addEventListener('click', (e) => {
        // Close file action menus
        const openActionMenus = document.querySelectorAll('.file-actions-menu');
        openActionMenus.forEach(menu => {
            if (menu.style.display === 'block' && !e.target.closest('.file-actions-button') && !menu.contains(e.target)) {
                menu.style.display = 'none';
            }
        });
        // Note: New file dropdown closing is handled in sidebar-ui-interactions.js
    });

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
