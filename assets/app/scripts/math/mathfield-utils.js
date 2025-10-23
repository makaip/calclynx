const MQ = window.MathQuill ? window.MathQuill.getInterface(2) : null;


class MathFieldUtils {
	static createCircleIndicator() {
		const circleIndicator = document.createElement('div');
		circleIndicator.className = 'circle-indicator';
		return circleIndicator;
	}

	static createDragHandle() {
		const dragHandle = document.createElement('div');
		dragHandle.className = 'drag-handle';

		for (let i = 0; i < 6; i++) {
			const dot = document.createElement('span');
			dot.className = 'drag-handle-dot';
			dragHandle.appendChild(dot);
		}

		return dragHandle;
	}

	static createMathFieldElement() {
		const mathFieldElement = document.createElement('div');
		mathFieldElement.className = 'math-field';
		return mathFieldElement;
	}

	static recreateContainerStructure(container) {
		container.innerHTML = '';

		const circleIndicator = this.createCircleIndicator();
		container.appendChild(circleIndicator);

		const dragHandle = this.createDragHandle();
		container.appendChild(dragHandle);

		return { circleIndicator, dragHandle };
	}

	static insertElementAfterHandle(container, element) {
		const handle = container.querySelector(':scope > .drag-handle');
		if (handle) {
			container.insertBefore(element, handle.nextSibling);
		} else {
			container.appendChild(element);
		}
	}

	static isEmpty(latexContent) {
		return latexContent === "" || latexContent === "\\placeholder";
	}

	static hasTextContent(latex) {
		return latex.includes('\\text{') || latex.includes('\\\\text{');
	}

	static isDragHandleClicked(event) {
		return event.target.closest('.drag-handle');
	}

	static validateMathGroupElement(mathGroup) {
		if (!mathGroup?.element) {
			throw new Error('MathGroup element is required');
		}
	}

	static canEdit(container) {
		return !container.querySelector('.mq-editable-field');
	}

	static recreateStaticContainer(container, latex) {
		this.recreateContainerStructure(container);
		const staticMath = this.createMathFieldElement();
		container.appendChild(staticMath);

		if (MQ) MQ.StaticMath(staticMath).latex(latex);
	}
}


export { MathFieldUtils };
