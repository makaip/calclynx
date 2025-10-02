import { showError, hideError, setButtonLoading } from '../sidebar/sidebar-file-actions.js';
import { userManager } from '../core/cloud.js';

function initializeSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    const deleteAccountButton = document.getElementById('deleteAccountButton');
    const deleteAccountModal = document.getElementById('deleteAccountModal');
    const confirmDeleteAccountButton = document.getElementById('confirmDeleteAccountButton');
    const userEmailElement = document.getElementById('userEmail');
    const confirmUserEmailElement = document.getElementById('confirmUserEmail');
    const deleteConfirmInput = document.getElementById('deleteConfirmInput');
    const deleteErrorMessageDiv = document.getElementById('delete-error-message');

    let currentUserEmail = null;
    let currentUserId = null;

    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', () => {
            const modal = bootstrap.Modal.getOrCreateInstance(deleteAccountModal);
            modal.show();
            if (deleteConfirmInput) {
                deleteConfirmInput.value = '';
            }
            hideError(deleteErrorMessageDiv);
        });
    }

    async function handleDeleteAccount() {
        hideError(deleteErrorMessageDiv);
        const confirmationEmail = deleteConfirmInput?.value.trim() || '';

        if (!confirmationEmail) {
            showError(deleteErrorMessageDiv, 'Please enter your email address.');
            return;
        }

        if (confirmationEmail !== currentUserEmail) {
            showError(deleteErrorMessageDiv, 'Email does not match your account email.');
            return;
        }

        try {
            setButtonLoading(confirmDeleteAccountButton, true, 'Deleting...', 'Delete Account Permanently');

            const result = await userManager.deleteAccount();

            if (!result.success) {
                throw new Error(result.error || 'Failed to delete account');
            }

            alert('Account deleted successfully.');
            window.location.href = '/login.html?deleted=true';

        } catch (error) {
            console.error('Error deleting account:', error);
            showError(deleteErrorMessageDiv, error.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setButtonLoading(confirmDeleteAccountButton, false, 'Deleting...', 'Delete Account Permanently');
        }
    }

    async function loadUserInfo() {
        try {
            const userInfo = await userManager.getUserInfo();

            if (!userInfo.isLoggedIn) {
                console.error('No session found or user not logged in');
                return;
            }

            currentUserId = userInfo.id;
            currentUserEmail = userInfo.email;

            if (userEmailElement) {
                userEmailElement.textContent = currentUserEmail;
            }
            if (confirmUserEmailElement) {
                confirmUserEmailElement.textContent = currentUserEmail;
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    if (settingsModal) {
        settingsModal.addEventListener('shown.bs.modal', () => {
            loadUserInfo();
        });
    }

    confirmDeleteAccountButton?.addEventListener('click', handleDeleteAccount);
    loadUserInfo();
}

export { initializeSettingsModal };
