import { MathFieldContainer } from './mathfield-container.js';
import { MathFieldEditor } from './mathfield-editor.js';
import { MathFieldEventHandler } from './mathfield-event-handler.js';
import { MathFieldStateManager } from './mathfield-state-manager.js';
import { MathFieldUIManager } from './mathfield-ui-manager.js';

export class MathField {
	constructor(mathGroup, isNewField) {
		this.mathGroup = mathGroup;
		this.containerManager = new MathFieldContainer(mathGroup);
		this.container = this.containerManager.getContainer();
		this.container.mathFieldInstance = this;
		
		this.editor = new MathFieldEditor(this.container, mathGroup);
		this.eventHandler = new MathFieldEventHandler(this);
		this.stateManager = new MathFieldStateManager(this);
		this.uiManager = new MathFieldUIManager(this);

		if (isNewField) {
			this.editor.createMathField();
			this.eventHandler.attachEventListeners();

			if (this.editor.getMathField() && typeof this.editor.getMathField().focus === 'function') {
				this.editor.getMathField().focus();
			}
		}
	}

	finalize() {
		this.stateManager.finalize();
	}
}