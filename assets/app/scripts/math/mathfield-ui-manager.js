class MathFieldUIManager {
	constructor(mathField) {
		this.mathField = mathField;
		this.container = mathField.container;
		this.mathGroup = mathField.mathGroup;
		this.editor = mathField.editor;
	}

	static clearMathGroupSelections() {
		document.querySelectorAll('.math-group')
			.forEach((group) => group.classList.remove('selected'));
	}

	static clearSelectedFields() {
		document.querySelectorAll('.math-field-container.selected-field')
			.forEach(el => el.classList.remove('selected-field'));
	}

	static markContainerAsSelected(container) {
		MathFieldUIManager.clearSelectedFields();
		container.classList.add('selected-field');
	}

	static highlightGroupExpressions(container) {
		if (window.expressionEquivalence && container.dataset.groupKey) {
			window.expressionEquivalence.highlightGroupExpressions(container.dataset.groupKey, true);
		}
	}

	static processEquivalenceColors(container, hasText) {
		if (window.expressionEquivalence && !hasText) {
			window.expressionEquivalence.applyIndicatorColors();
			if (container.dataset.groupKey) {
				window.expressionEquivalence.highlightGroupExpressions(container.dataset.groupKey, false);
			} else {
				window.expressionEquivalence.removeAllHighlights();
			}
		}
	}

	static canNavigateToPrevious(container, groupElement) {
		return groupElement.children.length > 1 && container !== groupElement.firstElementChild;
	}

	static isCurrentlyEditing(container) {
		return !!container.querySelector(':scope > .mq-editable-field');
	}

	static canEdit(container) {
		return !container.querySelector('.mq-editable-field');
	}

	static isDragHandleClicked(event) {
		return event.target.closest('.drag-handle');
	}
}

export { MathFieldUIManager };