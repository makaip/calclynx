class FileManager {
    constructor(board) {
        this.board = board;

        const urlParams = new URLSearchParams(window.location.search);
        this.fileId = urlParams.get('fileId');
        
        this.fileReader = new FileReader(board, this);
        this.fileWriter = new FileWriter(board, this);
        
        this.updateFileTitle();
    }
  
    async updateFileTitle() {
        const fileTitleElement = document.getElementById('file-title');
        if (!fileTitleElement) return;

        const currentPath = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        const fileIdFromUrl = urlParams.get('fileId');

        let fileNotLoaded = !this.fileId || (currentPath.endsWith('/app.html') && !fileIdFromUrl);
        if (fileNotLoaded) {
            fileTitleElement.textContent = 'Untitled';
            fileTitleElement.style.display = '';
            return;
        }
        
        try {
            const { data, error } = await supabaseClient
                .from('files')
                .select('file_name')
                .eq('id', this.fileId)
                .single();
                
            if (error) {
                console.error('Error fetching file title:', error);
                fileTitleElement.textContent = 'Untitled';
                fileTitleElement.style.display = '';
                return;
            }

            if (data && data.file_name) {
                fileTitleElement.textContent = data.file_name;
                fileTitleElement.style.display = '';
            } else {
                fileTitleElement.textContent = 'Untitled';
                fileTitleElement.style.display = '';
            }
        } catch (err) {
            console.error('Exception fetching file title:', err);
            fileTitleElement.textContent = 'Untitled';
            fileTitleElement.style.display = '';
        }
    }

    async saveState() {
        return await this.fileWriter.saveState();
    }

    loadState() {
        return this.fileReader.loadState();
    }

    exportData() {
        return this.fileWriter.exportData();
    }

    importData(jsonData, shouldSave = true) {
        return this.fileReader.importData(jsonData, shouldSave);
    }

    async validateFileName(fileId, newName, userId) {
        if (!fileId || !newName) {
            throw new Error("File ID and new name are required.");
        }
        newName = newName.trim();
        if (!newName) {
            throw new Error("File name cannot be empty.");
        }

        const { data: existingFiles, error: checkError } = await supabaseClient
            .from('files')
            .select('id')
            .eq('user_id', userId)
            .eq('file_name', newName)
            .neq('id', fileId) // exclude current file from check or else everything is nuked
            .limit(1);

        if (checkError) {
            console.error('Error checking for existing file name:', checkError);
            throw new Error(`Error checking for existing file: ${checkError.message}`);
        }
        if (existingFiles && existingFiles.length > 0) {
            throw new Error(`A file named "${newName}" already exists.`);
        }

        return newName;
    }

    async renameFile(fileId, newName) {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !session) {
            throw new Error("User session not found. Please log in again.");
        }
        const userId = session.user.id;

        newName = await this.validateFileName(fileId, newName, userId);

        const now = new Date().toISOString();
        const { error: updateError } = await supabaseClient
            .from('files')
            .update({ file_name: newName, last_modified: now })
            .eq('id', fileId)
            .eq('user_id', userId);

        if (updateError) {
            console.error('Error renaming file in database:', updateError);
            throw new Error(`Database error: ${updateError.message}`);
        }

        console.log(`File ${fileId} renamed to ${newName}`);
        
        // if the currently loaded file was renamed, update its title in the header
        if (this.fileId === fileId) {
            await this.updateFileTitle(); // updateFileTitle fetches the new name
        }
        // refreshed in sidebar.js
    }

    async deleteFile(fileId) {
        if (!fileId) {
            throw new Error("File ID is required for deletion.");
        }

        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !session) {
            throw new Error("User session not found. Please log in again.");
        }
        const userId = session.user.id;
        const filePath = `${userId}/${fileId}.json`;

        console.log(`Deleting from storage: ${filePath}`);
        const { error: storageError } = await supabaseClient
            .storage
            .from('storage')
            .remove([filePath]);

        if (storageError) {
            console.warn(`Storage deletion warning for ${filePath}: ${storageError.message} (Proceeding with DB deletion)`);
        } else {
            console.log(`Successfully deleted from storage: ${filePath}`);
        }

        const { error: dbError } = await supabaseClient
            .from('files')
            .delete()
            .eq('id', fileId)
            .eq('user_id', userId); // ensure user owns the file

        if (dbError) {
            console.error('Error deleting file record from database:', dbError);
            throw new Error(`Database deletion error: ${dbError.message}`);
        }

        console.log(`Successfully deleted file record for ID: ${fileId}`);

        if (this.fileId === fileId) {
            this.fileId = null; // clear loaded fileId
            await this.updateFileTitle();
        }
        // refresh in sidebar.js
    }
}
