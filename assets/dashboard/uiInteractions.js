let selectAllCheckbox = null;
let fileTableBody = null;
let fileCheckboxes = [];

// Function to update the state of the "Select All" checkbox
function updateSelectAllCheckboxState() {
    if (!selectAllCheckbox || fileCheckboxes.length === 0) return;

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
    if (row) {
        if (checkbox.checked) {
            row.classList.add('table-active');
        } else {
            row.classList.remove('table-active');
        }
    }
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
    updateRowHighlight(this);
}

// Initialize or re-initialize checkbox logic
export function initializeCheckboxLogic(tableBodyElement, selectAllCheckboxElement) {
    selectAllCheckbox = selectAllCheckboxElement;
    fileTableBody = tableBodyElement; // Use passed element
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
