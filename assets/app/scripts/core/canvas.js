const MQ = MathQuill.getInterface(2);

class MathBoard {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.mouse = { x: 0, y: 0 };

    this.canvasState = {
      offset: { x: 0, y: 0 },
      initialOffset: { x: -10000, y: -10000 },
      scale: 1
    };

    this.pan = {
      active: false,
      start: { x: 0, y: 0 },
      spaceDown: false
    };

    this.drag = {
      active: false,
      group: null,
      offset: { x: 0, y: 0 },
      margin: 10,
      gridSize: 20
    };

    this.boxSelect = {
      active: false,
      start: { x: 0, y: 0 },
      element: null,
      justCompleted: false
    };

    this.fileManager = new FileManager(this);
    this.clipboard = new Clipboard(this);
    this.fileManager.loadState();
    this.initEventListeners();
    this.navigation = new Navigation(this);
    this.navigation.init();
  }

  initEventListeners() {
    this.initGlobalKeyHandlers();
    this.initDocumentClickHandler();
    this.initGroupDragging();
    this.initWindowResizeHandler();
    this.initDoubleClickHandler();
  }

  initGlobalKeyHandlers() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.pan.spaceDown = true;
      }

      if (
        (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'x') &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        !document.querySelector('.mq-focused') &&
        !document.activeElement.closest('.text-editor')
      ) {
        const selectedGroups = ObjectGroup.getSelectedGroups();
        if (selectedGroups.length > 0) {
          e.preventDefault();
          selectedGroups.forEach((group) => {
            group.remove();
          });
          // Save updated state
          this.fileManager.saveState();
        }
      }

      
      if (e.ctrlKey || e.metaKey) {
        const isTextEditorFocused = document.activeElement && 
          (document.activeElement.closest('.text-editor') || 
           document.activeElement.classList.contains('text-editor'));
        const isMathFieldFocused = document.querySelector('.mq-focused');
        const isImageUrlInputFocused = document.activeElement && 
          document.activeElement.closest('.image-url-input');
        
        if (!isTextEditorFocused && !isMathFieldFocused && !isImageUrlInputFocused) {
          if (e.key === 'c') {
            e.preventDefault();
            this.clipboard.copySelectedGroups();
          } else if (e.key === 'x') {
            e.preventDefault();
            this.clipboard.cutSelectedGroups();
          } else if (e.key === 'v') {
            e.preventDefault();
            this.clipboard.pasteGroups();
          }
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.pan.spaceDown = false;
      }
    });
  }

  initDocumentClickHandler() {
    document.addEventListener('click', (event) => {
      // If this click was triggered immediately after a box selection, skip clearing the selection.
      if (this.boxSelect.justCompleted) {
        this.boxSelect.justCompleted = false;
        return;
      }

      // if click target inside an editable math field or text editor, handle it there.
      if (event.target.closest('.mq-editable-field') || event.target.closest('.text-editor')) { return; }

      // If clicking on a math-field container that is finalized:
      const mathContainer = event.target.closest('.math-field-container');
      if (mathContainer) {
        ObjectGroup.clearAllSelections();
        event.stopPropagation();
        MathField.edit(mathContainer);
        return;
      }

      // If clicking on a text-field container:
      const textContainer = event.target.closest('.text-field-container');
      if (textContainer) {
        ObjectGroup.clearAllSelections();
        event.stopPropagation();
        const textField = textContainer.textFieldInstance;
        if (textField) {
          textField.focus();
        }
        return;
      }

      // If clicking on an image-container:
      const imageContainer = event.target.closest('.image-container');
      if (imageContainer) {
        // Find the parent image-group and select it
        const imageGroup = imageContainer.closest('.image-group');
        if (imageGroup) {
          if (!event.shiftKey) {
            ObjectGroup.clearAllSelections();
            imageGroup.classList.add('selected');
          } else {
            imageGroup.classList.toggle('selected');
          }
        }
        event.stopPropagation();
        return;
      }

      // Remove container selection if clicking outside
      if (!event.target.closest('.math-field-container') && !event.target.closest('.text-field-container') && !event.target.closest('.image-container')) {
        document.querySelectorAll('.math-field-container.selected-field')
          .forEach(el => el.classList.remove('selected-field'));
      }

      // Handle selection for math, text, and image groups
      const mathGroupTarget = event.target.closest('.math-group');
      const textGroupTarget = event.target.closest('.text-group');
      const imageGroupTarget = event.target.closest('.image-group');
      const groupTarget = mathGroupTarget || textGroupTarget || imageGroupTarget;

      if (groupTarget) {
        if (!event.shiftKey) {
          ObjectGroup.clearAllSelections();
          groupTarget.classList.add('selected');
        } else {
          groupTarget.classList.toggle('selected');
        }
      } else {
        ObjectGroup.clearAllSelections();
      }
    });
  }

  initGroupDragging() {
    document.addEventListener('mousedown', (event) => {
      // Ignore if not left click, if space is down, or if clicking inside an editable field
      if (event.button !== 0 || this.pan.spaceDown || event.target.closest('.mq-editable-field') || event.target.closest('.text-editor')) return;
      
      // Ignore clicks starting on the field drag handle
      if (event.target.closest('.drag-handle')) return;

      let target = event.target;
      while (target && !target.classList.contains('math-group') && !target.classList.contains('text-group') && !target.classList.contains('image-group')) {
        target = target.parentElement;
      }

      if (target && (target.classList.contains('math-group') || target.classList.contains('text-group') || target.classList.contains('image-group'))) {
        let groups;
        if (target.classList.contains('selected')) {
          groups = Array.from(ObjectGroup.getSelectedGroups());
        } else {
          groups = [target];
        }

        this.drag.active = true;
        this.selectedGroups = groups;
        this.dragStart = { x: event.clientX, y: event.clientY };
        this.initialPositions = groups.map((group) => ({
          group: group,
          left: parseInt(group.style.left, 10),
          top: parseInt(group.style.top, 10)
        }));

        groups.forEach((group) => group.classList.add('dragging'));
        event.stopPropagation();
      }

      if (!target) {
        ObjectGroup.clearAllSelections();
      }
    });

    document.addEventListener('mousemove', (event) => {
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;

      if (this.drag.active && this.selectedGroups) {
        const deltaX = event.clientX - this.dragStart.x;
        const deltaY = event.clientY - this.dragStart.y;
        const snapToGrid = event.ctrlKey || event.metaKey; // Check for Ctrl/Cmd key

        this.initialPositions.forEach((item) => {
          let newLeft = item.left + deltaX;
          let newTop = item.top + deltaY;

          if (snapToGrid) {
            const canvasCoords = this.screenToCanvas(item.group.offsetLeft + deltaX, item.group.offsetTop + deltaY);
            const initialCanvasCoords = this.screenToCanvas(item.left, item.top);
            const canvasDeltaX = canvasCoords.x - initialCanvasCoords.x;
            const canvasDeltaY = canvasCoords.y - initialCanvasCoords.y;

            const snappedCanvasX = Math.round((initialCanvasCoords.x + canvasDeltaX) / this.drag.gridSize) * this.drag.gridSize;
            const snappedCanvasY = Math.round((initialCanvasCoords.y + canvasDeltaY) / this.drag.gridSize) * this.drag.gridSize;

            newLeft = Math.round(newLeft / this.drag.gridSize) * this.drag.gridSize;
            newTop = Math.round(newTop / this.drag.gridSize) * this.drag.gridSize;
          }

          item.group.style.left = newLeft + 'px';
          item.group.style.top = newTop + 'px';
        });
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.drag.active && this.selectedGroups) {
        this.selectedGroups.forEach((group) => group.classList.remove('dragging'));
        this.drag.active = false;
        this.selectedGroups = null;
        this.initialPositions = null;
        this.fileManager.saveState();
      }
    });
  }

  initWindowResizeHandler() {
    window.addEventListener('resize', () => {
      this.updateTransform();
    });
  }

  initDoubleClickHandler() {
    document.addEventListener('dblclick', (event) => {
      if (event.target.closest('.math-group') || event.target.closest('.text-group') || event.target.closest('.image-group')) return;
      if (this.pan.active) return;
      const coords = this.screenToCanvas(event.clientX, event.clientY);
      
      if (event.shiftKey) {
        // Shift + double-click creates a text field
        new TextGroup(this, coords.x, coords.y);
      } else {
        // Regular double-click creates a math field
        new MathGroup(this, coords.x, coords.y);
      }
      this.fileManager.saveState();
    });
  }

  updateTransform() {
    this.canvas.style.transform = `translate(${this.canvasState.offset.x}px, ${this.canvasState.offset.y}px)`;
  }

  screenToCanvas(x, y) {
    return {
      x: (x - (this.canvasState.initialOffset.x + this.canvasState.offset.x)) / this.canvasState.scale,
      y: (y - (this.canvasState.initialOffset.y + this.canvasState.offset.y)) / this.canvasState.scale,
    };
  }
}

