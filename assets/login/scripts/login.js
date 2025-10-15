import { getSupabaseClient } from '../../app/scripts/auth/initsupabaseapp.js';

const googleSignInButton = document.getElementById('google-signin-button');
const emailPasswordForm = document.getElementById('email-password-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessageDiv = document.getElementById('auth-error-message');
const loginButton = document.getElementById('login-button');

// Function to display error messages
function displayError(message) {
	if (errorMessageDiv) {
		errorMessageDiv.textContent = message;
		errorMessageDiv.style.display = 'block';
	}
}

// Function to clear error messages
function clearError() {
	if (errorMessageDiv) {
		errorMessageDiv.textContent = '';
		errorMessageDiv.style.display = 'none';
	}
}

// Email/Password Sign-in (only if form exists)
if (emailPasswordForm) {
	emailPasswordForm.addEventListener('submit', async (e) => {
	e.preventDefault();
	clearError();
	
	if (!emailInput || !passwordInput) {
		displayError('Form elements not found.');
		return;
	}
	
	const email = emailInput.value.trim();
	const password = passwordInput.value.trim();

	if (!email || !password) {
		displayError('Please enter both email and password.');
		return;
	}

	// Disable button
	if (loginButton) {
		loginButton.disabled = true;
		loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging In...';
	}

	const client = await getSupabaseClient();
	const { data, error } = await client.auth.signInWithPassword({
		email: email,
		password: password,
	});

	if (error) {
		displayError(error.message);
		if (loginButton) {
			loginButton.disabled = false;
			loginButton.innerHTML = 'Login';
		}
	} else {
		// Redirect to app.html
		window.location.href = '/app.html';
	}
});
}

// Google Sign-in
if (googleSignInButton) {
	googleSignInButton.addEventListener('click', async (e) => {
		e.preventDefault();
		clearError();
		googleSignInButton.disabled = true;
		googleSignInButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing in with Google...';

		try {
			const redirectURL = window.location.origin + '/app.html';
			console.log('Redirecting to:', redirectURL);

			const client = await getSupabaseClient();
			const { error } = await client.auth.signInWithOAuth({
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
}

// Auto-redirect if already logged in
async function checkLoginStatus() {
	try {
		const client = await getSupabaseClient();
		const { data: { session } } = await client.auth.getSession();
		if (session) {
			window.location.href = '/app.html';
		}
	} catch (error) {
		console.error('Error checking login status:', error);
	}
}

// Call on page load
checkLoginStatus();
