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
        // Construct the redirect URL dynamically based on the current origin
        const redirectURL = window.location.origin + '/dashboard.html';
        console.log('Redirecting to:', redirectURL); // Optional: for debugging

        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectURL // Use relative path combined with origin
            }
        });
        if (error) throw error;
        // Redirect should now consistently go to dashboard.html if successful
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
        // Try signing in first
        let { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        // If sign-in fails (e.g., user not found), try signing up
        if (error && error.message.includes('Invalid login credentials')) { // Or check for specific error code
             ({ data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
            }));
             // Optional: Handle email confirmation if enabled in Supabase settings
             if (!error && data.user && !data.session) {
                 displayError('Sign up successful! Please check your email to confirm your account.'); // Adjust message if auto-confirm is on
                 return; // Don't redirect yet if confirmation is needed
             }
        }

        if (error) throw error;

        // On successful login or sign up (if auto-confirmed), redirect
        window.location.href = '/dashboard.html'; // Use relative path

    } catch (error) {
        console.error('Error signing in/up:', error);
        // Provide a more generic error for signup failures if needed
        displayError(error.message || 'An error occurred during authentication.');
    }
});
