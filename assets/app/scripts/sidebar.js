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

            // Create title span
            const titleSpan = document.createElement('span');
            titleSpan.classList.add('file-title');
            titleSpan.textContent = file.file_name || 'Untitled';

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

            a.appendChild(titleSpan);
            a.appendChild(metadataDiv);

            if (file.id === currentFileId) {
                a.classList.add('active'); // Highlight current file
            }

            li.appendChild(a);
            sidebarFileList.appendChild(li);
        });

    } catch (error) {
        console.error("Error loading user files:", error);
        sidebarFileList.innerHTML = '<li><span class="error-text">Error loading files.</span></li>';
    }
};

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
