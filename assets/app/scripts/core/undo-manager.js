/**
 * UndoManager - Manages undo/redo history for the canvas board.
 *
 * Strategy: snapshot-based undo/redo.
 * history: oldest → newest (current state is always the last entry).
 * future:  states that were undone, oldest-undone first (redo restores from the end).
 */

class UndoManager {
	/**
	 * @param {number} maxHistory - Maximum number of snapshots to keep.
	 */
	constructor(maxHistory = 100) {
		this.maxHistory = maxHistory;
		this.history = [];
		this.future = [];

		/** True while we are in the middle of restoring a snapshot. */
		this.isRestoring = false;
	}

	/**
	 * Capture a snapshot of the current canvas state.
	 * Called by FileWriter.saveState() *before* the cloud upload so that even
	 * a failed save still gets an undo entry.
	 *
	 * @param {string} stateString - JSON string produced by FileWriter.
	 */
	pushSnapshot(stateString) {
		if (this.isRestoring) return;

		// A brand-new action invalidates the redo stack.
		this.future = [];

		// Avoid duplicate consecutive snapshots (e.g. rapid fire events).
		if (this.history.length > 0 && this.history[this.history.length - 1] === stateString) {
			return;
		}

		this.history.push(stateString);

		if (this.history.length > this.maxHistory) {
			this.history.shift();
		}
	}

	/**
	 * Undo: restore the previous snapshot.
	 *
	 * @param {import('./canvas.js').MathBoard} board
	 * @returns {boolean} true if an undo was performed.
	 */
	undo(board) {
		if (this.history.length < 2) return false;

		// Move the current state onto the redo stack.
		this.future.push(this.history.pop());

		const previousState = this.history[this.history.length - 1];

		this.isRestoring = true;
		try {
			// importData with shouldSave=false so we don't trigger another
			// saveState → pushSnapshot cycle.
			board.fileManager.importData(previousState, false);
		} finally {
			this.isRestoring = false;
		}

		return true;
	}

	/**
	 * Redo: restore the next undone snapshot.
	 *
	 * @param {import('./canvas.js').MathBoard} board
	 * @returns {boolean} true if a redo was performed.
	 */
	redo(board) {
		if (this.future.length === 0) return false;

		// Move the next future state back onto the history stack.
		const nextState = this.future.pop();
		this.history.push(nextState);

		this.isRestoring = true;
		try {
			// importData with shouldSave=false so we don't trigger another
			// saveState → pushSnapshot cycle.
			board.fileManager.importData(nextState, false);
		} finally {
			this.isRestoring = false;
		}

		return true;
	}

	/** Returns true if there is anything to undo. */
	canUndo() {
		return this.history.length >= 2;
	}

	/** Returns true if there is anything to redo. */
	canRedo() {
		return this.future.length > 0;
	}

	/** Clear all history (e.g. when a new file is loaded). */
	clear() {
		this.history = [];
		this.future = [];
	}
}

export { UndoManager };

