import { getSupabaseClient } from '../auth/initsupabaseapp.js';
import { userManager } from './user.js';

class Cloud {
	constructor() {
		this.client = null;
	}

	async ensureClient() {
		if (!this.client) this.client = await getSupabaseClient();
		return this.client;
	}

	async uploadFile(filePath, fileData) {
		try {
			const { session } = await userManager.getSession();
			if (!session) throw new Error('User not authenticated');

			const client = await this.ensureClient();
			const { error: storageError } = await client.storage
				.from('storage')
				.upload(filePath, fileData);

			if (storageError) throw storageError;

			return { success: true, filePath };
		} catch (error) {
			console.error('Error uploading file:', error);
			return { success: false, error: error.message };
		}
	}

	async downloadFile(filePath) {
		try {
			const { session } = await userManager.getSession();
			if (!session) throw new Error('User not authenticated');

			const client = await this.ensureClient();
			const { data: blob, error } = await client.storage
				.from('storage')
				.download(filePath);

			if (error) throw error;

			return { success: true, data: blob };
		} catch (error) {
			console.error('Error downloading file:', error);
			return { success: false, error: error.message };
		}
	}

	async deleteFile(filePath) {
		try {
			const { session } = await userManager.getSession();
			if (!session) throw new Error('User not authenticated');

			const client = await this.ensureClient();
			const { error } = await client.storage
				.from('storage')
				.remove([filePath]);

			if (error) throw error;

			return { success: true };
		} catch (error) {
			console.error('Error deleting file:', error);
			return { success: false, error: error.message };
		}
	}

	async listUserFiles() {
		try {
			const { session } = await userManager.getSession();
			if (!session) throw new Error('User not authenticated');

			const client = await this.ensureClient();
			const { data: files, error } = await client
				.from('files')
				.select('id, file_name, last_modified, file_size')
				.eq('user_id', session.user.id)
				.order('file_name', { ascending: true });

			if (error) throw error;

			return { success: true, files: files || [] };
		} catch (error) {
			console.error('Error listing files:', error);
			return { success: false, error: error.message, files: [] };
		}
	}

	async createBlankFile(fileName) {
		try {
			const { session } = await userManager.getSession();
			if (!session) throw new Error('User not authenticated');

			const { exists } = await this.checkFileExists(fileName);
			if (exists) {
				return {
					success: false,
					error: `File named "${fileName}" already exists.`
				};
			}

			let initialVersion = 3;
			let hasProseMirrorCapability = window.proseMirrorReady && window.ProseMirror;
			if (!hasProseMirrorCapability) {
				initialVersion = 2;
			}

			const fileId = this.generateUUID();
			const filePath = `${session.user.id}/${fileId}.json`;
			const initialContent = JSON.stringify({});
			const initialBlob = new Blob([initialContent], { type: 'application/json' });
			const initialFileSize = initialBlob.size;

			const client = await this.ensureClient();
			const { error: storageError } = await client.storage
				.from('storage')
				.upload(filePath, initialBlob);

			if (storageError) throw storageError;

			const now = new Date().toISOString();
			const { error: dbError } = await client
				.from('files')
				.insert({
					id: fileId,
					user_id: session.user.id,
					file_name: fileName,
					created_at: now,
					last_modified: now,
					file_size: initialFileSize,
					version: initialVersion
				});

			if (dbError) {
				await client.storage.from('storage').remove([filePath]);
				throw dbError;
			}

			return { success: true, fileId };
		} catch (error) {
			console.error('Error creating blank file:', error);
			return { success: false, error: error.message };
		}
	}

