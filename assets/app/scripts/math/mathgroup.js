import { MathField } from './mathfield.js';
import { MathGroupDragHandler } from './mathfield-handle.js';

export class MathGroup {
    constructor(board, x, y, data = null) {
        this.board = board;
        this.mathFields = [];
        this.element = null;
        this.x = x;
        this.y = y;

        this.element = document.createElement('div');
        this.element.className = 'math-group';
        this.element.mathGroup = this;

        this.element.style.position = 'absolute';
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;

        if (this.board && this.board.element) this.board.element.appendChild(this.element);
        this.dragHandler = new MathGroupDragHandler(this);

        this.attachEventListeners();

        if (data && data.fields && data.fields.length > 0) {
            data.fields.forEach(latex => {
                this.insertField(this.mathFields.length, latex, false);
            });
        } else {
            this.insertField(0, '', true);
        }
    }

    attachEventListeners() {
        this.element.addEventListener('focusout', () => {
            setTimeout(() => {
                if (!this.element.contains(document.activeElement)) {
                    this.mathFields.forEach(field => {
                        if (field.state === 'editing') {
                            field.switchToStaticMode();
                        }
                    });
                }
            }, 50);
        });

        this.element.addEventListener('mousedown', (e) => {
            const handle = e.target.closest('.drag-handle');
            const fieldContainer = e.target.closest('.math-field-container');

            if (handle && fieldContainer && this.element.contains(handle)) {
                this.dragHandler.handleFieldDragStart(e, fieldContainer);
            }
        }, true);
    }

    insertField(position, latex = '', isNewField = false) {
        const newField = new MathField(this, latex);
        this.mathFields.splice(position, 0, newField);

        const nextField = this.mathFields[position + 1];

        if (nextField && nextField.element) {
            this.element.insertBefore(newField.element, nextField.element);
        } else {
            this.element.appendChild(newField.element);
        }

        isNewField ? newField.toEditMode() : newField.render();
        return newField;
    }

    deleteField(field) {
        const index = this.mathFields.indexOf(field);
        if (index === -1) return;

        this.mathFields.splice(index, 1);

        field.destroy();

        if (this.mathFields.length === 0) {
            this.destroy();
        } else {
            this.board.fileManager.saveState();
        }
    }


    reorderField(oldPosition, newPosition) {
        if (oldPosition < 0 || oldPosition >= this.mathFields.length) return;
        if (newPosition < 0 || newPosition >= this.mathFields.length) return;

        const [field] = this.mathFields.splice(oldPosition, 1);
        this.mathFields.splice(newPosition, 0, field);

        const nextField = this.mathFields[newPosition + 1];
        if (nextField && nextField.element) {
            this.element.insertBefore(field.element, nextField.element);
        } else {
            this.element.appendChild(field.element);
        }

        this.board.fileManager.saveState();
    }

    updateFieldOrderFromDOM() {
        const orderedContainers = Array.from(
            this.element.querySelectorAll('.math-field-container')
        );

        this.mathFields = orderedContainers
            .map(container => container.mathFieldInstance)
            .filter(instance => instance);
    }

    serialize() {
        return {
            type: 'math',
            x: this.x,
            y: this.y,
            fields: this.mathFields.map(field => field.getLatex())
        };
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    destroy() {
        this.mathFields.forEach(field => field.destroy());
        this.mathFields = [];

        if (this.element && this.element.parentNode) this.element.remove();

        this.element = null;
        this.board = null;
    }

    remove() {
        this.destroy();
    }
}
