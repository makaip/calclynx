import { getSupabaseClient } from '../../app/scripts/auth/initsupabaseapp.js';

async function checkSessionAndRedirect() {
	try {
		const client = await getSupabaseClient();
		const { data: { session } } = await client.auth.getSession();
		if (session) {
			console.log('User already logged in, redirecting to app...');
			window.location.href = '/app.html';
		} else {
			console.log('No active session found.');
		}
	} catch (error) {
		console.error('Error checking session:', error);
	}
}

function initTypedJS() {
	new Typed('#typed', {
		strings: ['Scratch paper', 'Notetaking', 'An interface'],
		typeSpeed: 50,
		backSpeed: 30,
		backDelay: 2500,
		startDelay: 500,
		loop: true,
		cursorChar: '|',
		autoInsertCss: true,
	});
}

document.addEventListener('DOMContentLoaded', () => {
	checkSessionAndRedirect();
	initTypedJS();
});
