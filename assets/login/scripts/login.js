import { supabaseClient } from '../../supabaseinit.js';

const googleSignInButton = document.getElementById('google-signin-button');
const emailPasswordForm = document.getElementById('email-password-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessageDiv = document.getElementById('auth-error-message');
const loginButton = document.getElementById('login-button');

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

    // Disable button
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging In...';

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        displayError(error.message);
        loginButton.disabled = false;
        loginButton.innerHTML = 'Login';
    } else {
        // Redirect to app.html
        window.location.href = '/app.html';
    }
});

// Google Sign-in
googleSignInButton.addEventListener('click', async (e) => {
    e.preventDefault();
    clearError();
    googleSignInButton.disabled = true;
    googleSignInButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing in with Google...';

    try {
        const redirectURL = window.location.origin + '/app.html';
        console.log('Redirecting to:', redirectURL);

        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectURL
            }
        });

        if (error) {
            displayError(`Google Sign-In Error: ${error.message}`);
            googleSignInButton.disabled = false;
            googleSignInButton.innerHTML = '<i class="fab fa-google me-2"></i> Sign in with Google';
        }
    } catch (error) {
        console.error('Error signing in with Google:', error);
        displayError(error.message || 'An error occurred during Google sign-in.');
        googleSignInButton.disabled = false;
        googleSignInButton.innerHTML = '<i class="fab fa-google me-2"></i> Sign in with Google';
    }
});

// Auto-redirect if already logged in
async function checkLoginStatus() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        window.location.href = '/app.html';
    }
}

// Call on page load
checkLoginStatus();
