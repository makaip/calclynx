class FileWriter {
    constructor(board, fileManager) {
        this.board = board;
        this.fileManager = fileManager;
        this.syncIndicator = document.getElementById('sync-indicator'); // Get indicator element
    }

    saveMathGroups(saveData) {
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
    }

    saveTextGroups(saveData) {
        const textGroupElements = this.board.canvas.querySelectorAll('.text-group');
        textGroupElements.forEach((group) => {
            const left = group.style.left;
            const top = group.style.top;
            const fields = [];
            const container = group.querySelector('.text-field-container');

            if (container && container.textFieldInstance) {
                const optimizedContent = container.textFieldInstance.getOptimizedContent();
                fields.push(optimizedContent);
            }
            
            saveData.groups.push({ type: 'text', left, top, fields });
        });
    }

    saveImageGroups(saveData) {
        const imageGroupElements = this.board.canvas.querySelectorAll('.image-group');
        imageGroupElements.forEach((group) => {
            const left = group.style.left;
            const top = group.style.top;
            const imageUrl = group.imageGroup ? group.imageGroup.imageUrl : null;
            const imageWidth = group.imageGroup ? group.imageGroup.imageWidth : null;
            const imageHeight = group.imageGroup ? group.imageGroup.imageHeight : null;
            
            saveData.groups.push({ type: 'image', left, top, imageUrl, imageWidth, imageHeight });
        });
    }

    async saveState() {
        const saveData = {
            version: "2.0", 
            groups: []
        };
        
        this.saveMathGroups(saveData);
        this.saveTextGroups(saveData);
        this.saveImageGroups(saveData);
        
        const stateString = JSON.stringify(saveData);
        
        if (!this.fileManager.fileId) {
            console.warn("No fileId found, skipping cloud save.");
            EquivalenceUtils.updateEquivalenceState();
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
            console.log(`Starting cloud save for fileId: ${fileId}...`); 
            const { error: uploadError } = await supabaseClient.storage
                .from('storage')
                .upload(filePath, fileBlob, { upsert: true }); // upsert to overwrite

            if (uploadError) {
                throw uploadError;
            }

            const now = new Date().toISOString();
            const { error: dbError } = await supabaseClient
                .from('files')
                .update({ last_modified: now, file_size: fileBlob.size })
                .eq('id', fileId)
                .eq('user_id', userId);

            if (dbError) {
                console.error("Error updating file metadata in database:", dbError);
            } else {
                console.log(`Successfully finished cloud save for fileId: ${fileId}.`);
            }

        } catch (err) {
            console.error(`Error saving file to cloud (fileId: ${fileId}):`, err);
        } finally {
            if (this.syncIndicator) {
                this.syncIndicator.classList.remove('syncing');
            }
        }

        EquivalenceUtils.updateEquivalenceState();
    }

    exportData() {
        const exportData = {
            version: "2.0",
            groups: []
        };
        
        this.saveMathGroups(exportData);
        this.saveTextGroups(exportData);
        this.saveImageGroups(exportData);
        
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
}
