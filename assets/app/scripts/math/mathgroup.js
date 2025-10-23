import { ObjectGroup } from '../core/objectgroup.js';
import { MathField } from './mathfield.js';

const MQ = window.MathQuill ? window.MathQuill.getInterface(2) : null;

export class MathGroup extends ObjectGroup {
	constructor(board, x, y, data = null) {
		super(board, x, y, data, 'math');

		this.attachFocusOutHandler();
		this.mathFieldInstances = [];

		this.draggedFieldElement = null;
		this.fieldPlaceholder = null;
		this.fieldDragStartY = 0;
		this.fieldDragInitialTop = 0;

		if (data && data.fields && data.fields.length) {
			data.fields.forEach((latex) => {
				const mathFieldInstance = new MathField(this, false);
				mathFieldInstance.container.dataset.latex = latex;

				const staticMath = document.createElement('div');
				staticMath.className = 'math-field';

				const handle = mathFieldInstance.container.querySelector(':scope > .drag-handle');
				mathFieldInstance.container.insertBefore(staticMath, handle.nextSibling);
				MQ.StaticMath(staticMath).latex(latex);

				this.mathFieldInstances.push(mathFieldInstance);
			});
		} else {
			this.addMathField(true);
		}

		this.attachFieldDragListener();
	}

	attachFocusOutHandler() {
		this.element.addEventListener('focusout', () => {
			setTimeout(() => {
				if (!this.element.contains(document.activeElement)) {
					if (this.element.children.length === 1) {
						const container = this.element.children[0];
						if (!container.dataset.latex || container.dataset.latex.trim() === '') {
							this.remove();
						}
					}
				}
			}, 50);
		});
	}

	addMathField(isNewField) {
		const newFieldInstance = new MathField(this, isNewField);
		this.mathFieldInstances.push(newFieldInstance);
	}

	remove() {
		if (this.boundHandleFieldDragMove) {
			document.removeEventListener('mousemove', this.boundHandleFieldDragMove);
			this.boundHandleFieldDragMove = null;
		}
		if (this.boundHandleFieldDragEnd) {
			document.removeEventListener('mouseup', this.boundHandleFieldDragEnd);
			this.boundHandleFieldDragEnd = null;
		}
		super.remove();
	}

	insertMathFieldAfter(referenceContainer) {
		const newFieldInstance = new MathField(this, true); // Create new editable field
		const refIndex = this.mathFieldInstances.findIndex(mf => mf.container === referenceContainer);
		this.element.insertBefore(newFieldInstance.container, referenceContainer.nextSibling);

		if (refIndex !== -1) {
			this.mathFieldInstances.splice(refIndex + 1, 0, newFieldInstance);
		} else {
			this.mathFieldInstances.push(newFieldInstance); // Fallback: add to end
		}

		const mathField = newFieldInstance.editor.mathField;
		if (mathField && typeof mathField.focus === 'function') {
			mathField.focus();
		}
		return newFieldInstance; // <<< Return the new instance
	}

	attachFieldDragListener() {
		this.element.addEventListener('mousedown', (e) => {
			const handle = e.target.closest('.drag-handle');
			if (handle && this.element.contains(handle)) {
				const fieldContainer = handle.closest('.math-field-container');
				if (fieldContainer) {
					this.handleFieldDragStart(e, fieldContainer);
				}
			}
		}, true);
	}

	handleFieldDragStart(e, fieldContainer) {
		if (e.button !== 0) return;
		e.preventDefault();
		e.stopPropagation();

		this.draggedFieldElement = fieldContainer;
		this.fieldDragStartY = e.clientY;
		this.fieldDragInitialTop = this.draggedFieldElement.offsetTop;

		this.fieldPlaceholder = document.createElement('div');
		this.fieldPlaceholder.className = 'drop-placeholder';
		this.fieldPlaceholder.style.height = `${this.draggedFieldElement.offsetHeight}px`;

		this.setDraggedFieldStyles(true);

		this.draggedFieldElement.parentElement.insertBefore(this.fieldPlaceholder, this.draggedFieldElement);

		// Use bind to ensure 'this' refers to the MathGroup instance
		this.boundHandleFieldDragMove = this.handleFieldDragMove.bind(this);
		this.boundHandleFieldDragEnd = this.handleFieldDragEnd.bind(this);

		document.addEventListener('mousemove', this.boundHandleFieldDragMove);
		document.addEventListener('mouseup', this.boundHandleFieldDragEnd, { once: true });
	}

	handleFieldDragMove(e) {
		if (!this.draggedFieldElement) return;

		const currentY = e.clientY;
		const deltaY = currentY - this.fieldDragStartY;

		this.draggedFieldElement.style.top = `${this.fieldDragInitialTop + deltaY}px`;

		const parent = this.fieldPlaceholder.parentElement;
		const siblings = Array.from(parent.children).filter(child =>
			child !== this.draggedFieldElement && child.classList.contains('math-field-container')
		);

		let nextSibling = null;
		const draggedRect = this.draggedFieldElement.getBoundingClientRect();
		const draggedMidpoint = draggedRect.top + draggedRect.height / 2;

		for (const sibling of siblings) {
			if (sibling === this.fieldPlaceholder) continue;
			const rect = sibling.getBoundingClientRect();
			const siblingMidpoint = rect.top + rect.height / 2;
			if (draggedMidpoint > siblingMidpoint) {
				nextSibling = sibling.nextElementSibling;
			} else {
				nextSibling = sibling;
				break;
			}
		}
		parent.insertBefore(this.fieldPlaceholder, nextSibling);
	}

	handleFieldDragEnd() {
		if (!this.draggedFieldElement || !this.fieldPlaceholder) return;

		this.fieldPlaceholder.parentElement.insertBefore(this.draggedFieldElement, this.fieldPlaceholder);

		this.setDraggedFieldStyles(false);

		this.fieldPlaceholder.remove();
		this.draggedFieldElement = null;
		this.fieldPlaceholder = null;

		document.removeEventListener('mousemove', this.boundHandleFieldDragMove);
		this.updateInstanceOrder();
		this.board.fileManager.saveState();
	}

	updateInstanceOrder() {
		const orderedContainers = Array.from(this.element.querySelectorAll('.math-field-container'));
		this.mathFieldInstances = orderedContainers
			.map(container => container.mathFieldInstance)
			.filter(instance => instance); // Filter out any undefined if linking failed
	}

	setDraggedFieldStyles(isDragging) {
		const el = this.draggedFieldElement;

		if (isDragging) {
			el.classList.add('dragging-field');
			Object.assign(el.style, {
				position: 'absolute',
				top: `${this.fieldDragInitialTop}px`,
				left: '0',
				width: 'calc(100% - 20px)'
			});
		} else {
			el.classList.remove('dragging-field');
			Object.assign(el.style, {
				position: '',
				top: '',
				left: '',
				width: ''
			});
		}
	}
}

