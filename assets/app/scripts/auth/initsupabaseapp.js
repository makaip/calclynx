let supabaseClient = null;
let initializationPromise = null;

const SUPABASE_URL = 'https://pzdbjsyivfngiwqpnvmr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6ZGJqc3lpdmZuZ2l3cXBudm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxNDE1MjQsImV4cCI6MjA2MTcxNzUyNH0.npkNi_ZM74Tx55ebWwDSaE85-ICbvz00P89KmMP2yOA';

async function initializeSupabase() {
	if (supabaseClient) return supabaseClient;
	
	try {
		if (typeof supabase !== 'undefined') {
			supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
			console.log('Supabase client initialized from CDN');
			return supabaseClient;
		}
		
		const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
		supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
		console.log('Supabase client initialized via dynamic import');
		return supabaseClient;
		
	} catch (error) {
		console.error('Failed to initialize Supabase:', error);
		initializationPromise = null;
		supabaseClient = null;
		throw error;
	}
}

export async function getSupabaseClient() {
	if (supabaseClient) return supabaseClient;
	
	if (!initializationPromise) {
		initializationPromise = initializeSupabase();
	}
	
	return initializationPromise;
}

// backward compatibility where waitSupabaseClient was used
export const waitSupabaseClient = getSupabaseClient;
