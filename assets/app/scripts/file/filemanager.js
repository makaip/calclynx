// scripts/file/filemanager.js
class FileManager {
    constructor(board) {
        this.board = board;
        // Store fileId when FileManager is instantiated
        const urlParams = new URLSearchParams(window.location.search);
        this.fileId = urlParams.get('fileId');
        
        // Initialize reader and writer instances
        this.fileReader = new FileReader(board, this);
        this.fileWriter = new FileWriter(board, this);
        
        // Update file title initially
        this.updateFileTitle();
    }
  
    // Add method to update file title display
    async updateFileTitle() {
        const fileTitleElement = document.getElementById('file-title');
        if (!fileTitleElement) return;

        const currentPath = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        const fileIdFromUrl = urlParams.get('fileId');

        // If on app.html without a fileId, or if this.fileId is not set, show "Untitled"
        if (!this.fileId || (currentPath.endsWith('/app.html') && !fileIdFromUrl)) {
            fileTitleElement.textContent = 'Untitled';
            fileTitleElement.style.display = ''; // Show the element
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
                // Show "Untitled" if error
                fileTitleElement.textContent = 'Untitled';
                fileTitleElement.style.display = '';
                return;
            }

            if (data && data.file_name) {
                fileTitleElement.textContent = data.file_name;
                fileTitleElement.style.display = ''; // Show the element (reverts to CSS default display)
            } else {
                // Show "Untitled" if file_name is null or empty
                fileTitleElement.textContent = 'Untitled';
                fileTitleElement.style.display = '';
            }
        } catch (err) {
            console.error('Exception fetching file title:', err);
            // Show "Untitled" if exception
            fileTitleElement.textContent = 'Untitled';
            fileTitleElement.style.display = '';
        }
    }

    // Delegate to FileWriter
    async saveState() {
        return await this.fileWriter.saveState();
    }

    // Delegate to FileReader
    loadState() {
        return this.fileReader.loadState();
    }

    // Delegate to FileWriter
    exportData() {
        return this.fileWriter.exportData();
    }

    // Delegate to FileReader
    importData(jsonData, shouldSave = true) {
        return this.fileReader.importData(jsonData, shouldSave);
    }

    async renameFile(fileId, newName) {
        if (!fileId || !newName) {
            throw new Error("File ID and new name are required.");
        }
        newName = newName.trim();
        if (!newName) {
            throw new Error("File name cannot be empty.");
        }

        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !session) {
            throw new Error("User session not found. Please log in again.");
        }
        const userId = session.user.id;

        // Check if a file with the new name already exists (excluding the current fileId)
        const { data: existingFiles, error: checkError } = await supabaseClient
            .from('files')
            .select('id')
            .eq('user_id', userId)
            .eq('file_name', newName)
            .neq('id', fileId) // Exclude the current file from the check
            .limit(1);

        if (checkError) {
            console.error('Error checking for existing file name:', checkError);
            throw new Error(`Error checking for existing file: ${checkError.message}`);
        }
        if (existingFiles && existingFiles.length > 0) {
            throw new Error(`A file named "${newName}" already exists.`);
        }

        // Proceed with renaming
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
        
        // If the currently loaded file was renamed, update its title in the header
        if (this.fileId === fileId) {
            await this.updateFileTitle(); // updateFileTitle fetches the new name
        }
        // The sidebar will be refreshed by the calling function in sidebar.js
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

        // 1. Delete from Supabase Storage
        console.log(`Deleting from storage: ${filePath}`);
        const { error: storageError } = await supabaseClient
            .storage
            .from('storage')
            .remove([filePath]);

        if (storageError) {
            // Log storage error but proceed to try DB deletion,
            // as the record might exist even if the file doesn't, or vice-versa.
            console.warn(`Storage deletion warning for ${filePath}: ${storageError.message} (Proceeding with DB deletion)`);
        } else {
            console.log(`Successfully deleted from storage: ${filePath}`);
        }

        // 2. Delete record from 'files' table
        const { error: dbError } = await supabaseClient
            .from('files')
            .delete()
            .eq('id', fileId)
            .eq('user_id', userId); // Ensure user owns the file

        if (dbError) {
            console.error('Error deleting file record from database:', dbError);
            throw new Error(`Database deletion error: ${dbError.message}`);
        }

        console.log(`Successfully deleted file record for ID: ${fileId}`);

        // If the currently loaded file was deleted, update internal state and title
        if (this.fileId === fileId) {
            this.fileId = null; // Clear the loaded fileId
            await this.updateFileTitle(); // This will clear the displayed title
        }
        // The sidebar refresh and potential redirection will be handled by the calling function in sidebar.js
    }
}
