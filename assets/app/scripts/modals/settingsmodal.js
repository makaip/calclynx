import { userManager } from '../core/cloud.js';

export class SettingsModal {
    async loadUserInfo() {
         try {
            const userInfo = await userManager.getUserInfo();

            if (!userInfo.isLoggedIn) {
                console.error('log in bru');
                return;
            }

            userEmailElement.textContent = userInfo.email;
            confirmUserEmailElement.textContent = userInfo.email;

        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    validateDeleteAccount() {
        const confirmationEmail = deleteConfirmInput?.value.trim() || '';
        if (!confirmationEmail) {
            // show 'Please enter your email address.'
            return;
        }
        
        if (confirmationEmail !== currentUserEmail) {
            // show 'Email does not match your account email.'
            return;
        }
    }

    async deleteAccount() {
        try {
            // set loading state for button "Delete Account Permanently" to "Deleting..."

            const result = await userManager.deleteAccount();

            if (!result.success) throw new Error(result.error || 'Failed to delete account');

            window.location.href = '/login.html?deleted=true';

        } catch (error) {
            console.error('Error deleting account:', error);
            // showError 'An unexpected error occurred. Please try again.');
        } finally {
            // unset loading state for button "Delete Account Permanently"
        }
    }
}