// scripts/file/filewriter.js
class FileWriter {
    constructor(board, fileManager) {
        this.board = board;
        this.fileManager = fileManager;
        this.syncIndicator = document.getElementById('sync-indicator'); // Get indicator element
    }

    async saveState() {
        const saveData = {
            version: "2.0", // Add version for future compatibility
            groups: []
        };
        
        // Save math groups
        const mathGroupElements = this.board.canvas.querySelectorAll('.math-group');
        mathGroupElements.forEach((group) => {
            const left = group.style.left;
            const top = group.style.top;
            const fields = [];
            group.querySelectorAll('.math-field-container').forEach((container) => {
                if (container.dataset.latex) {
                    fields.push(container.dataset.latex);
                }
            });
            saveData.groups.push({ type: 'math', left, top, fields });
        });
        
        // Save text groups with optimized format
        const textGroupElements = this.board.canvas.querySelectorAll('.text-group');
        textGroupElements.forEach((group) => {
            const left = group.style.left;
            const top = group.style.top;
            const fields = [];
            
            // Get the single text field content in optimized format
            const container = group.querySelector('.text-field-container');
            if (container && container.textFieldInstance) {
                const optimizedContent = container.textFieldInstance.getOptimizedContent();
                fields.push(optimizedContent);
            }
            
            saveData.groups.push({ type: 'text', left, top, fields });
        });
        
        const stateString = JSON.stringify(saveData);
        
        // Log storage efficiency if there are text groups
        const textGroupCount = saveData.groups.filter(g => g.type === 'text').length;
        if (textGroupCount > 0) {
            console.log(`Saving ${textGroupCount} text groups with optimized format (v2.0)`);
        }
        
        // Check if we have a fileId to save to the cloud
        if (!this.fileManager.fileId) {
            console.warn("No fileId found, skipping cloud save.");
            // Optionally trigger equivalence check even if not saving to cloud
            this.updateEquivalenceState();
            return; 
        }

        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error || !session) {
            console.error("User session not found, cannot save to cloud.");
            return; // Stop if not logged in
        }

        const userId = session.user.id;
        const fileId = this.fileManager.fileId; 
        const filePath = `${userId}/${fileId}.json`;
        const fileBlob = new Blob([stateString], { type: 'application/json' });
        
        // Show indicator before starting the async operation
        if (this.syncIndicator) {
            this.syncIndicator.classList.add('syncing');
        }

        try {
            console.log(`Starting cloud save for fileId: ${fileId}...`); // Log start
            const { error: uploadError } = await supabaseClient.storage
                .from('storage')
                .upload(filePath, fileBlob, { upsert: true }); // Use upsert to overwrite

            if (uploadError) {
                throw uploadError;
            }

            // Optionally update the last_modified timestamp and file_size in the 'files' table
            const now = new Date().toISOString();
            const { error: dbError } = await supabaseClient
                .from('files')
                .update({ last_modified: now, file_size: fileBlob.size })
                .eq('id', fileId)
                .eq('user_id', userId);

            if (dbError) {
                console.error("Error updating file metadata in database:", dbError);
                // Decide if this is a critical error. The file is saved in storage.
            } else {
                console.log(`Successfully finished cloud save for fileId: ${fileId}.`); // Log success
            }

        } catch (err) {
            console.error(`Error saving file to cloud (fileId: ${fileId}):`, err); // Enhanced error log
            // Handle the error appropriately (e.g., notify the user)
        } finally {
            // Hide indicator after the operation completes (success or error)
            if (this.syncIndicator) {
                this.syncIndicator.classList.remove('syncing');
            }
        }

        this.updateEquivalenceState();
    }

    exportData() {
        const exportData = {
            version: "2.0",
            groups: []
        };
        
        // Export math groups
        const mathGroupElements = this.board.canvas.querySelectorAll('.math-group');
        mathGroupElements.forEach((group) => {
            const left = group.style.left;
            const top = group.style.top;
            const fields = [];
            group.querySelectorAll('.math-field-container').forEach((container) => {
                if (container.dataset.latex) {
                    fields.push(container.dataset.latex);
                }
            });
            exportData.groups.push({ type: 'math', left, top, fields });
        });
        
        // Export text groups with optimized format
        const textGroupElements = this.board.canvas.querySelectorAll('.text-group');
        textGroupElements.forEach((group) => {
            const left = group.style.left;
            const top = group.style.top;
            const fields = [];
            
            // Get the single text field content in optimized format
            const container = group.querySelector('.text-field-container');
            if (container && container.textFieldInstance) {
                const optimizedContent = container.textFieldInstance.getOptimizedContent();
                fields.push(optimizedContent);
            }
            
            exportData.groups.push({ type: 'text', left, top, fields });
        });
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "mathboard-data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    updateEquivalenceState() {
        if (window.expressionEquivalence) {
            window.expressionEquivalence.logEquivalentExpressions();
            window.expressionEquivalence.applyIndicatorColors();
        }
    }
}
