import { MQ, mathQuillConfig, mathQuillEditConfig } from './mathfield-mqconfig.js';

export class MathField {
    constructor(parentGroup, initialLatex = '') {
        this.parentGroup = parentGroup;
        this.latex = initialLatex;
        this.element = null; // <div class="math-field-container">
        this.state = 'static';
        this.mqInstance = null; // hold StaticMath or MathField instance


        this.elementId = `mathfield-${Math.random().toString(36).substr(2, 9)}`;

        // constructor should create DOM element but not render the MQ instance
        // ref mathfield-container.js
        this.element = document.createElement('div');
        this.element.className = 'math-field-container';
        this.element.dataset.latex = this.latex;
        this.element.mathFieldInstance = this;

        // // create drag handle, circle indicator, etc.
        // const dragHandle = ...
        // this.element.appendChild(dragHandle);

        this.element.addEventListener('click', (e) => {
            if (e.target.closest('.drag-handle')) return;
            this.toEditMode();
        });
    }

    render() {
        if (this.mqInstance) {
            this.mqInstance.el().remove();
            this.mqInstance = null;
        }

        const mathFieldElement = this.createMathFieldElement();
        const handle = this.element.querySelector(':scope > .drag-handle');
        if (handle) {
            this.element.insertBefore(mathFieldElement, handle.nextSibling);
        } else {
            this.element.appendChild(mathFieldElement);
        }

        if (this.state === 'editing') {
            const config = this.getMathQuillConfig();
            this.mqInstance = MQ.MathField(mathFieldElement, config);
            this.mqInstance.latex(this.latex);
            this.mqInstance.focus();
        } else {
            this.mqInstance = MQ.StaticMath(mathFieldElement);
            this.mqInstance.latex(this.latex || '\\placeholder');
        }
    }

    toEditMode() {
        if (this.state === 'editing') return;

        this.parentGroup.mathFields.forEach(field => {
            if (field !== this) field.switchToStaticMode();
        });

        this.state = 'editing';
        this.render();
    }

    toStaticMode() {
        if (this.state === 'static') return;
        if (this.mqInstance) this.latex = this.mqInstance.latex().trim();

        if (this.latex === '' || this.latex === '\\placeholder') { //need to abstract ts check
            this.parentGroup.deleteField(this);
            return;
        }

        this.state = 'static';
        this.element.dataset.latex = this.latex;
        this.render();

        this.parentGroup.board.fileManager.saveState();
    }

    getFieldPosition(field) {
        return this.parentGroup.mathFields.indexOf(field);
    }

    getFieldAbove(field) {
        const index = this.getFieldPosition(field);
        return index > 0 ? this.parentGroup.mathFields[index - 1] : null;
    }

    getFieldBelow(field) {
        const index = this.getFieldPosition(field);
        return index < this.parentGroup.mathFields.length - 1 ? this.parentGroup.mathFields[index + 1] : null;
    }

    setLatex(latex) {
        this.latex = latex;
        this.element.dataset.latex = latex;
        this.render();
    }

    createMathFieldElement() {
        const mathFieldElement = document.createElement('div');
        mathFieldElement.className = 'math-field';
        return mathFieldElement;
    }

    destroy() {
        if (this.mqInstance) {
            this.mqInstance.el().remove();
            this.mqInstance = null;
        }

        this.element.remove();
    }

    getMathQuillConfig() {
        const self = this;

        return {
            ...mathQuillConfig,
            ...mathQuillEditConfig
        };
    }
}

export class MathGroupDragHandler {
    constructor(mathGroup) {
        this.mathGroup = mathGroup;
        this.isDragging = false;
        this.dragStartData = null;
    }

}