	async createFileFromJson(fileName, jsonContent) {
		try {
			const { session } = await userManager.getSession();
			if (!session) throw new Error('User not authenticated');

			const { exists } = await this.checkFileExists(fileName);
			if (exists) {
				return {
					success: false,
					error: `File named "${fileName}" already exists.`
				};
			}

			let parsedContent;
			try {
				parsedContent = JSON.parse(jsonContent);
			} catch (parseError) {
				return {
					success: false,
					error: 'Invalid JSON content. Please ensure the file contains valid JSON.'
				};
			}

			let fileVersion = 2;
			if (parsedContent.version) {
				if (parsedContent.version === "3.0") {
					fileVersion = 3;
				} else if (parsedContent.version === "2.0") {
					fileVersion = 2;
				}
			}

			const fileId = this.generateUUID();
			const filePath = `${session.user.id}/${fileId}.json`;
			const contentBlob = new Blob([jsonContent], { type: 'application/json' });
			const fileSize = contentBlob.size;

			const client = await this.ensureClient();
			const { error: storageError } = await client.storage
				.from('storage')
				.upload(filePath, contentBlob);

			if (storageError) throw storageError;

			const now = new Date().toISOString();
			const { error: dbError } = await client
				.from('files')
				.insert({
					id: fileId,
					user_id: session.user.id,
					file_name: fileName,
					created_at: now,
					last_modified: now,
					file_size: fileSize,
					version: fileVersion
				});

			if (dbError) {
				await client.storage.from('storage').remove([filePath]);
				throw dbError;
			}

			return { success: true, fileId };
		} catch (error) {
			console.error('Error creating file from JSON:', error);
			return { success: false, error: error.message };
		}
	}

	generateUUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			const r = Math.random() * 16 | 0;
			const v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	async checkFileExists(fileName) {
		try {
			const { session } = await userManager.getSession();
			if (!session) throw new Error('User not authenticated');

			const client = await this.ensureClient();
			const { data: existingFiles, error } = await client
				.from('files')
				.select('id')
				.eq('user_id', session.user.id)
				.eq('file_name', fileName)
				.limit(1);

			if (error) throw error;

			return { success: true, exists: existingFiles && existingFiles.length > 0 };
		} catch (error) {
			console.error('Error checking file existence:', error);
			return { success: false, error: error.message, exists: false };
		}
	}

	async renameFile(fileId, newName) {
		try {
			const { session } = await userManager.getSession();
			if (!session) throw new Error('User not authenticated');

			const validationResult = await this.validateFileName(fileId, newName);
			if (!validationResult.success) return validationResult;

			const validatedName = validationResult.name;
			const now = new Date().toISOString();

			const client = await this.ensureClient();
			const { error: updateError } = await client
				.from('files')
				.update({
					file_name: validatedName,
					last_modified: now
				})
				.eq('id', fileId)
				.eq('user_id', session.user.id);

			if (updateError) throw updateError;

			return {
				success: true,
				newName: validatedName,
				message: `File renamed to "${validatedName}"`
			};
		} catch (error) {
			console.error('Error renaming file:', error);
			return { success: false, error: error.message };
		}
	}

	async deleteFileRecord(fileId) {
		try {
			const { session } = await userManager.getSession();
			if (!session) throw new Error('User not authenticated');

			const userId = session.user.id;
			const filePath = `${userId}/${fileId}.json`;

			const client = await this.ensureClient();
			const { error: storageError } = await client.storage
				.from('storage')
				.remove([filePath]);

			if (storageError) {
				console.warn(`Storage deletion warning for ${filePath}: ${storageError.message}`);
			}

			const { error: dbError } = await client
				.from('files')
				.delete()
				.eq('id', fileId)
				.eq('user_id', userId);

			if (dbError) throw dbError;

			return {
				success: true,
				message: `File deleted successfully`,
				storageDeleted: !storageError
			};
		} catch (error) {
			console.error('Error deleting file record:', error);
			return { success: false, error: error.message };
		}
	}

