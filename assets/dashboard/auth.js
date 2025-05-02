import { supabaseClient } from '../supabaseinit.js';
import { fetchUserFiles } from './fileManager.js'; // Import fetchUserFiles

// Sign Out Logic Setup
export function initializeAuthButtons() {
    const signOutButton = document.getElementById('signOutButton');
    if (signOutButton) {
        signOutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            signOutButton.disabled = true; // Prevent double clicks
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
        });
    }
}

// Check Auth and Load Files on Page Load
export async function checkAuthAndLoadFiles() {
    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

        if (sessionError) {
            console.error("Error getting session:", sessionError);
            window.location.href = '/login.html'; // Redirect on error
            return;
        }

        if (!session) {
            // No active session, redirect to login
            console.log("No session found, redirecting to login.");
            window.location.href = '/login.html';
        } else {
            // User is logged in, fetch their files
            console.log('User logged in:', session.user.email);
            await fetchUserFiles(session.user.id); // Call fetchUserFiles from fileManager
        }
    } catch (error) {
        console.error("Error during auth check or file loading:", error);
        // Optionally display an error message to the user on the dashboard
        const fileTableBody = document.getElementById('fileTableBody');
        const fileTableFooter = document.getElementById('fileTableFooter');
        if (fileTableBody) fileTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error initializing dashboard.</td></tr>';
        if (fileTableFooter) fileTableFooter.textContent = 'Initialization error.';
        // Don't redirect here, as the user might be logged in but file fetching failed.
    }
}
