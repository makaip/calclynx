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

	static createStaticMathElement() {
		const staticMath = document.createElement('div');
		staticMath.className = 'math-field';
		return staticMath;
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

	static getBaseMathQuillConfig() {
		return {
			spaceBehavesLikeTab: false,
			leftRightIntoCmdGoes: 'up',
			restrictMismatchedBrackets: true,
			sumStartsWithNEquals: true,
			supSubsRequireOperand: true,
			charsThatBreakOutOfSupSub: '=<>',
			autoSubscriptNumerals: false,
			autoCommands: 'pi theta sqrt sum prod alpha beta gamma delta epsilon zeta eta mu nu rho sigma tau phi chi psi omega vec binom int cup cap forall exists mathbf',
			autoOperatorNames: 'sin cos tan sec csc cot sinh cosh tanh log ln exp lim sup det gcd lcm min max arcsin arccos arctan arcsec arccsc arccot',
			maxDepth: 10,
		};
	}

	static getEditMathQuillConfig() {
		return {
			spaceBehavesLikeTab: false,
			handlers: {}
		};
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
		const staticMath = this.createStaticMathElement();
		container.appendChild(staticMath);

		if (MQ) MQ.StaticMath(staticMath).latex(latex);
	}
}


export { MathFieldUtils };
