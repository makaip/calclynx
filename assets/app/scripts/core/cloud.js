import { supabaseClient } from '../auth/initsupabaseapp.js';

class User {
    constructor() {
        this.client = supabaseClient;
        this.currentUser = null;
        this.currentSession = null;
    }

    async getSession() {
        try {
            const { data: { session }, error } = await this.client.auth.getSession();
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
            const { error } = await this.client.auth.signOut();
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
            if (!this.currentUser) {
                await this.getSession();
            }

            if (!this.currentUser) {
                throw new Error('No user logged in');
            }

            const { error } = await this.client.rpc('delete_user_account');
            if (error) throw error;

            await this.signOut();
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting account:', error);
            return { success: false, error: error.message };
        }
    }

    // TODO: Move file management back to the filemanager

    async uploadFile(filePath, fileData) {
        try {
            const { session } = await this.getSession();
            if (!session) {
                throw new Error('User not authenticated');
            }

            const { error: storageError } = await this.client.storage
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
            const { session } = await this.getSession();
            if (!session) {
                throw new Error('User not authenticated');
            }

            const { data: blob, error } = await this.client.storage
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
            const { session } = await this.getSession();
            if (!session) {
                throw new Error('User not authenticated');
            }

            const { error } = await this.client.storage
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
            const { session } = await this.getSession();
            if (!session) throw new Error('User not authenticated');

            const { data: files, error } = await this.client
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
            const { session } = await this.getSession();
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

            const { error: storageError } = await this.client.storage
                .from('storage')
                .upload(filePath, initialBlob);

            if (storageError) throw storageError;

            const now = new Date().toISOString();
            const { error: dbError } = await this.client
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
                await this.client.storage.from('storage').remove([filePath]);
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
            const { session } = await this.getSession();
            if (!session) {
                throw new Error('User not authenticated');
            }

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

            const { error: storageError } = await this.client.storage
                .from('storage')
                .upload(filePath, contentBlob);

            if (storageError) throw storageError;

            const now = new Date().toISOString();
            const { error: dbError } = await this.client
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
                await this.client.storage.from('storage').remove([filePath]);
                throw dbError;
            }

            return { success: true, fileId };
        } catch (error) {
            console.error('Error creating file from JSON:', error);
            return { success: false, error: error.message };
        }
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async checkFileExists(fileName) {
        try {
            const { session } = await this.getSession();
            if (!session) throw new Error('User not authenticated');

            const { data: existingFiles, error } = await this.client
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
            const { session } = await this.getSession();
            if (!session) throw new Error('User not authenticated');

            const validationResult = await this.validateFileName(fileId, newName);
            if (!validationResult.success) return validationResult;

            const validatedName = validationResult.name;
            const now = new Date().toISOString();

            const { error: updateError } = await this.client
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
            const { session } = await this.getSession();
            if (!session) throw new Error('User not authenticated');

            const userId = session.user.id;
            const filePath = `${userId}/${fileId}.json`;

            const { error: storageError } = await this.client.storage
                .from('storage')
                .remove([filePath]);

            if (storageError) {
                console.warn(`Storage deletion warning for ${filePath}: ${storageError.message}`);
            }

            const { error: dbError } = await this.client
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
            const { session } = await this.getSession();
            if (!session) throw new Error('User not authenticated');
            if (!fileId || !newName) throw new Error('File ID and new name are required');

            const trimmedName = newName.trim();
            if (!trimmedName) throw new Error('File name cannot be empty');

            const { data: existingFiles, error } = await this.client
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
            const { session } = await this.getSession();
            if (!session) throw new Error('User not authenticated');

            const { data, error } = await this.client
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
}

const userManager = new User();

export { User, userManager };