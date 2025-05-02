import { supabaseClient } from '../supabaseinit.js'; // Import Supabase client

// --- Global Variables ---
let selectAllCheckbox = null;
let fileTableBody = null;
let fileCheckboxes = []; // Will be populated dynamically
const deleteConfirmModalElement = document.getElementById('deleteConfirmModal');
const fileNameToDeleteElement = document.getElementById('fileNameToDelete');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');
const signOutButton = document.getElementById('signOutButton');
const fileTableFooter = document.getElementById('fileTableFooter');

let fileToDelete = null; // Variable to store the filename for deletion confirmation

// --- Helper Functions ---

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Render files in the table
function renderFiles(files) {
    fileTableBody.innerHTML = ''; // Clear existing rows
    if (!files || files.length === 0) {
        fileTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No files found.</td></tr>';
        fileTableFooter.textContent = '0 files.';
        return;
    }

    files.forEach(file => {
        const row = document.createElement('tr');
        row.setAttribute('data-file-id', file.id); // Use ID for potential future actions
        row.setAttribute('data-file-name', file.file_name); // Keep filename for delete modal

        row.innerHTML = `
            <td class="text-center checkbox-col">
                <input class="form-check-input file-checkbox" type="checkbox" data-file-id="${file.id}">
            </td>
            <td><a href="#">${file.file_name || 'Untitled'}</a></td>
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
    // Re-initialize checkbox related variables and listeners after rendering
    initializeCheckboxLogic();
}

// Fetch user files from Supabase
async function fetchUserFiles(userId) {
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
        fileTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading files.</td></tr>';
        fileTableFooter.textContent = 'Error loading files.';
    }
}

// --- Checkbox Selection Logic ---

// Function to update the state of the "Select All" checkbox
function updateSelectAllCheckboxState() {
    if (!selectAllCheckbox || fileCheckboxes.length === 0) return; // Guard against null/empty

    const allChecked = fileCheckboxes.every(checkbox => checkbox.checked);
    const someChecked = fileCheckboxes.some(checkbox => checkbox.checked);

    if (allChecked) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else if (someChecked) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
}

// Function to add/remove highlight class based on checkbox state
function updateRowHighlight(checkbox) {
    const row = checkbox.closest('tr');
    if (row) { // Check if row exists
        if (checkbox.checked) {
            row.classList.add('table-active');
        } else {
            row.classList.remove('table-active');
        }
    }
}

// Initialize or re-initialize checkbox logic
function initializeCheckboxLogic() {
    selectAllCheckbox = document.getElementById('selectAllCheckbox');
    fileTableBody = document.getElementById('fileTableBody'); // Ensure fileTableBody is assigned
    fileCheckboxes = Array.from(fileTableBody.querySelectorAll('.file-checkbox'));

    if (selectAllCheckbox) {
        // Remove previous listener to avoid duplicates if re-initialized
        selectAllCheckbox.removeEventListener('change', handleSelectAllChange);
        selectAllCheckbox.addEventListener('change', handleSelectAllChange);
    }

    fileCheckboxes.forEach(checkbox => {
        // Remove previous listener
        checkbox.removeEventListener('change', handleIndividualCheckboxChange);
        checkbox.addEventListener('change', handleIndividualCheckboxChange);
        updateRowHighlight(checkbox); // Apply initial highlight if needed
    });

    updateSelectAllCheckboxState(); // Update based on current state
}

// Event handler for selectAllCheckbox change
function handleSelectAllChange(event) {
    fileCheckboxes.forEach(checkbox => {
        checkbox.checked = event.target.checked;
        updateRowHighlight(checkbox);
    });
}

// Event handler for individual checkbox change
function handleIndividualCheckboxChange() {
    updateSelectAllCheckboxState();
    updateRowHighlight(this); // 'this' refers to the checkbox that triggered the event
}


// --- Delete Confirmation Modal Logic ---

// Listener for when the modal is about to be shown
if (deleteConfirmModalElement) {
    deleteConfirmModalElement.addEventListener('show.bs.modal', (event) => {
        const button = event.relatedTarget;
        fileToDelete = button.getAttribute('data-bs-filename'); // Keep using filename for display
        const fileIdToDelete = button.getAttribute('data-bs-fileid'); // Get file ID
        confirmDeleteButton.setAttribute('data-file-id-to-delete', fileIdToDelete); // Store ID on button
        fileNameToDeleteElement.textContent = fileToDelete || 'this file';
    });
}

// Listener for the final delete confirmation button
if (confirmDeleteButton) {
    confirmDeleteButton.addEventListener('click', async () => {
        const fileId = confirmDeleteButton.getAttribute('data-file-id-to-delete');
        const fileName = fileNameToDeleteElement.textContent; // Get filename for logging

        if (fileId) {
            console.log(`Attempting deletion of file ID: ${fileId}, Name: ${fileName}`);

            // --- TODO: Implement Actual Supabase Deletion Logic ---
            // 1. Delete from Supabase Storage (if applicable)
            // 2. Delete record from 'files' table
            // Example (needs error handling):
            /*
            try {
                const { error: dbError } = await supabaseClient
                    .from('files')
                    .delete()
                    .eq('id', fileId);

                if (dbError) throw dbError;

                console.log(`Successfully deleted record for: ${fileName}`);
                // Remove the row from the table visually
                const rowToDelete = fileTableBody.querySelector(`tr[data-file-id="${fileId}"]`);
                if (rowToDelete) {
                    rowToDelete.remove();
                    initializeCheckboxLogic(); // Re-evaluate checkboxes after deletion
                }

            } catch (error) {
                console.error(`Error deleting file ${fileName} (ID: ${fileId}):`, error);
                alert(`Failed to delete file: ${error.message}`); // Inform user
            }
            */

            // For now, just remove visually as per prompt constraints
             const rowToDelete = fileTableBody.querySelector(`tr[data-file-id="${fileId}"]`);
             if (rowToDelete) {
                 rowToDelete.remove();
                 console.log(`Visually removed row for: ${fileName}`);
                 initializeCheckboxLogic(); // Re-evaluate checkboxes after deletion
             }


            // Close the modal
            const modalInstance = bootstrap.Modal.getInstance(deleteConfirmModalElement);
            modalInstance.hide();
            fileToDelete = null; // Reset the variable
            confirmDeleteButton.removeAttribute('data-file-id-to-delete'); // Clean up attribute
        } else {
            console.error("No file ID found for deletion.");
        }
    });
}

// Optional: Clear fileToDelete when modal is hidden
if (deleteConfirmModalElement) {
    deleteConfirmModalElement.addEventListener('hidden.bs.modal', () => {
        fileToDelete = null;
        confirmDeleteButton.removeAttribute('data-file-id-to-delete'); // Clean up attribute
    });
}

// --- Authentication and Initialization ---

// Sign Out Logic
if (signOutButton) {
    signOutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
        } else {
            // Redirect to login page after successful sign out
            window.location.href = '/login.html';
        }
    });
}

// Check Auth and Load Files on Page Load
async function checkAuthAndLoadFiles() {
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

    if (sessionError) {
        console.error("Error getting session:", sessionError);
        window.location.href = '/login.html'; // Redirect on error
        return;
    }

    if (!session) {
        // No active session, redirect to login
        window.location.href = '/login.html';
    } else {
        // User is logged in, fetch their files
        console.log('User logged in:', session.user.email);
        await fetchUserFiles(session.user.id);
    }
}

// --- DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', () => {
    fileTableBody = document.getElementById('fileTableBody'); // Assign here
    checkAuthAndLoadFiles(); // Check authentication status and load files
    // Note: initializeCheckboxLogic() is called within renderFiles after data is loaded
});
