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
    constructor() {
        this.fields = [];
        
        //setup event listener
        document.addEventListener('mathFieldEvent', (event) => this.handleEvents(event));
    }

    handleEvents(event) {
        // handle events for the math fields
    }

    insertField(position) {
        const newField = new MathField();
        this.fields.splice(position, 0, newField);
    }

    deleteField(position) {
        this.fields.splice(position, 1);
    }

    reorderField(oldPosition, newPosition) {
        const field = this.fields[oldPosition];
        this.fields.splice(oldPosition, 1);
        this.fields.splice(newPosition, 0, field);
    }
}

class MathField {
    constructor() {
        this.latex = '';
        this.isFocused = true; // todo, account for isFocused = false on page load
        this.elementId = `mathfield-${Math.random().toString(36).substr(2, 9)}`;
        this.element = document.getElementById(this.elementId);


        this.mathQuillConfig = {
			handlers: {
				edit: () => {
					this.latex = this.element.latex;
				},
                enter: () => {
                    this.latex = this.element.latex;

                },
                upOutOf: function(dir) {
                    // handle moving out of the math field
                },
                downOutOf: function(dir) {
                    // handle moving out of the math field
                },
                deleteOutOf: function(dir, mathField) {
                    // handle deleting out of the math field
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
        return this.latex;
    }

    setLatex(latex) {
        this.latex = latex;
    }

    focus() {
        this.element.focus();
    }

    blur() {
        this.element.blur();
    }

    getAbove() {
        return this.element.previousElementSibling;
    }

    getBelow() {
        return this.element.nextElementSibling;
    }
}