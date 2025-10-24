export class MathGroupDragHandler {
    constructor(mathGroup) {
        this.mathGroup = mathGroup;
        this.isDragging = false;
        this.dragStartData = null;
    }

    handleFieldDragStart(e, fieldContainer) {
        // create div 'drop-placeholder'
        // bind handle drag move and drag end to document
        // add event listeners to document
    }

    handleFieldDragMove(e) {
        // set dragged field position
        // determine new placeholder position and update
    }

    handleFieldDragEnd() {
        // remove event listeners from document
        // insert dragged field at placeholder position
        // remove placeholder
        // reset styles on dragged field
        // call updateinstanceorder
    }

    updateInstanceOrder() {
        const orderedContainers = Array.from(this.element.querySelectorAll('.math-field-container'));
        this.mathFieldInstances = orderedContainers
            .map(container => container.mathFieldInstance)
            .filter(instance => instance);
    }

    setDraggedFieldStyles(isDragging) {
        const el = this.draggedFieldElement;

        if (isDragging) {
            el.classList.add('dragging-field');
            Object.assign(el.style, {
                position: 'absolute',
                top: `${this.fieldDragInitialTop}px`,
                left: '0',
                width: 'calc(100% - 20px)'
            });
        } else {
            el.classList.remove('dragging-field');
            Object.assign(el.style, {
                position: '',
                top: '',
                left: '',
                width: ''
            });
        }
    }
}