import { getSupabaseClient } from '../app/scripts/auth/initsupabaseapp.js';

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

document.addEventListener('DOMContentLoaded', () => {
    checkSessionAndRedirect();
});
