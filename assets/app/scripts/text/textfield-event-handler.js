class TextFieldProseMirrorEventHandler {
	constructor(proseMirrorView) {
		this.proseMirrorView = proseMirrorView;
	}

	handleKeyDown(view, event) {
		if (event.key === 'ArrowLeft') {
			const { $from } = view.state.selection;
			const beforeNode = $from.nodeBefore;

			if (beforeNode && beforeNode.type.name === 'math') {
				event.preventDefault();
				this.blurAllMathFields(view);

				const targetPos = $from.pos - 1;
				const mathField = this.findMathFieldForNode(view, beforeNode, targetPos);

				if (mathField && mathField.mathquillObject) {
					setTimeout(() => {
						mathField.mathquillObject.focus();
						mathField.mathquillObject.moveToRightEnd();
					}, 0);
					return true;
				}
			}
		} else if (event.key === 'ArrowRight') {
			const { $from } = view.state.selection;
			const afterNode = $from.nodeAfter;

			if (afterNode && afterNode.type.name === 'math') {
				event.preventDefault();
				this.blurAllMathFields(view);

				const mathField = this.findMathFieldForNode(view, afterNode, $from.pos);

				if (mathField && mathField.mathquillObject) {
					setTimeout(() => {
						mathField.mathquillObject.focus();
						mathField.mathquillObject.moveToLeftEnd();
					}, 0);
					return true;
				}
			}
		} else if (event.key === 'Backspace') {
			return this.handleBackspace(view, event);
		} else if (event.key === 'Delete') {
			return this.handleDelete(view, event);
		}

		return false;
	}

	handleBackspace(view, event) {
		const { $from } = view.state.selection;
		const beforeNode = $from.nodeBefore;

		if (beforeNode && beforeNode.type.name === 'math' && view.state.selection.empty) {
			event.preventDefault();
			// Find the MQ field by position
			const targetPos = $from.pos - 1;
			const mathField = this.findMathFieldAtPosition(view, targetPos);

			if (mathField && mathField.mathquillObject) {
				const currentLatex = mathField.mathquillObject.latex();
				if (currentLatex.length > 0) {
					// Focus the math field and let MathQuill handle the backspace
					mathField.mathquillObject.focus();
					mathField.mathquillObject.keystroke('Backspace');
				} else {
					// if MQ empty, delete entire node
					const pos = $from.pos - 1;
					const tr = view.state.tr.delete(pos, pos + 1);
					view.dispatch(tr);
				}
				return true;
			}
		}
		return false;
	}

	handleDelete(view, event) {
		const { $from } = view.state.selection;
		const afterNode = $from.nodeAfter;

		if (afterNode && afterNode.type.name === 'math' && view.state.selection.empty) {
			event.preventDefault();
			// Find the MQ field by position
			const targetPos = $from.pos;
			const mathField = this.findMathFieldAtPosition(view, targetPos);

			if (mathField && mathField.mathquillObject) {
				const currentLatex = mathField.mathquillObject.latex();
				if (currentLatex.length > 0) {
					// Focus the math field and let MathQuill handle the delete
					mathField.mathquillObject.focus();
					mathField.mathquillObject.keystroke('Del');
				} else {
					// if MQ empty, delete entire node
					const pos = $from.pos;
					const tr = view.state.tr.delete(pos, pos + 1);
					view.dispatch(tr);
				}
				return true;
			}
		}
		return false;
	}

	blurAllMathFields(view) {
		const mathElements = view.dom.querySelectorAll('.mathquill');
		mathElements.forEach(element => {
			if (element.mathquillObject) {
				element.mathquillObject.blur();
			}
		});
	}

	findMathFieldForNode(view, node, pos) {
		const latex = node.attrs.latex;

		try {
			const domNode = view.nodeDOM(pos);
			if (domNode && domNode.classList && domNode.classList.contains('mathquill')) {
				return domNode;
			}
		} catch {
			// nodeDOM might fail, continue with other approaches
		}

		try {
			const domPos = view.domAtPos(pos);
			let element = domPos.node;

			if (element.nodeType === Node.TEXT_NODE) {
				element = element.parentElement;
			}

			const mathField = element.querySelector ? element.querySelector('.mathquill') : null;
			if (mathField && mathField.mathquillObject) {
				return mathField;
			}

			let sibling = element.nextElementSibling;
			while (sibling) {
				if (sibling.classList && sibling.classList.contains('mathquill')) {
					return sibling;
				}
				const childMathField = sibling.querySelector ? sibling.querySelector('.mathquill') : null;
				if (childMathField) {
					return childMathField;
				}
				sibling = sibling.nextElementSibling;
			}
		} catch {
			// Continue with fallback approach
		}

		// Fallback: search all math fields and find best match by latex content
		const mathFields = view.dom.querySelectorAll('.mathquill');
		let bestMatch = null;
		let bestDistance = Infinity;

		for (const field of mathFields) {
			if (field.mathquillObject) {
				if (field.mathquillObject.latex() === latex) {
					// Try to determine which field is closest to the target position
					try {
						const fieldRect = field.getBoundingClientRect();
						const viewRect = view.dom.getBoundingClientRect();
						const distance = Math.abs(fieldRect.left - viewRect.left);

						if (distance < bestDistance) {
							bestDistance = distance;
							bestMatch = field;
						}
					} catch {
						// If we can't determine position, just use this field if latex matches
						if (!bestMatch) {
							bestMatch = field;
						}
					}
				}
			}
		}

		return bestMatch;
	}


	// todo: fix this i frogot why
	findMathFieldAtPosition(view, pos) {
		try {
			const node = view.state.doc.nodeAt(pos);

			if (node && node.type.name === 'math') {
				try {
					const domNode = view.nodeDOM(pos);
					if (domNode && domNode.classList && domNode.classList.contains('mathquill')) {
						return domNode;
					}
				} catch {
					// nodeDOM might fail, continue with other approaches
				}

				const domPos = view.domAtPos(pos);
				let currentElement = domPos.node;

				if (currentElement.nodeType === Node.TEXT_NODE) currentElement = currentElement.parentElement;

				let searchDepth = 0;
				while (currentElement && currentElement !== view.dom && searchDepth < 10) {
					if (currentElement.classList && currentElement.classList.contains('mathquill')) return currentElement;
					const mathChild = currentElement.querySelector && currentElement.querySelector('.mathquill');
					if (mathChild) return mathChild;

					if (currentElement.nextElementSibling) {
						const siblingMath = currentElement.nextElementSibling.querySelector &&
							currentElement.nextElementSibling.querySelector('.mathquill');
						if (siblingMath) return siblingMath;
					}

					currentElement = currentElement.parentElement;
					searchDepth++;
				}
			}

			// Final fallback: search all math elements and try to match by position
			const mathElements = view.dom.querySelectorAll('.mathquill');
			for (const element of mathElements) {
				if (element.mathquillObject) {
					// This is a very basic position matching - could be improved
					try {
						const elementPos = view.posAtDOM(element, 0);
						if (Math.abs(elementPos - pos) <= 1) {
							return element;
						}
					} catch {
						// Continue searching
					}
				}
			}

		} catch (error) {
			console.warn('Error finding math field at position:', error);
		}

		return null;
	}
}

export { TextFieldProseMirrorEventHandler };