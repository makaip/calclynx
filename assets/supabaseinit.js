// Access createClient from the global supabase object provided by the CDN script
const { createClient } = window.supabase;

const supabaseClient = createClient(
    'https://pzdbjsyivfngiwqpnvmr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZGJqc3lpdmZuZ2l3cXBudm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxNDE1MjQsImV4cCI6MjA2MTcxNzUyNH0.npkNi_ZM74Tx55ebWwDSaE85-ICbvz00P89KmMP2yOA'
);

export { supabaseClient }; // Export the initialized client

