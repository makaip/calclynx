import { supabaseClient } from '../supabaseinit.js';
import { formatFileSize, formatDate, generateUUID } from './utils.js';
import { initializeCheckboxLogic } from './uiInteractions.js';

let fileTableBody = null;
let fileTableFooter = null;
let selectAllCheckbox = null; // Needed for re-initialization after render/delete

// --- DOM Elements (Modals) ---
const newFileModalElement = document.getElementById('newFileModal');
const newFileNameInput = document.getElementById('newFileNameInput');
const createFileButton = document.getElementById('createFileButton');
const newFileForm = document.getElementById('newFileForm');
const deleteConfirmModalElement = document.getElementById('deleteConfirmModal');
const fileNameToDeleteElement = document.getElementById('fileNameToDelete');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');

let currentUserId = null; // Store user ID for reuse

// Render files in the table
export function renderFiles(files) {
    if (!fileTableBody) fileTableBody = document.getElementById('fileTableBody');
    if (!fileTableFooter) fileTableFooter = document.getElementById('fileTableFooter');
    if (!selectAllCheckbox) selectAllCheckbox = document.getElementById('selectAllCheckbox');

    fileTableBody.innerHTML = ''; // Clear existing rows
    if (!files || files.length === 0) {
        fileTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No files found.</td></tr>';
        fileTableFooter.textContent = '0 files.';
        // Clear previous listener if any to avoid duplicates
        fileTableBody.removeEventListener('click', handleFileLinkClick);
        return;
    }

    files.forEach(file => {
        const row = document.createElement('tr');
        row.setAttribute('data-file-id', file.id);
        row.setAttribute('data-file-name', file.file_name);

        // Use a class to identify the link easily
        row.innerHTML = `
            <td class="text-center checkbox-col">
                <input class="form-check-input file-checkbox" type="checkbox" data-file-id="${file.id}">
            </td>
            <td><a href="/app.html?fileId=${file.id}" class="file-link">${file.file_name || 'Untitled'}</a></td>
            <td>${formatDate(file.last_modified)}</td>
            <td>${formatFileSize(file.file_size || 0)}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-danger action-btn"
                        data-bs-toggle="modal"
                        data-bs-target="#deleteConfirmModal"
                        data-bs-filename="${file.file_name || 'Untitled'}"
                        data-bs-fileid="${file.id}">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        fileTableBody.appendChild(row);
    });

    fileTableFooter.textContent = `Showing ${files.length} file${files.length !== 1 ? 's' : ''}.`;

    // Re-initialize checkbox logic after rendering
    if (fileTableBody && selectAllCheckbox) {
        initializeCheckboxLogic(fileTableBody, selectAllCheckbox);
    } else {
        console.error("Could not re-initialize checkbox logic: table body or selectAll checkbox not found.");
    }

    // --- Add explicit click handler for file links ---
    // Remove previous listener first to prevent duplicates if renderFiles is called multiple times
    fileTableBody.removeEventListener('click', handleFileLinkClick);
    fileTableBody.addEventListener('click', handleFileLinkClick);
}

// --- Event handler for file link clicks ---
function handleFileLinkClick(event) {
    // Check if the clicked element is a file link or inside one
    const link = event.target.closest('a.file-link');
    if (link && fileTableBody.contains(link)) {
        event.preventDefault(); // Prevent default navigation just in case, then navigate manually
        window.location.href = link.href; // Explicitly navigate
    }
}

// Fetch user files from Supabase
export async function fetchUserFiles(userId) {
    currentUserId = userId; // Store the user ID
    if (!fileTableBody) fileTableBody = document.getElementById('fileTableBody');
    if (!fileTableFooter) fileTableFooter = document.getElementById('fileTableFooter');

    try {
        const { data, error } = await supabaseClient
            .from('files')
            .select('*')
            .eq('user_id', userId)
            .order('last_modified', { ascending: false });

        if (error) throw error;
        renderFiles(data);
    } catch (error) {
        console.error('Error fetching files:', error);
        if (fileTableBody) {
            fileTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading files.</td></tr>';
        }
        if (fileTableFooter) {
            fileTableFooter.textContent = 'Error loading files.';
        }
    }
}

// --- New File Modal Logic ---
async function handleCreateFile() {
    const newFileName = newFileNameInput.value.trim();
    if (!newFileName) {
        newFileNameInput.classList.add('is-invalid');
        return;
    }
    newFileNameInput.classList.remove('is-invalid');
    createFileButton.disabled = true;
    createFileButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating...`;

    let fileId = null; // Define fileId here to access in finally block if needed

    try {
        if (!currentUserId) {
             // Attempt to get session again if userId isn't set
             const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
             if (sessionError || !session) {
                 throw new Error("User session not found. Please log in again.");
             }
             currentUserId = session.user.id;
        }

        const { data: existingFiles, error: checkError } = await supabaseClient
            .from('files')
            .select('id')
            .eq('user_id', currentUserId)
            .eq('file_name', newFileName)
            .limit(1);

        if (checkError) throw new Error(`Error checking for existing file: ${checkError.message}`);
        if (existingFiles && existingFiles.length > 0) {
            alert(`File named "${newFileName}" already exists.`);
            newFileNameInput.classList.add('is-invalid');
            // No need to throw an error here if we just want to stop execution
            createFileButton.disabled = false; // Re-enable button
            createFileButton.innerHTML = 'Create';
            return; // Stop execution
        }

        fileId = generateUUID(); // Assign generated ID
        const filePath = `${currentUserId}/${fileId}.json`;
        const initialContent = JSON.stringify({}); // Empty JSON object
        const initialBlob = new Blob([initialContent], { type: 'application/json' });
        const initialFileSize = initialBlob.size;

        console.log(`Uploading to storage: ${filePath}`);
        const { error: storageError } = await supabaseClient.storage.from('storage').upload(filePath, initialBlob);
        if (storageError) throw new Error(`Storage error: ${storageError.message}`);
        console.log(`Successfully uploaded to ${filePath}`);

        const now = new Date().toISOString();
        console.log(`Attempting to insert file record for user ID: ${currentUserId}`);
        const { error: dbError } = await supabaseClient
            .from('files')
            .insert({
                id: fileId,
                user_id: currentUserId,
                file_name: newFileName,
                created_at: now,
                last_modified: now,
                file_size: initialFileSize
            });

        if (dbError) {
            console.error("Database insert failed, attempting to remove potentially uploaded file from storage...");
            await supabaseClient.storage.from('storage').remove([filePath]); // Attempt cleanup
            console.error("Database error details:", dbError);
            if (dbError.message.includes('violates row-level security policy')) {
                 throw new Error(`Database error: Row-Level Security policy violation. Check INSERT policy on 'files' table.`);
            } else {
                throw new Error(`Database error: ${dbError.message}`);
            }
        }
        console.log(`Successfully inserted record for ${newFileName} (ID: ${fileId})`);

        // --- Redirect on Success ---
        window.location.href = `/app.html?fileId=${fileId}`;
        // No need to hide modal or refresh list here due to redirection

    } catch (error) {
        console.error('Error creating file:', error);
        alert(`Failed to create file: ${error.message}`);
        // Reset button state only if not redirecting
        createFileButton.disabled = false;
        createFileButton.innerHTML = 'Create';
        // Keep invalid state if filename already exists
        if (error.message.includes("already exists")) {
             newFileNameInput.classList.add('is-invalid');
        } else {
             newFileNameInput.classList.remove('is-invalid');
        }
    }
    // Note: The finally block is removed as the button state is handled
    // within the try/catch blocks, especially considering the redirection.
}

// --- Delete Confirmation Modal Logic ---
async function handleDeleteFile() {
    const fileId = confirmDeleteButton.getAttribute('data-file-id-to-delete');
    const fileName = fileNameToDeleteElement.textContent; // Get filename for logging/path

    if (!fileId || !currentUserId) {
        console.error("Missing file ID or user ID for deletion.");
        alert("Could not delete file. Missing information.");
        return;
    }

    console.log(`Attempting deletion of file ID: ${fileId}, Name: ${fileName}`);
    confirmDeleteButton.disabled = true; // Disable button during operation
    confirmDeleteButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...`;

    const filePath = `${currentUserId}/${fileId}.json`; // Construct the storage path

    try {
        // 1. Delete from Supabase Storage first
        console.log(`Deleting from storage: ${filePath}`);
        const { error: storageError } = await supabaseClient
            .storage
            .from('storage')
            .remove([filePath]);

        // Log storage error but proceed to try DB deletion anyway,
        // as the record might exist even if the file doesn't, or vice-versa.
        if (storageError) {
            console.warn(`Storage deletion warning for ${filePath}: ${storageError.message} (Proceeding with DB deletion)`);
            // You might not want to alert the user here unless DB deletion also fails
        } else {
             console.log(`Successfully deleted from storage: ${filePath}`);
        }

        // 2. Delete record from 'files' table
        const { error: dbError } = await supabaseClient
            .from('files')
            .delete()
            .eq('id', fileId)
            .eq('user_id', currentUserId); // Ensure user owns the file

        if (dbError) {
            throw new Error(`Database deletion error: ${dbError.message}`);
        }

        console.log(`Successfully deleted record for: ${fileName}`);

        // 3. Remove the row from the table visually
        const rowToDelete = fileTableBody.querySelector(`tr[data-file-id="${fileId}"]`);
        if (rowToDelete) {
            rowToDelete.remove();
            // Re-initialize checkbox logic after deletion
            if (fileTableBody && selectAllCheckbox) {
                 initializeCheckboxLogic(fileTableBody, selectAllCheckbox);
            }
        }

        // 4. Close the modal
        const modalInstance = bootstrap.Modal.getInstance(deleteConfirmModalElement);
        modalInstance.hide();

    } catch (error) {
        console.error(`Error deleting file ${fileName} (ID: ${fileId}):`, error);
        alert(`Failed to delete file: ${error.message}`); // Inform user
    } finally {
        // Reset button state
        confirmDeleteButton.disabled = false;
        confirmDeleteButton.innerHTML = 'Delete';
        // Clean up attributes when modal is hidden (moved to hidden.bs.modal listener)
    }
}

// --- Initialize Modal Event Listeners ---
export function initializeFileModals() {
    // New File Modal
    if (createFileButton && newFileNameInput && newFileModalElement && newFileForm) {
        // Keep existing listeners, handleCreateFile now includes redirection
        createFileButton.addEventListener('click', handleCreateFile);
        newFileForm.addEventListener('submit', (event) => {
            event.preventDefault();
            handleCreateFile();
        });
        newFileModalElement.addEventListener('hidden.bs.modal', () => {
            newFileNameInput.value = '';
            newFileNameInput.classList.remove('is-invalid');
            // Reset button state if modal is closed manually without success
            createFileButton.disabled = false;
            createFileButton.innerHTML = 'Create';
        });
        newFileModalElement.addEventListener('shown.bs.modal', () => {
            newFileNameInput.focus();
        });
    }

    // Delete Confirmation Modal
    if (deleteConfirmModalElement && confirmDeleteButton && fileNameToDeleteElement) {
        deleteConfirmModalElement.addEventListener('show.bs.modal', (event) => {
            const button = event.relatedTarget;
            const fileToDeleteName = button.getAttribute('data-bs-filename');
            const fileIdToDelete = button.getAttribute('data-bs-fileid');
            confirmDeleteButton.setAttribute('data-file-id-to-delete', fileIdToDelete);
            fileNameToDeleteElement.textContent = fileToDeleteName || 'this file';
        });

        confirmDeleteButton.addEventListener('click', handleDeleteFile);

        deleteConfirmModalElement.addEventListener('hidden.bs.modal', () => {
            fileNameToDeleteElement.textContent = 'this file'; // Reset text
            confirmDeleteButton.removeAttribute('data-file-id-to-delete'); // Clean up attribute
            // Reset button state in case modal was closed manually during operation
            confirmDeleteButton.disabled = false;
            confirmDeleteButton.innerHTML = 'Delete';
        });
    }
}
