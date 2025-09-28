import { userManager } from '../core/cloud.js';

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
            const result = await userManager.deleteAccount();

            if (!result.success) {
                throw new Error(result.error || 'Failed to delete account');
            }

            alert('Account deleted successfully.');
            
            window.location.href = '/login.html?deleted=true';

        } catch (error) {
            console.error('Error deleting account:', error);
            showDeleteError(error.message || 'An unexpected error occurred. Please try again.');
            confirmDeleteAccountButton.disabled = false;
            confirmDeleteAccountButton.innerHTML = 'Delete Account Permanently';
        }
    }

    let deleteListenerAttached = false;
    async function checkAuthAndInitSettings() {
        try {
            const userInfo = await userManager.getUserInfo();

            if (!userInfo.isLoggedIn) {
                console.error("No session found or user not logged in");
                return;
            }

            currentUserId = userInfo.id;
            currentUserEmail = userInfo.email;

            if (userEmailElement) userEmailElement.textContent = currentUserEmail;
            if (confirmUserEmailElement) confirmUserEmailElement.textContent = currentUserEmail;
            if (confirmDeleteAccountButton && !deleteListenerAttached) {
                confirmDeleteAccountButton.addEventListener('click', handleDeleteAccount);
                deleteListenerAttached = true;
            }
        } catch (error) {
            console.error("Error initializing settings:", error);
        }
    }

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

export const SettingsModalHandlers = true;