import { EquivalenceUtils } from '../utils/equivalence-utils.js';
import { supabaseClient } from '../auth/initsupabaseapp.js';

class FileWriter {
    constructor(board, fileManager) {
        this.board = board;
        this.fileManager = fileManager;
        this.syncIndicator = document.getElementById('sync-indicator');
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
            let widthData = null;
            
            const containers = group.querySelectorAll('.text-field-container');
            containers.forEach((container) => {
                const field = container.textFieldInstance;
                if (!field) return;
                if (field.content && typeof field.content.getContent === 'function') {
                    const pmContent = field.content.getContent();
                    fields.push(pmContent ?? field.getOptimizedContent());
                } else {
                    fields.push(field.getOptimizedContent());
                }
                
                if (field.getWidthData) {
                    const fieldWidthData = field.getWidthData();
                    if (fieldWidthData) {
                        widthData = fieldWidthData;
                    }
                }
            });
            
            const groupData = { type: 'text', left, top, fields };
            if (widthData) {
                groupData.widthData = widthData;
            }
            
            saveData.groups.push(groupData);
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
        let version = "3.0";
        let hasProseMirrorCapability = window.proseMirrorReady && window.ProseMirror;
        
        if (!hasProseMirrorCapability) {
            version = "2.0";
            console.warn("ProseMirror not available, saving as v2.0 format");
        }
        
        const saveData = {
            version: version, 
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
            return;
        }

        const userId = session.user.id;
        const fileId = this.fileManager.fileId; 
        const filePath = `${userId}/${fileId}.json`;
        const fileBlob = new Blob([stateString], { type: 'application/json' });
        
        if (this.syncIndicator) {
            this.syncIndicator.classList.add('syncing');
        }

        try {
            console.log(`Starting cloud save for fileId: ${fileId} (version ${version})...`); 
            const { error: uploadError } = await supabaseClient.storage
                .from('storage')
                .upload(filePath, fileBlob, { upsert: true }); // upsert to overwrite

            if (uploadError) {
                throw uploadError;
            }

            const now = new Date().toISOString();
            const { error: dbError } = await supabaseClient
                .from('files')
                .update({ 
                    last_modified: now, 
                    file_size: fileBlob.size,
                    version: parseInt(version)
                })
                .eq('id', fileId)
                .eq('user_id', userId);

            if (dbError) {
                console.error("Error updating file metadata in database:", dbError);
            } else {
                console.log(`Successfully finished cloud save for fileId: ${fileId} (version ${version}).`);
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
        let version = "3.0";
        let hasProseMirrorCapability = window.proseMirrorReady && window.ProseMirror;
        
        if (!hasProseMirrorCapability) {
            version = "2.0";
            console.warn("ProseMirror not available, exporting as v2.0 format");
        }
        
        const exportData = {
            version: version,
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
        a.download = `mathboard-data-v${version}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

export { FileWriter };
