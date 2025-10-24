import { MQ, mathQuillConfig } from './mathfield-mqconfig.js';

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
            this.switchToEditMode();
        });
    }

    render() {
        if (this.mqInstance) {
            this.mqInstance.el().remove();
            this.mqInstance = null;
        }

        const mathFieldElement = MathFieldUtils.createMathFieldElement();
        MathFieldUtils.insertElementAfterHandle(this.element, mathFieldElement);

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

    switchToEditMode() {
        if (this.state === 'editing') return;

        this.parentGroup.fields.forEach(field => {
            if (field !== this) field.switchToStaticMode();
        });

        this.state = 'editing';
        this.render();
    }

    switchToStaticMode() {
        if (this.state === 'static') return;
        if (this.mqInstance) this.latex = this.mqInstance.latex().trim();

        if (MathFieldUtils.isEmpty(this.latex)) {
            this.parentGroup.deleteField(this);
            return;
        }

        this.state = 'static';
        this.element.dataset.latex = this.latex;
        this.render();

        this.parentGroup.board.fileManager.saveState();
    }

    getMathQuillConfig() {
        const self = this;

        return {
            ...mathQuillConfigBase,
            handlers: {
                edit: (mq) => {
                    self.latex = mq.latex();
                },
                enter: (mq) => {
                    self.switchToStaticMode();

                    const myPosition = self.parentGroup.getFieldPosition(self);
                    self.parentGroup.insertField(myPosition + 1, '', true); // true = isNewField
                },
                upOutOf: (mq) => {
                    const fieldAbove = self.parentGroup.getFieldAbove(self);
                    if (fieldAbove) {
                        fieldAbove.switchToEditMode();
                        // TODO: manage cursor position
                    }
                },
                downOutOf: (mq) => {
                    const fieldBelow = self.parentGroup.getFieldBelow(self);
                    if (fieldBelow) {
                        fieldBelow.switchToEditMode();
                        // TODO: manage cursor position
                    }
                },
                deleteOutOf: (mq, dir) => {
                    if (dir === 'left') {
                        const fieldAbove = self.parentGroup.getFieldAbove(self);
                        self.parentGroup.deleteField(self);
                        if (fieldAbove) {
                            fieldAbove.switchToEditMode();
                            // TODO: move cursor to end
                        }
                    }
                },
                blur: (mq) => {
                    setTimeout(() => {
                        if (!self.parentGroup.element.contains(document.activeElement)) {
                            self.switchToStaticMode();
                        }
                    }, 100);
                }
            }
        };
    }

    getLatex() {
        return this.latex;
    }

    setLatex(latex) {
        this.latex = latex;
        this.element.dataset.latex = latex;
        this.render();
    }


    destroy() {
        if (this.mqInstance) {
            this.mqInstance.el().remove();
            this.mqInstance = null;
        }
        this.element.remove();
    }
}

export class MathGroupDragHandler {
    constructor(mathGroup) {
        this.mathGroup = mathGroup;
        this.isDragging = false;
        this.dragStartData = null;
    }

}