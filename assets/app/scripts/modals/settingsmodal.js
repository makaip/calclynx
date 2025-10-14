import { userManager } from '../core/cloud.js';
import { ModalUtils } from './modalutils.js';

export class SettingsModal {
    constructor() {
        this.modal = document.getElementById('deleteAccountModal');
        this.userEmailElement = document.getElementById('userEmail');
        this.confirmUserEmailElement = document.getElementById('confirmUserEmail');
        this.deleteConfirmInput = document.getElementById('deleteConfirmInput');
        this.button = document.getElementById('confirmDeleteAccountButton');
        this.error = document.getElementById('delete-error-message');
        this.currentUserEmail = null;

        this.loadUserInfo();
    }

    async loadUserInfo() {
        try {
            const userInfo = await userManager.getUserInfo();

            if (!userInfo.isLoggedIn) {
                console.error('User not logged in');
                return;
            }

            this.currentUserEmail = userInfo.email;
            if (this.userEmailElement) this.userEmailElement.textContent = userInfo.email;
            if (this.confirmUserEmailElement) this.confirmUserEmailElement.textContent = userInfo.email;

        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    async deleteAccount() {
        const confirmationEmail = this.deleteConfirmInput?.value.trim() || '';
        
        if (!confirmationEmail) {
            ModalUtils.showError(this.error, 'Please enter your email address.');
            this.deleteConfirmInput?.focus();
            return;
        }
        
        if (confirmationEmail !== this.currentUserEmail) {
            ModalUtils.showError(this.error, 'Email does not match your account email.');
            this.deleteConfirmInput?.focus();
            return;
        }

        ModalUtils.hideError(this.error);

        try {
            ModalUtils.setButtonLoading(this.button, true, 'Deleting...', 'Delete Account Permanently');
            const result = await userManager.deleteAccount();

            if (!result.success) throw new Error(result.error || 'Failed to delete account');

            window.location.href = '/login.html?deleted=true';

        } catch (error) {
            console.error('Error deleting account:', error);
            ModalUtils.showError(this.error, error.message || 'An unexpected error occurred. Please try again.');
        } finally {
            ModalUtils.setButtonLoading(this.button, false, 'Deleting...', 'Delete Account Permanently');
        }
    }

    reset() {
        if (this.deleteConfirmInput) this.deleteConfirmInput.value = '';
        ModalUtils.hideError(this.error);
        ModalUtils.setButtonLoading(this.button, false, 'Deleting...', 'Delete Account Permanently');
    }
}