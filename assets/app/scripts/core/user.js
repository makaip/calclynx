import { getSupabaseClient } from '../auth/initsupabaseapp.js';

class User {
	constructor() {
		this.client = null;
		this.currentUser = null;
		this.currentSession = null;
	}

	async ensureClient() {
		if (!this.client) this.client = await getSupabaseClient();
		return this.client;
	}

	async getSession() {
		try {
			const client = await this.ensureClient();
			const { data: { session }, error } = await client.auth.getSession();
			if (error) throw error;

			this.currentSession = session;
			this.currentUser = session?.user || null;
			return { session, user: this.currentUser };
		} catch (error) {
			console.error('Error getting session:', error);
			return { session: null, user: null, error };
		}
	}

	async signOut() {
		try {
			const client = await this.ensureClient();
			const { error } = await client.auth.signOut();
			if (error) throw error;

			this.currentSession = null;
			this.currentUser = null;
			return { success: true };
		} catch (error) {
			console.error('Error signing out:', error);
			return { success: false, error };
		}
	}

	async isAuthenticated() {
		const { session } = await this.getSession();
		return !!session;
	}

	async getUserInfo() {
		const { user } = await this.getSession();
		return { id: user?.id || null, email: user?.email || null, isLoggedIn: !!user };
	}

	async deleteAccount() {
		try {
			if (!this.currentUser) await this.getSession();
			if (!this.currentUser) throw new Error('No user logged in');

			const client = await this.ensureClient();
			const { error } = await client.rpc('delete_user_account');
			if (error) throw error;
			await this.signOut();

			return { success: true };
		} catch (error) {
			console.error('Error deleting account:', error);
			return { success: false, error: error.message };
		}
	}
}

const userManager = new User();

export { User, userManager };