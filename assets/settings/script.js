import { supabaseClient } from '../supabaseinit.js';

// DOM Elements
const signOutButton = document.getElementById('signOutButton');
const userEmailElement = document.getElementById('userEmail');
const confirmUserEmailElement = document.getElementById('confirmUserEmail');
const deleteAccountButton = document.getElementById('deleteAccountButton');
const deleteAccountModalElement = document.getElementById('deleteAccountModal');
const deleteConfirmInput = document.getElementById('deleteConfirmInput');
const confirmDeleteAccountButton = document.getElementById('confirmDeleteAccountButton');
const deleteErrorMessageDiv = document.getElementById('delete-error-message');

let currentUserEmail = null;
let currentUserId = null;

// Function to display error messages in the modal
function showDeleteError(message) {
    deleteErrorMessageDiv.textContent = message;
    deleteErrorMessageDiv.style.display = 'block';
}

// Function to clear error messages in the modal
function clearDeleteError() {
    deleteErrorMessageDiv.textContent = '';
    deleteErrorMessageDiv.style.display = 'none';
    deleteConfirmInput.classList.remove('is-invalid');
}

// Sign Out Logic
async function handleSignOut() {
    signOutButton.disabled = true;
    signOutButton.textContent = 'Signing Out...';
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
        signOutButton.disabled = false;
        signOutButton.textContent = 'Sign Out';
    } else {
        // Redirect to login page after successful sign out
        window.location.href = '/login.html';
    }
}

// Delete Account Logic
async function handleDeleteAccount() {
    clearDeleteError();
    const confirmationEmail = deleteConfirmInput.value.trim();

    if (confirmationEmail !== currentUserEmail) {
        deleteConfirmInput.classList.add('is-invalid');
        return;
    }

    confirmDeleteAccountButton.disabled = true;
    confirmDeleteAccountButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...`;

    try {
        // IMPORTANT: Secure account deletion requires a backend function (e.g., Supabase Edge Function or RPC).
        // Calling auth.admin.deleteUser directly from the client is insecure and usually blocked.
        // This RPC function needs to handle deleting user data (files, storage) BEFORE deleting the auth user.
        console.log(`Attempting to call Supabase RPC 'delete_user_account' for user: ${currentUserId}`);

        const { error } = await supabaseClient.rpc('delete_user_account'); // Assumes an RPC function named 'delete_user_account' exists

        if (error) {
            // Specific error handling can be added here based on potential RPC errors
            throw new Error(`Failed to delete account: ${error.message}`);
        }

        console.log('Account deletion process initiated successfully via RPC.');
        alert('Account deleted successfully.');
        // Force sign out locally and redirect
        await supabaseClient.auth.signOut(); // Clear local session just in case
        window.location.href = '/login.html?deleted=true'; // Redirect to login/landing page

    } catch (error) {
        console.error('Error deleting account:', error);
        showDeleteError(error.message || 'An unexpected error occurred. Please try again.');
        confirmDeleteAccountButton.disabled = false;
        confirmDeleteAccountButton.innerHTML = 'Delete Account Permanently';
    }
}


// Check Authentication and Initialize Page
async function checkAuthAndInit() {
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
        console.error("No session found or error getting session:", sessionError);
        window.location.href = '/login.html'; // Redirect to login if not authenticated
        return;
    }

    // User is logged in
    currentUserId = session.user.id;
    currentUserEmail = session.user.email;
    console.log('User authenticated:', currentUserEmail);

    // Display user email
    if (userEmailElement) userEmailElement.textContent = currentUserEmail;
    if (confirmUserEmailElement) confirmUserEmailElement.textContent = currentUserEmail;

    // Add event listeners
    if (signOutButton) {
        signOutButton.addEventListener('click', handleSignOut);
    }

    if (confirmDeleteAccountButton) {
        confirmDeleteAccountButton.addEventListener('click', handleDeleteAccount);
    }

    // Reset modal state when shown/hidden
    if (deleteAccountModalElement) {
        deleteAccountModalElement.addEventListener('show.bs.modal', () => {
            clearDeleteError();
            deleteConfirmInput.value = ''; // Clear input field
            confirmDeleteAccountButton.disabled = false; // Ensure button is enabled
            confirmDeleteAccountButton.innerHTML = 'Delete Account Permanently';
        });
    }
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Settings page loaded.");
    checkAuthAndInit();
});
