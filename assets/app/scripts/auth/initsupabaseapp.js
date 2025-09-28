function getSupabaseClient() {
    if (typeof window !== 'undefined' && window.supabaseClient) {
        return window.supabaseClient;
    }
    
    if (typeof supabase !== 'undefined') {
        const client = supabase.createClient(
            'https://pzdbjsyivfngiwqpnvmr.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZGJqc3lpdmZuZ2l3cXBudm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxNDE1MjQsImV4cCI6MjA2MTcxNzUyNH0.npkNi_ZM74Tx55ebWwDSaE85-ICbvz00P89KmMP2yOA'
        );
        window.supabaseClient = client;
        return client;
    }
    
    throw new Error('Supabase not loaded yet');
}

let supabaseClient;

try {
    supabaseClient = getSupabaseClient();
} catch (e) {
    supabaseClient = null;
}

export { supabaseClient, getSupabaseClient };
