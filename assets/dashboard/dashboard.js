document.addEventListener('DOMContentLoaded', () => {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const fileTableBody = document.getElementById('fileTableBody');
    const fileCheckboxes = fileTableBody.querySelectorAll('.file-checkbox');
    const deleteConfirmModalElement = document.getElementById('deleteConfirmModal');
    const fileNameToDeleteElement = document.getElementById('fileNameToDelete');
    const confirmDeleteButton = document.getElementById('confirmDeleteButton');

    let fileToDelete = null; // Variable to store the filename for deletion confirmation

    // --- Checkbox Selection Logic ---

    // Select All Checkbox listener
    selectAllCheckbox.addEventListener('change', (event) => {
        fileCheckboxes.forEach(checkbox => {
            checkbox.checked = event.target.checked;
            updateRowHighlight(checkbox);
        });
    });

    // Individual Checkbox listeners
    fileCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateSelectAllCheckboxState();
            updateRowHighlight(checkbox);
        });
    });

    // Function to update the state of the "Select All" checkbox
    function updateSelectAllCheckboxState() {
        const allChecked = Array.from(fileCheckboxes).every(checkbox => checkbox.checked);
        const someChecked = Array.from(fileCheckboxes).some(checkbox => checkbox.checked);

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
        if (checkbox.checked) {
            row.classList.add('table-active');
        } else {
            row.classList.remove('table-active');
        }
    }

    // Initial check in case some checkboxes are pre-checked (e.g., server-side)
    updateSelectAllCheckboxState();
    fileCheckboxes.forEach(updateRowHighlight);


    // --- Delete Confirmation Modal Logic ---

    // Listener for when the modal is about to be shown
    deleteConfirmModalElement.addEventListener('show.bs.modal', (event) => {
        // Button that triggered the modal
        const button = event.relatedTarget;
        // Extract info from data-bs-* attributes
        fileToDelete = button.getAttribute('data-bs-filename');
        // Update the modal's content.
        fileNameToDeleteElement.textContent = fileToDelete || 'this file'; // Fallback text
    });

    // Listener for the final delete confirmation button
    confirmDeleteButton.addEventListener('click', () => {
        if (fileToDelete) {
            console.log(`Confirmed deletion of: ${fileToDelete}`);
            // TODO: Add actual delete logic here (e.g., send request to server)

            // Example: Find and remove the row from the table after successful deletion
            const rowToDelete = fileTableBody.querySelector(`tr[data-file-name="${fileToDelete}"]`);
            if (rowToDelete) {
                rowToDelete.remove();
                // Re-evaluate checkboxes after deletion
                updateSelectAllCheckboxState();
            }

            // Close the modal
            const modalInstance = bootstrap.Modal.getInstance(deleteConfirmModalElement);
            modalInstance.hide();
            fileToDelete = null; // Reset the variable
        } else {
            console.error("No file selected for deletion.");
        }
    });

    // Optional: Clear fileToDelete when modal is hidden
     deleteConfirmModalElement.addEventListener('hidden.bs.modal', () => {
        fileToDelete = null;
     });

});
