import { MQ, mathQuillConfig } from './mathfield-mqconfig.js';

export class MathGroup {
    constructor(board, x, y, data = null) {
        super(board, x, y, data, 'math');

        this.mathFields = [];
        this.element = null;

        // TODO: create the DOM element for this group
        this.element = document.createElement('div');
        this.element.className = 'math-group';
        this.board.element.appendChild(this.element);
        // set position x, y

        // TODO: add group-level event listeners
        // old system has drag listeners for the fields inside it- logic lives here or gets delegated?

        if (data && data.fields) {
            data.fields.forEach(latex => {
                this.insertField(this.fields.length, latex, false);
            });
        } else {
            this.insertField(0, '', true);
        }
    }

    insertField(position, latex = '', isNewField = false) {
        const newField = new MathField(this, latex);
        this.fields.splice(position, 0, newField);
        newField.render();
        const nextField = this.fields[position + 1];

        nextField ? this.element.insertBefore(newField.element, nextField.element) : this.element.appendChild(newField.element);
        isNewField ? newField.switchToEditMode() : newField.switchToStaticMode();
    }

    deleteField(position) {
        this.mathFields.splice(position, 1);
    }

    reorderField(oldPosition, newPosition) {
        const field = this.mathFields[oldPosition];
        this.mathFields.splice(oldPosition, 1);
        this.mathFields.splice(newPosition, 0, field);
    }

    getFieldPosition(field) {
        return this.mathFields.indexOf(field);
    }

    destroy() {
        this.mathFields.forEach(field => field.destroy());
        this.element.remove();
        super.remove();
    }
}
