// scripts/file/filereader.js
class FileReader {
    constructor(board, fileManager) {
        this.board = board;
        this.fileManager = fileManager;
    }

    async loadState() {
        // Attempt to load from cloud first if fileId exists
        if (this.fileManager.fileId) {
            await this.loadStateFromCloud(); 
        } else {
            console.log("No fileId found. Starting with an empty board.");
            this.initializeEmptyState();
        }
    }

    async loadStateFromCloud() {
        console.log(`Attempting to load file from cloud: ${this.fileManager.fileId}`);
        try {
            const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
            if (sessionError || !session) {
                throw new Error("User session not found. Cannot load file.");
            }
            const userId = session.user.id;
            const filePath = `${userId}/${this.fileManager.fileId}.json`;

            const { data: blob, error: downloadError } = await supabaseClient
                .storage
                .from('storage')
                .download(filePath);

            if (downloadError) {
                // Handle different types of errors
                if (downloadError.message && (
                    downloadError.message.includes("Object not found") || 
                    downloadError.message.includes("The resource was not found") ||
                    downloadError.statusCode === 404
                )) {
                    console.warn(`File ${this.fileManager.fileId} not found in cloud storage. Starting with an empty board.`);
                    this.initializeEmptyState();
                    return;
                } else {
                    console.error(`Failed to download file:`, downloadError);
                    throw new Error(`Failed to download file: ${downloadError.message || JSON.stringify(downloadError)}`);
                }
            }

            if (!blob) {
                throw new Error("Downloaded file blob is null or undefined.");
            }

            const fileContentText = await blob.text();
            this.importData(fileContentText, false); // Pass flag to prevent immediate re-save
            
            // Update file title after successful load
            await this.fileManager.updateFileTitle();

        } catch (error) {
            console.error("Error loading file content from cloud:", error);
            this.initializeEmptyState();
        }
    }

    initializeEmptyState() {
        // Initialize with empty canvas
        this.board.canvas.innerHTML = '';
    }

    // Modified importData to accept an optional flag to prevent immediate saving
    importData(jsonData, shouldSave = true) {
        try {
            let groups = JSON.parse(jsonData);

            // Ensure groups is an array before proceeding
            if (!Array.isArray(groups)) {
                console.warn("Imported data is not an array. Initializing with empty board.", groups);
                groups = []; // Default to empty array to prevent errors
            }

            // Clear the current canvas (remove all existing math and text groups).
            this.board.canvas.innerHTML = '';
            
            groups.forEach((groupData) => {
                // Handle both new format with type and legacy format without type
                if (groupData.type === 'text') {
                    new TextGroup(this.board, 0, 0, groupData);
                } else {
                    // Default to math group for backward compatibility
                    new MathGroup(this.board, 0, 0, groupData);
                }
            });

            // Only save state if shouldSave is true (defaults to true)
            if (shouldSave) {
                // Save the new state and trigger equivalence check.
                this.fileManager.fileWriter.saveState();
            } else {
                // Even if not saving, update equivalence state after import
                this.updateEquivalenceState();
            }
        } catch (error) {
            console.error("Error importing data:", error);
            // Optionally clear the board or initialize empty state here as well
            this.board.canvas.innerHTML = '';
        }
    }

    updateEquivalenceState() {
        if (window.expressionEquivalence) {
            window.expressionEquivalence.logEquivalentExpressions();
            window.expressionEquivalence.applyIndicatorColors();
        }
    }
}