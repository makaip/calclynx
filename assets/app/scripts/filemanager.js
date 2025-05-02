// scripts/filemanager.js
class FileManager {
    constructor(board) {
      this.board = board;
      // Store fileId when FileManager is instantiated
      const urlParams = new URLSearchParams(window.location.search);
      this.fileId = urlParams.get('fileId');
      this.syncIndicator = document.getElementById('sync-indicator'); // Get indicator element
    }
  
    async saveState() {
      const groups = [];
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
        groups.push({ left, top, fields });
      });
      const stateString = JSON.stringify(groups);
      
      // Check if we have a fileId to save to the cloud
      if (!this.fileId) {
        console.warn("No fileId found, skipping cloud save.");
        // Optionally trigger equivalence check even if not saving to cloud
        if (window.expressionEquivalence) {
          window.expressionEquivalence.logEquivalentExpressions();
          window.expressionEquivalence.applyIndicatorColors();
        }
        return; 
      }

      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error || !session) {
        console.error("User session not found, cannot save to cloud.");
        return; // Stop if not logged in
      }

      const userId = session.user.id;
      const fileId = this.fileId; 
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

      if (window.expressionEquivalence) {
        window.expressionEquivalence.logEquivalentExpressions();
        window.expressionEquivalence.applyIndicatorColors();
      }
    }
  
    loadState() {
      // Attempt to load from cloud first if fileId exists
      if (this.fileId) {
        this.loadStateFromCloud(); 
      } else {
        console.log("No fileId found. Starting with an empty board.");
        // Initialize VersionManager with the empty state if needed
        if (window.versionManager) {
            const initialState = window.versionManager.getCurrentState(); // Should be empty '[]'
            window.versionManager.pushUndoState(initialState);
            window.versionManager.redoStack = [];
        }
      }
    }

    async loadStateFromCloud() {
      console.log(`Attempting to load file from cloud: ${this.fileId}`);
      try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !session) {
          throw new Error("User session not found. Cannot load file.");
        }
        const userId = session.user.id;
        const filePath = `${userId}/${this.fileId}.json`;

        const { data: blob, error: downloadError } = await supabaseClient
          .storage
          .from('storage')
          .download(filePath);

        if (downloadError) {
          if (downloadError.message.includes("Object not found")) {
             console.warn(`File ${this.fileId} not found in cloud storage. Starting with an empty board.`);
             // Initialize VersionManager with the empty state if needed
             if (window.versionManager) {
                 const initialState = window.versionManager.getCurrentState(); // Should be empty '[]'
                 window.versionManager.pushUndoState(initialState);
                 window.versionManager.redoStack = [];
             }
          } else {
            throw new Error(`Failed to download file: ${downloadError.message}`);
          }
          return; 
        }

        if (!blob) {
          throw new Error("Downloaded file blob is null or undefined.");
        }

        const fileContentText = await blob.text();
        this.importData(fileContentText, false); // Pass flag to prevent immediate re-save

      } catch (error) {
        console.error("Error loading file content from cloud:", error);
        alert(`Error loading file: ${error.message}. Starting with an empty board.`);
        // Initialize VersionManager with the empty state if needed
        if (window.versionManager) {
            const initialState = window.versionManager.getCurrentState(); // Should be empty '[]'
            window.versionManager.pushUndoState(initialState);
            window.versionManager.redoStack = [];
        }
      }
    }
  
    exportData() {
      const groups = [];
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
        groups.push({ left, top, fields });
      });
      const dataStr = JSON.stringify(groups, null, 2);
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
  
    // Modified importData to accept an optional flag to prevent immediate saving
    importData(jsonData, shouldSave = true) {
      try {
        let groups = JSON.parse(jsonData);

        // Ensure groups is an array before proceeding
        if (!Array.isArray(groups)) {
          console.warn("Imported data is not an array. Initializing with empty board.", groups);
          groups = []; // Default to empty array to prevent errors
        }

        // Clear the current canvas (remove all existing math groups).
        this.board.canvas.innerHTML = '';
        // Clear instances tracked by MathBoard if necessary (depends on implementation)
        // e.g., this.board.mathGroupInstances = [];
        groups.forEach((groupData) => {
           // Ensure MathGroup constructor correctly handles data format
           new MathGroup(this.board, 0, 0, groupData);
        });

        // Only save state if shouldSave is true (defaults to true)
        if (shouldSave) {
          // Save the new state and trigger equivalence check.
          // Use VersionManager if available, otherwise fallback to direct saveState
          if (window.versionManager) {
            window.versionManager.saveState(); // This should internally call fileManager.saveState()
          } else {
            this.saveState();
          }
        } else {
           // Even if not saving, update equivalence state after import
           if (window.expressionEquivalence) {
             window.expressionEquivalence.logEquivalentExpressions();
             window.expressionEquivalence.applyIndicatorColors();
           }
           // Optionally push an initial state to VersionManager after cloud/local load
           if (window.versionManager) {
             const initialState = window.versionManager.getCurrentState();
             window.versionManager.pushUndoState(initialState); // Push without clearing redo
             window.versionManager.redoStack = []; // Clear redo after initial load
           }
        }
      } catch (error) {
         console.error("Error importing data:", error);
         alert("Failed to load board data. The file might be corrupted.");
         // Optionally clear the board or initialize empty state here as well
         this.board.canvas.innerHTML = '';
         if (window.versionManager) {
            const initialState = window.versionManager.getCurrentState(); // Should be empty '[]'
            window.versionManager.pushUndoState(initialState);
            window.versionManager.redoStack = [];
         }
      }
    }
  }
