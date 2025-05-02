import { supabaseClient } from '../../supabaseinit.js';

const googleSignInButton = document.getElementById('google-signin-button');
const emailPasswordForm = document.getElementById('email-password-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessageDiv = document.getElementById('auth-error-message');

// Function to display error messages
function displayError(message) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
}

// Function to clear error messages
function clearError() {
    errorMessageDiv.textContent = '';
    errorMessageDiv.style.display = 'none';
}

// Google Sign-in
googleSignInButton.addEventListener('click', async (e) => {
    e.preventDefault();
    clearError();
    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google'
        });
        if (error) throw error;
        // Redirect happens automatically via Supabase
    } catch (error) {
        console.error('Error signing in with Google:', error);
        displayError(error.message || 'An error occurred during Google sign-in.');
    }
});

// Email/Password Sign-in
emailPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        displayError('Please enter both email and password.');
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        // On successful login, redirect to a dashboard or home page
        window.location.href = '/dashboard.html'; // Adjust the redirect URL as needed

    } catch (error) {
        console.error('Error signing in:', error);
        displayError(error.message || 'Invalid login credentials.');
    }
});

// Optional: Check if user is already logged in on page load
// (e.g., if they refresh after logging in or come back)
async function checkUserSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        // If a session exists, redirect to the dashboard
        // This prevents logged-in users from seeing the login page again
        // window.location.href = '/dashboard.html';
        console.log('User already logged in:', session.user.email);
    }
}

// Check session on page load
// checkUserSession(); // Uncomment if you want auto-redirect for logged-in users
