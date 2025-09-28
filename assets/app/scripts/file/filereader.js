import { TextGroup } from '../text/textgroup.js';
import { MathGroup } from '../math/mathgroup.js';
import { ImageGroup } from '../image/imagegroup.js';
import { EquivalenceUtils } from '../utils/equivalence-utils.js';

class FileReader {
    constructor(board, fileManager) {
        this.board = board;
        this.fileManager = fileManager;
    }

    async loadState() {
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
            
            await this.fileManager.updateFileTitle();

        } catch (error) {
            console.error("Error loading file content from cloud:", error);
            this.initializeEmptyState();
        }
    }

    initializeEmptyState() {
        this.board.canvas.innerHTML = '';
    }

    importData(jsonData, shouldSave = true) {
        try {
            let parsedData = JSON.parse(jsonData);

            if (!parsedData.version || !parsedData.groups) {
                console.error("Invalid data format. Expected versioned format with groups array.");
                this.board.canvas.innerHTML = '';
                return;
            }

            console.log(`Loading data format version: ${parsedData.version}`);
            this.board.canvas.innerHTML = '';
            
            parsedData.groups.forEach((groupData) => {
                if (groupData.type === 'text') {
                    new TextGroup(this.board, 0, 0, groupData);
                } else if (groupData.type === 'math') {
                    new MathGroup(this.board, 0, 0, groupData);
                } else if (groupData.type === 'image') {
                    new ImageGroup(this.board, 0, 0, groupData);
                } else {
                    console.warn("Unknown group type:", groupData.type);
                }
            });

            if (shouldSave) {
                this.fileManager.fileWriter.saveState();
            } else {
                EquivalenceUtils.updateEquivalenceState();
            }
        } catch (error) {
            console.error("Error importing data:", error);
            this.board.canvas.innerHTML = '';
        }
    }
}

export { FileReader };