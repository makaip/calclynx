// Settings Modal Functionality

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsModal = document.getElementById('close-settings-modal');
    const deleteAccountButton = document.getElementById('deleteAccountButton');
    const deleteAccountModal = document.getElementById('deleteAccountModal');
    const closeDeleteModal = document.getElementById('close-delete-modal');
    const cancelDeleteButton = document.getElementById('cancel-delete-button');
    const confirmDeleteAccountButton = document.getElementById('confirmDeleteAccountButton');
    const userEmailElement = document.getElementById('userEmail');
    const confirmUserEmailElement = document.getElementById('confirmUserEmail');
    const deleteConfirmInput = document.getElementById('deleteConfirmInput');
    const deleteErrorMessageDiv = document.getElementById('delete-error-message');

    // Variables to store user info
    let currentUserEmail = null;
    let currentUserId = null;

    // Close settings modal when clicking on X or outside the modal
    if (closeSettingsModal) {
        closeSettingsModal.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
    }

    // Close settings modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
        if (e.target === deleteAccountModal) {
            deleteAccountModal.style.display = 'none';
        }
    });

    // Open delete account modal when clicking delete button
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', () => {
            deleteAccountModal.style.display = 'block';
            deleteConfirmInput.value = '';
            deleteErrorMessageDiv.style.display = 'none';
        });
    }

    // Close delete account modal when clicking X or cancel
    if (closeDeleteModal) {
        closeDeleteModal.addEventListener('click', () => {
            deleteAccountModal.style.display = 'none';
        });
    }

    if (cancelDeleteButton) {
        cancelDeleteButton.addEventListener('click', () => {
            deleteAccountModal.style.display = 'none';
        });
    }

    // Function to display error messages in the modal
    function showDeleteError(message) {
        deleteErrorMessageDiv.textContent = message;
        deleteErrorMessageDiv.style.display = 'block';
    }

    // Function to clear error messages in the modal
    function clearDeleteError() {
        deleteErrorMessageDiv.textContent = '';
        deleteErrorMessageDiv.style.display = 'none';
    }

    // Delete Account Logic
    async function handleDeleteAccount() {
        clearDeleteError();
        const confirmationEmail = deleteConfirmInput.value.trim();

        if (confirmationEmail !== currentUserEmail) {
            showDeleteError('Email does not match your account email.');
            return;
        }

        confirmDeleteAccountButton.disabled = true;
        confirmDeleteAccountButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Deleting...`;

        try {
            // Call the Supabase RPC function to delete the user account
            const { error } = await supabaseClient.rpc('delete_user_account');

            if (error) {
                throw new Error(`Failed to delete account: ${error.message}`);
            }

            alert('Account deleted successfully.');
            
            // Force sign out locally and redirect
            await supabaseClient.auth.signOut();
            window.location.href = '/login.html?deleted=true';

        } catch (error) {
            console.error('Error deleting account:', error);
            showDeleteError(error.message || 'An unexpected error occurred. Please try again.');
            confirmDeleteAccountButton.disabled = false;
            confirmDeleteAccountButton.innerHTML = 'Delete Account Permanently';
        }
    }

    // Check authentication and initialize settings
    async function checkAuthAndInitSettings() {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

        if (sessionError || !session) {
            console.error("No session found or error getting session:", sessionError);
            // Don't redirect - we're in a modal in the app, not a separate page
            return;
        }

        // User is logged in
        currentUserId = session.user.id;
        currentUserEmail = session.user.email;

        // Display user email
        if (userEmailElement) userEmailElement.textContent = currentUserEmail;
        if (confirmUserEmailElement) confirmUserEmailElement.textContent = currentUserEmail;

        // Add delete confirmation event listener
        if (confirmDeleteAccountButton) {
            confirmDeleteAccountButton.addEventListener('click', handleDeleteAccount);
        }
    }

    // Initialize settings whenever the modal is opened
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            // Prevent clicks inside the modal content from closing the modal
            if (e.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });

        // The mutation observer watches for when the modal becomes visible
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'style' &&
                    settingsModal.style.display === 'block') {
                    checkAuthAndInitSettings();
                }
            });
        });

        observer.observe(settingsModal, { attributes: true });
    }

    // Also initialize when the DOM is loaded (in case modal is shown immediately)
    checkAuthAndInitSettings();
});
