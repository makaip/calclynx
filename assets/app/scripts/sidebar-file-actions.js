// This file handles modal interactions for file operations (Rename, Delete, Create)

// Ensure this script runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("sidebar-file-actions.js: DOMContentLoaded"); // Log DOMContentLoaded

    // --- Rename File Modal Logic ---
    const renameFileModal = document.getElementById('renameFileModal');
    const closeRenameFileModalBtn = document.getElementById('closeRenameFileModal');
    const cancelRenameFileBtn = document.getElementById('cancelRenameFileButton');
    const confirmRenameFileBtn = document.getElementById('confirmRenameFileButton');
    const newFileNameInput = document.getElementById('newFileNameInput');
    const renameErrorMessage = document.getElementById('rename-error-message');
    let fileIdToRename = null;

    window.handleDownloadFileClick = async function(fileId, fileName) {
        try {
            const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
            if (sessionError || !session) {
                console.error("User not logged in, cannot download file.");
                alert("You must be logged in to download files.");
                return;
            }
            const userId = session.user.id;
            const filePath = `${userId}/${fileId}.json`;

            const { data: blob, error: downloadError } = await supabaseClient
                .storage
                .from('storage')
                .download(filePath);

            if (downloadError) {
                throw downloadError;
            }

            if (!blob) {
                throw new Error("File not found or empty.");
            }

            const link = document.createElement('a');
            const url = window.URL.createObjectURL(blob);
            link.href = url;
            link.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error downloading file:", error);
            alert(`Error downloading file: ${error.message}`);
        }
    }

    window.handleRenameFileClick = function(fileId, currentName) {
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

    window.handleDeleteFileClick = function(fileId, fileName) {
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

    // --- Create Blank File Modal Elements & Logic ---
    const createBlankFileModal = document.getElementById('createBlankFileModal');
    const closeCreateBlankFileModalBtn = document.getElementById('closeCreateBlankFileModal');
    const cancelCreateBlankFileBtn = document.getElementById('cancelCreateBlankFileButton');
    const confirmCreateBlankFileBtn = document.getElementById('confirmCreateBlankFileButton');
    const newBlankFileNameInput = document.getElementById('newBlankFileNameInput');
    const createBlankFileErrorMsg = document.getElementById('createBlankFile-error-message');

    console.log("sidebar-file-actions.js: confirmCreateBlankFileBtn element:", confirmCreateBlankFileBtn); // Log if button is found

    // Note: generateUUID is expected to be globally available from sidebar.js
    window.handleCreateBlankFile = async function() {
        console.log("sidebar-file-actions.js: handleCreateBlankFile invoked."); // Log function invocation

        if (!newBlankFileNameInput || !createBlankFileErrorMsg || !confirmCreateBlankFileBtn || !createBlankFileModal) {
            console.error("sidebar-file-actions.js: Create blank file modal elements not found within handleCreateBlankFile.");
            return;
        }

        const fileName = newBlankFileNameInput.value.trim();

        if (!fileName) {
            createBlankFileErrorMsg.textContent = 'File name cannot be empty.';
            createBlankFileErrorMsg.style.display = 'block';
            newBlankFileNameInput.focus();
            return;
        }
        createBlankFileErrorMsg.style.display = 'none';

        confirmCreateBlankFileBtn.disabled = true;
        confirmCreateBlankFileBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

        let currentUserId;
        try {
            const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
            if (sessionError || !session) {
                throw new Error("User session not found. Please log in again.");
            }
            currentUserId = session.user.id;

            const { data: existingFiles, error: checkError } = await supabaseClient
                .from('files')
                .select('id')
                .eq('user_id', currentUserId)
                .eq('file_name', fileName)
                .limit(1);

            if (checkError) throw new Error(`Error checking for existing file: ${checkError.message}`);
            if (existingFiles && existingFiles.length > 0) {
                createBlankFileErrorMsg.textContent = `File named "${fileName}" already exists.`;
                createBlankFileErrorMsg.style.display = 'block';
                newBlankFileNameInput.focus();
                confirmCreateBlankFileBtn.disabled = false;
                confirmCreateBlankFileBtn.innerHTML = 'Create File';
                return;
            }

            const fileId = generateUUID(); // generateUUID() is global from sidebar.js
            const filePath = `${currentUserId}/${fileId}.json`;
            const initialContent = JSON.stringify({}); 
            const initialBlob = new Blob([initialContent], { type: 'application/json' });
            const initialFileSize = initialBlob.size;

            const { error: storageError } = await supabaseClient.storage.from('storage').upload(filePath, initialBlob);
            if (storageError) throw new Error(`Storage error: ${storageError.message}`);

            const now = new Date().toISOString();
            const { error: dbError } = await supabaseClient
                .from('files')
                .insert({
                    id: fileId,
                    user_id: currentUserId,
                    file_name: fileName,
                    created_at: now,
                    last_modified: now,
                    file_size: initialFileSize
                });

            if (dbError) {
                await supabaseClient.storage.from('storage').remove([filePath]);
                throw new Error(`Database error: ${dbError.message}`);
            }

            createBlankFileModal.style.display = 'none';
            window.location.href = `/app.html?fileId=${fileId}`;

        } catch (error) {
            console.error('Error creating blank file:', error);
            createBlankFileErrorMsg.textContent = error.message || 'Failed to create file. Please try again.';
            createBlankFileErrorMsg.style.display = 'block';
        } finally {
            if (confirmCreateBlankFileBtn) {
                 confirmCreateBlankFileBtn.disabled = false;
                 confirmCreateBlankFileBtn.innerHTML = 'Create File';
            }
        }
    }

    if (closeCreateBlankFileModalBtn) {
        closeCreateBlankFileModalBtn.addEventListener('click', () => {
            if (createBlankFileModal) createBlankFileModal.style.display = 'none';
        });
    }
    if (cancelCreateBlankFileBtn) {
        cancelCreateBlankFileBtn.addEventListener('click', () => {
            if (createBlankFileModal) createBlankFileModal.style.display = 'none';
        });
    }

    if (confirmCreateBlankFileBtn) {
        console.log("sidebar-file-actions.js: Attaching click listener to confirmCreateBlankFileButton."); // Log listener attachment
        confirmCreateBlankFileBtn.addEventListener('click', () => {
            console.log("sidebar-file-actions.js: confirmCreateBlankFileButton clicked!"); // Log click event
            window.handleCreateBlankFile();
        });
    } else {
        console.error("sidebar-file-actions.js: confirmCreateBlankFileButton NOT FOUND in DOMContentLoaded. Listener not attached."); // Log if button not found
    }
});