	async validateFileName(fileId, newName) {
		try {
			const { session } = await userManager.getSession();
			if (!session) throw new Error('User not authenticated');
			if (!fileId || !newName) throw new Error('File ID and new name are required');

			const trimmedName = newName.trim();
			if (!trimmedName) throw new Error('File name cannot be empty');

			const client = await this.ensureClient();
			const { data: existingFiles, error } = await client
				.from('files')
				.select('id')
				.eq('user_id', session.user.id)
				.eq('file_name', trimmedName)
				.neq('id', fileId)
				.limit(1);

			if (error) throw error;

			if (existingFiles && existingFiles.length > 0) throw new Error(`A file named "${trimmedName}" already exists`);

			return { success: true, name: trimmedName };
		} catch (error) {
			console.error('Error validating file name:', error);
			return { success: false, error: error.message };
		}
	}

	async getFileInfo(fileId) {
		try {
			const { session } = await userManager.getSession();
			if (!session) throw new Error('User not authenticated');

			const client = await this.ensureClient();
			const { data, error } = await client
				.from('files')
				.select('id, file_name, created_at, last_modified, file_size')
				.eq('id', fileId)
				.eq('user_id', session.user.id)
				.single();

			if (error) throw error;

			return {
				success: true,
				file: data || null
			};
		} catch (error) {
			console.error('Error getting file info:', error);
			return { success: false, error: error.message, file: null };
		}
	}

	async updateFileTitle(fileId = null) {
		const fileTitleElement = document.getElementById('file-title');
		if (!fileTitleElement) return { success: false, error: 'File title element not found' };

		if (!fileId) {
			const urlParams = new URLSearchParams(window.location.search);
			fileId = urlParams.get('fileId');
		}

		const currentPath = window.location.pathname;
		const fileNotLoaded = !fileId || (currentPath.endsWith('/app.html') && !fileId);

		if (fileNotLoaded) {
			fileTitleElement.textContent = 'Untitled';
			return { success: true, title: 'Untitled' };
		}

		try {
			const result = await this.getFileInfo(fileId);

			if (!result.success || !result.file) {
				fileTitleElement.textContent = 'Untitled';
				return { success: true, title: 'Untitled' };
			}

			const fileName = result.file.file_name || 'Untitled';
			fileTitleElement.textContent = fileName;
			return { success: true, title: fileName };
		} catch (error) {
			console.error('Error updating file title:', error);
			fileTitleElement.textContent = 'Untitled';
			return { success: false, error: error.message, title: 'Untitled' };
		}
	}

	async downloadFileAsJson(fileId, fileName) {
		try {
			const { session } = await userManager.getSession();
			if (!session) throw new Error('User not authenticated');

			const filePath = `${session.user.id}/${fileId}.json`;
			const result = await this.downloadFile(filePath);

			if (!result || !result.success) {
				throw new Error(result?.error || 'Failed to download file');
			}
			if (!result.data) {
				throw new Error('File not found or empty.');
			}

			const blob = (result.data instanceof Blob)
				? result.data
				: new Blob([typeof result.data === 'string' ? result.data : JSON.stringify(result.data)], { type: 'application/json' });

			const sanitizedFileName = this._sanitizeFileName(fileName);
			const fileNameWithExt = this._ensureJsonExtension(sanitizedFileName);

			const link = document.createElement('a');
			const url = window.URL.createObjectURL(blob);

			link.href = url;
			link.download = fileNameWithExt;
			document.body.appendChild(link);

			link.click();

			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			return { success: true };
		} catch (error) {
			console.error('Error downloading file:', error);
			alert(`Error downloading file: ${error.message}`);
			return { success: false, error: error.message };
		}
	}

	_sanitizeFileName(fileName) {
		if (!fileName || typeof fileName !== 'string') {
			return 'untitled';
		}

		return fileName.trim()
			.replace(/[<>:"/\\|?*]/g, '_')
			.replace(/\s+/g, '_')
			.replace(/_{2,}/g, '_')
			.replace(/^_+|_+$/g, '') || 'untitled';
	}

	_ensureJsonExtension(fileName) {
		if (!fileName || typeof fileName !== 'string') {
			return 'untitled.json';
		}

		return fileName.endsWith('.json') ? fileName : `${fileName}.json`;
	}
}

const cloudManager = new Cloud();

export { Cloud, cloudManager };