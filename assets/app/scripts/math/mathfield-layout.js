const MQ = window.MathQuill ? window.MathQuill.getInterface(2) : null;

mathQuillConfig = {
    spaceBehavesLikeTab: false,
    leftRightIntoCmdGoes: 'up',
    restrictMismatchedBrackets: true,
    sumStartsWithNEquals: true,
    supSubsRequireOperand: true,
    charsThatBreakOutOfSupSub: '=<>',
    autoSubscriptNumerals: false,
    autoCommands: 'pi theta sqrt sum prod alpha beta gamma delta epsilon zeta eta mu nu xi rho sigma tau phi chi psi omega',
    autoOperatorNames: 'sin cos tan sec csc cot sinh cosh tanh log ln exp lim sup inf det gcd lcm min max',
    maxDepth: 10
};

class MathGroup {
    constructor(board, x, y, data = null) {
        super(board, x, y, data, 'math');

        this.mathFields = [];
        this.element = null;
        
        
        //setup event listener
        document.addEventListener('mathFieldEvent', (event) => this.handleEvents(event));
    }

    handleEvents(event) {
        // handle events for the math fields
    }

    insertField(position) {
        const newField = new MathField(this);

		if (refIndex !== -1) {
			this.mathFields.splice(position + 1, 0, newField);
		} else {
			this.mathFields.push(newField);
		}

		const mathField = newField.editor.mathField;
		if (mathField && typeof mathField.focus === 'function') mathField.focus();

		return newField;
    }

    deleteField(position) {
        this.mathFields.splice(position, 1);
    }

    reorderField(oldPosition, newPosition) {
        const field = this.mathFields[oldPosition];
        this.mathFields.splice(oldPosition, 1);
        this.mathFields.splice(newPosition, 0, field);
    }

    destroy() {
        this.mathFields.forEach(field => field.destroy());
        this.element.remove();
        super.remove();
    }
}

class MathField {
    constructor(board, x, y, data = null) {
        this.latex = '';
        // TODO: account for isFocused = false on page load
        this.isFocused = true; 
        this.elementId = `mathfield-${Math.random().toString(36).substr(2, 9)}`;
        this.element = null;


        this.mathQuillConfig = {
			handlers: {
				edit: () => {
					this.latex = this.element.latex;

				},
                enter: () => {
                    this.latex = this.element.latex;
                    
                    // get item position number in stack
                    const array = Array.from(this.element.parentElement.children);
                    const position = array.indexOf(this.element);
                    this.element.parentElement.insertField(position + 1);
                },
                upOutOf: function(dir) {
                    // handle moving out of the math field
                    above = this.getAbove();
                    if (above) above.focus();
                    this.blur();

                },
                downOutOf: function(dir) {
                    // handle moving out of the math field
                    below = this.getBelow();
                    if (below) below.focus();
                    this.blur();
                },
                deleteOutOf: function(dir, mathField) {
                    // handle deleting out of the math field
                    if (dir === 'left') {
                        const above = this.getAbove();
                        if (above) above.focus();
                        this.blur();
                        this.destroy();
                    }
                },
                edit: function() {
                    this.latex = this.element.latex;
                }
			}
		};
    }

    finalizeSelf() {
        
    }

    getLatex() {
        return this.mqField ? this.mqField.latex() : this.latex;
    }

    setLatex(latex) {
        this.latex = latex;
    }

    focus() {
        this.isFocused = true;
        if (this.element) this.element.focus();
    }

    blur() {
        this.isFocused = false;
        if (this.element) this.element.blur();
    }

    getAbove() {
        return this.element.previousElementSibling;
    }

    getBelow() {
        return this.element.nextElementSibling;
    }

    destroy() {
        this.element.remove();
    }
}

class MathGroupDragHandler {
    constructor(mathGroup) {
        this.mathGroup = mathGroup;
        this.isDragging = false;
        this.dragStartData = null;
    }

}