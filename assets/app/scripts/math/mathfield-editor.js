import { MathFieldUtils } from './mathfield-utils.js';
import { MathFieldUIManager } from './mathfield-ui-manager.js';

const MQ = window.MathQuill ? window.MathQuill.getInterface(2) : null;

class MathFieldEditor {
	constructor(container, mathGroup) {
		this.container = container;
		this.mathGroup = mathGroup;
		this.mathField = null;
		this.mathFieldElement = null;
	}

	createMathField() {
		if (this.hasMathField()) return;

		if (!window.MathQuill) {
			console.warn('MathQuill not loaded, cannot create math field');
			return;
		}

		this.mathFieldElement = MathFieldEditor.createEditableMathField(this.container);
		this.mathField = MQ.MathField(
			this.mathFieldElement,
			this.getMathQuillConfig()
		);
	}

	hasMathField() {
		return !!this.container.querySelector(':scope > .math-field');
	}

	getMathQuillConfig() {
		return MathFieldEditor.buildMathQuillConfig((latex) => {
			this.container.dataset.latex = latex;
		});
	}

	// Shared MathQuill configuration builder
	static buildMathQuillConfig(onEditCallback) {
		return {
			spaceBehavesLikeTab: false,
			leftRightIntoCmdGoes: 'up',
			restrictMismatchedBrackets: true,
			sumStartsWithNEquals: true,
			supSubsRequireOperand: true,
			charsThatBreakOutOfSupSub: '=<>',
			autoSubscriptNumerals: false,
			autoCommands: 'pi theta sqrt sum prod alpha beta gamma delta epsilon zeta eta mu nu xi rho sigma tau phi chi psi omega',
			autoOperatorNames: 'sin cos tan sec csc cot sinh cosh tanh log ln exp lim sup inf det gcd lcm min max',
			maxDepth: 10,
			handlers: {
				edit: function() {
					const latex = this.latex().trim();
					onEditCallback(latex);
				}
			}
		};
	}

	// Static methods for editing existing math field containers
	static edit(container) {
		const existingLatex = container.dataset.latex || '';

		if (!MathFieldUtils.canEdit(container)) return;

		MathFieldEditor.clearGroupSelection(container);
		MathFieldEditor.prepareContainerForEdit(container, existingLatex);
		MathFieldEditor.attachEditEventListeners(container);
	}

	static clearGroupSelection(container) {
		const mathGroupEl = container.closest('.math-group');
		if (mathGroupEl) mathGroupEl.classList.remove('selected');
	}

	static prepareContainerForEdit(container, existingLatex) {
		MathFieldEditor.removeStaticMath(container);
		MathFieldEditor.ensureContainerStructure(container);

		const mathFieldElement = MathFieldEditor.createEditableMathField(container);
		const mathField = MathFieldEditor.initializeEditableMathField(mathFieldElement, existingLatex, container);

		MathFieldUIManager.highlightGroupExpressions(container);
		mathField.focus();

		return { mathFieldElement, mathField };
	}

	static removeStaticMath(container) {
		const staticMathElement = container.querySelector('.math-field:not(.mq-editable-field)');
		if (staticMathElement) staticMathElement.remove();
	}

	static ensureContainerStructure(container) {
		const handle = container.querySelector(':scope > .drag-handle');

		if (!handle) MathFieldEditor.recreateContainerStructure(container);
	}

	static recreateContainerStructure(container) {
		const dragHandle = MathFieldUtils.createDragHandle();
		container.insertBefore(dragHandle, container.firstChild);
	}

	static createEditableMathField(container) {
		const mathFieldElement = MathFieldUtils.createMathFieldElement();
		const handle = container.querySelector(':scope > .drag-handle');
		container.insertBefore(mathFieldElement, handle.nextSibling);
		
		return mathFieldElement;
	}

	static initializeEditableMathField(mathFieldElement, existingLatex, container) {
		if (!window.MathQuill) return null;

		const mathField = MQ.MathField(
			mathFieldElement, 
			MathFieldEditor.buildMathQuillConfig((latex) => {
				container.dataset.latex = latex;
			})
		);

		mathField.latex(existingLatex);
		return mathField;
	}

	static attachEditEventListeners(container) {
		const mathFieldElement = container.querySelector('.math-field');
		if (!mathFieldElement) return;

		MathFieldEditor.attachEditKeydownListener(mathFieldElement, container);
		MathFieldEditor.attachEditBlurListener(mathFieldElement, container);
	}

	static attachEditKeydownListener(mathFieldElement, container) {
		mathFieldElement.addEventListener('keydown', (event) => {
			const mathField = MQ(mathFieldElement);

			if (event.key === 'Backspace') {
				MathFieldEditor.handleStaticBackspace(event, mathField, container);
			}

			if (event.key === 'Enter') {
				MathFieldEditor.handleStaticEnter(event, mathField, container);
			}
		});
	}

	static handleStaticBackspace(event, mathField, container) {
		if (event.ctrlKey) {
			event.preventDefault();
			const group = container.parentElement;

			if (event.shiftKey) {
				group?.remove();
				return;
			}

			container.remove();
			if (group && !group.querySelector('.math-field-container')) group.remove();

		} else if (!mathField.latex().trim()) {
			const previousContainer = container.previousElementSibling;
			const group = container.parentElement;
			const wasLast = group?.querySelectorAll('.math-field-container').length === 1;

			if (previousContainer && previousContainer.classList.contains('math-field-container')) {
				event.preventDefault();

				const currentLatex = container.dataset.latex;
				container.remove();
				MathFieldEditor.edit(previousContainer);

				if (currentLatex && group?.mathGroup) group.mathGroup.board.fileManager.saveState();
			} else if (group?.mathGroup && wasLast) {
				event.preventDefault();
				group.mathGroup.remove();
			}
		}
	}

	static handleStaticEnter(event, mathField, container) {
		event.preventDefault();
		const latex = mathField.latex().trim();

		const group = container.parentElement;
		if (!latex) {
			const wasLast = (group?.querySelectorAll('.math-field-container')?.length ?? 0) === 1;
			container.remove();
			if (group && wasLast) group.remove();
			return;
		}

		container.dataset.latex = latex;
		MathFieldUtils.recreateStaticContainer(container, latex);
		MathFieldEditor.handleStaticEnterNavigation(container);
	}

	static handleStaticEnterNavigation(container) {
		const groupElement = container.parentElement;
		if (groupElement && groupElement.lastElementChild === container && groupElement.mathGroup) {
			groupElement.mathGroup.addMathField(true);
		} else if (groupElement && groupElement.mathGroup) {
			groupElement.mathGroup.insertMathFieldAfter(container);
		}
	}

	static attachEditBlurListener(mathFieldElement, container) {
		mathFieldElement.addEventListener('blur', function () {
			setTimeout(() => {
				const mathField = MQ(mathFieldElement);
				const latexValue = mathField.latex().trim();

				if (!latexValue) {
					const group = container.parentElement;
					container.remove();
					if (group && !group.querySelector('.math-field-container')) group.remove();
				} else {
					const hasText = MathFieldUtils.hasTextContent(latexValue);

					container.dataset.latex = latexValue;
					MathFieldUtils.recreateStaticContainer(container, latexValue);

					const group = container.parentElement;
					if (group && group.mathGroup) {
						group.mathGroup.board.fileManager.saveState();
						MathFieldUIManager.processEquivalenceColors(container, hasText);
					}
				}
			}, 50);
		});
	}
}

export { MathFieldEditor };