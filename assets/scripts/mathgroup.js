class MathGroup {
  // Now accepts an optional "data" parameter.
  constructor(board, x, y, data = null) {
    this.board = board;
    this.element = document.createElement('div');
    this.element.className = 'math-group';
    // Append "px" when there's no saved state.
    const left = data ? data.left : `${x}px`;
    const top = data ? data.top : `${y}px`;
    this.element.style.left = left;
    this.element.style.top = top;
    this.element.tabIndex = -1; // Make focusable.
    this.element.mathGroup = this; // Link DOM element back to instance
    board.canvas.appendChild(this.element);
    this.attachFocusOutHandler();
    this.mathFieldInstances = []; // Keep track of instances

    // --- Drag and Drop State (moved to group level) ---
    this.draggedFieldElement = null;
    this.fieldPlaceholder = null;
    this.fieldDragStartY = 0;
    this.fieldDragInitialTop = 0;
    // ---

    if (data && data.fields && data.fields.length) {
      // Recreate finalized math fields from saved data.
      data.fields.forEach((latex) => {
        // Create a MathField instance, but don't make it editable initially
        const mathFieldInstance = new MathField(this, false); 
        mathFieldInstance.container.dataset.latex = latex;

        // Render static math (MathField constructor doesn't do this for non-new fields)
        const staticMath = document.createElement('div');
        staticMath.className = 'math-field';
        // Ensure handle is first
        const handle = mathFieldInstance.container.querySelector(':scope > .drag-handle');
        mathFieldInstance.container.insertBefore(staticMath, handle.nextSibling);
        MQ.StaticMath(staticMath).latex(latex);
        
        this.mathFieldInstances.push(mathFieldInstance); // Store instance
      });
    } else {
      // If no data, create the first editable field
      this.addMathField(true); 
    }

    // Attach delegated listener for field dragging
    this.attachFieldDragListener();
  }

  attachFocusOutHandler() {
    this.element.addEventListener('focusout', () => {
      setTimeout(() => {
        if (!this.element.contains(document.activeElement)) {
          if (this.element.children.length === 1) {
            const container = this.element.children[0];
            if (!container.dataset.latex || container.dataset.latex.trim() === '') {
              this.remove();
            }
          }
        }
      }, 50);
    });
  }

  addMathField(isNewField) {
    const newFieldInstance = new MathField(this, isNewField);
    this.mathFieldInstances.push(newFieldInstance); // Store instance
    // No return needed, constructor handles appending
  }

  remove() {
    // Clean up listeners if necessary (though JS garbage collection should handle it)
    this.element.remove();
    // Use version manager if available
    if (window.versionManager) window.versionManager.saveState();
    else this.board.fileManager.saveState();
  }

  insertMathFieldAfter(referenceContainer) {
    const newFieldInstance = new MathField(this, true); // Create new editable field
    const refIndex = this.mathFieldInstances.findIndex(mf => mf.container === referenceContainer);
    
    // Insert into DOM
    this.element.insertBefore(newFieldInstance.container, referenceContainer.nextSibling);
    
    // Insert into instance array
    if (refIndex !== -1) {
        this.mathFieldInstances.splice(refIndex + 1, 0, newFieldInstance);
    } else {
        this.mathFieldInstances.push(newFieldInstance); // Fallback: add to end
    }

    newFieldInstance.mathField.focus();
    // State saved by finalize/blur of the new field
    
    return newFieldInstance; // <<< Return the new instance
  }

  // --- Field Drag and Drop Logic (Delegated) ---

  attachFieldDragListener() {
      this.element.addEventListener('mousedown', (e) => {
          // Check if the click originated on a drag handle within this group
          const handle = e.target.closest('.drag-handle');
          if (handle && this.element.contains(handle)) {
              const fieldContainer = handle.closest('.math-field-container');
              if (fieldContainer) {
                  this.handleFieldDragStart(e, fieldContainer);
              }
          }
      }, true); // Use capture phase for delegation as well
  }

  handleFieldDragStart(e, fieldContainer) {
      // Only handle left clicks
      if (e.button !== 0) return;
      
      // Prevent default browser behavior (like text selection drag) FIRST
      e.preventDefault(); 
      // Stop propagation to prevent group drag and other listeners
      e.stopPropagation(); 

      this.draggedFieldElement = fieldContainer;
      this.fieldDragStartY = e.clientY;
      this.fieldDragInitialTop = this.draggedFieldElement.offsetTop; 

      // Create placeholder
      this.fieldPlaceholder = document.createElement('div');
      this.fieldPlaceholder.className = 'drop-placeholder';
      this.fieldPlaceholder.style.height = `${this.draggedFieldElement.offsetHeight}px`; 

      // Apply dragging styles and position absolutely
      this.draggedFieldElement.classList.add('dragging-field');
      this.draggedFieldElement.style.position = 'absolute'; 
      this.draggedFieldElement.style.top = `${this.fieldDragInitialTop}px`; 
      this.draggedFieldElement.style.left = '0'; 
      this.draggedFieldElement.style.width = 'calc(100% - 20px)'; 
      
      // Insert placeholder
      this.draggedFieldElement.parentElement.insertBefore(this.fieldPlaceholder, this.draggedFieldElement); 

      // Bind move and end handlers to the document *temporarily*
      // Use bind to ensure 'this' refers to the MathGroup instance
      this.boundHandleFieldDragMove = this.handleFieldDragMove.bind(this);
      this.boundHandleFieldDragEnd = this.handleFieldDragEnd.bind(this);

      document.addEventListener('mousemove', this.boundHandleFieldDragMove);
      document.addEventListener('mouseup', this.boundHandleFieldDragEnd, { once: true });
  }

  handleFieldDragMove(e) {
      if (!this.draggedFieldElement) return;

      const currentY = e.clientY;
      const deltaY = currentY - this.fieldDragStartY;
      
      // Update visual position
      this.draggedFieldElement.style.top = `${this.fieldDragInitialTop + deltaY}px`;

      // Determine placeholder position
      const parent = this.fieldPlaceholder.parentElement;
      const siblings = Array.from(parent.children).filter(child =>
          child !== this.draggedFieldElement && child.classList.contains('math-field-container')
      );

      let nextSibling = null; 
      const draggedRect = this.draggedFieldElement.getBoundingClientRect();
      const draggedMidpoint = draggedRect.top + draggedRect.height / 2;

      for (const sibling of siblings) {
          if (sibling === this.fieldPlaceholder) continue; 
          const rect = sibling.getBoundingClientRect();
          const siblingMidpoint = rect.top + rect.height / 2;
          if (draggedMidpoint > siblingMidpoint) {
              nextSibling = sibling.nextElementSibling; 
          } else {
              nextSibling = sibling;
              break; 
          }
      }
      parent.insertBefore(this.fieldPlaceholder, nextSibling); 
  }

  handleFieldDragEnd() {
      if (!this.draggedFieldElement || !this.fieldPlaceholder) return;

      // Move the actual element
      this.fieldPlaceholder.parentElement.insertBefore(this.draggedFieldElement, this.fieldPlaceholder);

      // Clean up styles
      this.draggedFieldElement.classList.remove('dragging-field');
      this.draggedFieldElement.style.position = ''; 
      this.draggedFieldElement.style.top = '';
      this.draggedFieldElement.style.left = '';
      this.draggedFieldElement.style.width = '';

      // Remove placeholder
      this.fieldPlaceholder.remove();

      // Reset state
      this.draggedFieldElement = null;
      this.fieldPlaceholder = null;

      // Remove temporary document listeners
      document.removeEventListener('mousemove', this.boundHandleFieldDragMove);
      // mouseup listener removed by { once: true }

      // Update the internal order of mathFieldInstances (optional but good practice)
      this.updateInstanceOrder(); 

      // Save the new order
      if (window.versionManager) {
          window.versionManager.saveState();
      } else {
          this.board.fileManager.saveState();
      }
  }

  updateInstanceOrder() {
      const orderedContainers = Array.from(this.element.querySelectorAll('.math-field-container'));
      this.mathFieldInstances = orderedContainers
          .map(container => container.mathFieldInstance)
          .filter(instance => instance); // Filter out any undefined if linking failed
  }

  // --- End Field Drag and Drop ---
}

