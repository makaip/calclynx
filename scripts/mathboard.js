const MQ = MathQuill.getInterface(2);

class MathBoard {
  constructor() {
    // Canvas and panning properties.
    this.canvas = document.getElementById('canvas');
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.canvasOffset = { x: 0, y: 0 };
    this.spaceDown = false;
    this.scale = 1;
    this.canvasInitialOffset = { x: -10000, y: -10000 };

    // Variables for group dragging.
    this.groupDragging = false;
    this.draggedGroup = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.margin = 10;

    // Box select properties
    this.isBoxSelecting = false;
    this.boxSelectStart = { x: 0, y: 0 };
    this.selectionBox = null;

    this.initEventListeners();
  }

  initEventListeners() {
    this.initGlobalKeyHandlers();
    this.initCanvasPanning();
    this.initDocumentClickHandler();
    this.initGroupDragging();
    this.initWindowResizeHandler();
    this.initDoubleClickHandler();
    this.initBoxSelection();
  }

  initGlobalKeyHandlers() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.spaceDown = true;
      }
      // Delete all selected math groups when Backspace, Delete, or "x" is pressed.
      if ((e.key === 'Backspace' || e.key === 'Delete' || e.key === 'x') &&
          !e.ctrlKey && !e.altKey && !e.metaKey) {
        const selectedGroups = document.querySelectorAll('.math-group.selected');
        if (selectedGroups.length > 0) {
          e.preventDefault();
          selectedGroups.forEach((group) => group.remove());
        }
      }
    });
  
    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.spaceDown = false;
      }
    });
  }
  

  initCanvasPanning() {
    this.canvas.addEventListener('mousedown', (e) => {
      // Start panning with middle mouse or left mouse when space is held.
      if (e.button === 1 || (e.button === 0 && this.spaceDown)) {
        this.isPanning = true;
        this.panStart.x = e.clientX - this.canvasOffset.x;
        this.panStart.y = e.clientY - this.canvasOffset.y;
        e.preventDefault();
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        this.canvasOffset.x = e.clientX - this.panStart.x;
        this.canvasOffset.y = e.clientY - this.panStart.y;
        this.clampPan();
        this.updateTransform();
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 1 || e.button === 0) {
        this.isPanning = false;
      }
    });

    this.canvas.addEventListener('mouseleave', () => (this.isPanning = false));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

initDocumentClickHandler() {
  document.addEventListener('click', (event) => {
    // Do nothing if panning or group dragging.
    if (this.isPanning || this.groupDragging) return;

    // If clicking on a math-field container (that isn’t actively editing), enable editing.
    const mathContainer = event.target.closest('.math-field-container');
    if (mathContainer && !mathContainer.querySelector('.mq-editable-field')) {
      event.stopPropagation();
      MathField.edit(mathContainer);
      return;
    }
    if (event.target.closest('.math-field-container')) return;

    // Determine if the click occurred on a math group.
    const mathGroupTarget = event.target.closest('.math-group');

    if (mathGroupTarget) {
      if (!event.shiftKey) {
        // Without shift: clear any other selections and select this group.
        document.querySelectorAll('.math-group').forEach((group) => group.classList.remove('selected'));
        mathGroupTarget.classList.add('selected');
      } else {
        // With shift: toggle the selected state of this group.
        mathGroupTarget.classList.toggle('selected');
      }
    } else {
      // Clicked outside a math group: clear all selections.
      document.querySelectorAll('.math-group').forEach((group) => group.classList.remove('selected'));
    }
  });
}


  initGroupDragging() {
    // Start dragging a math group.
    document.addEventListener('mousedown', (event) => {
      // Only proceed for left-click and when space is not held.
      if (event.button !== 0 || this.spaceDown) return;
      
      // Prevent dragging if the click is inside an actively editing math field.
      if (event.target.closest('.mq-editable-field')) return;
  
      // Traverse up to find the math group.
      let target = event.target;
      while (target && !target.classList.contains('math-group')) {
        target = target.parentElement;
      }
      if (target && target.classList.contains('math-group')) {
        this.groupDragging = true;
        this.draggedGroup = target;
        this.dragOffsetX = event.clientX - target.offsetLeft;
        this.dragOffsetY = event.clientY - target.offsetTop;
        target.classList.add('dragging');
        event.stopPropagation();
      }
    });
  
    document.addEventListener('mousemove', (event) => {
      if (this.groupDragging && this.draggedGroup) {
        this.draggedGroup.style.left = event.clientX - this.dragOffsetX + 'px';
        this.draggedGroup.style.top = event.clientY - this.dragOffsetY + 'px';
      }
    });
  
    document.addEventListener('mouseup', () => {
      if (this.groupDragging && this.draggedGroup) {
        this.draggedGroup.classList.remove('dragging');
        this.groupDragging = false;
        this.draggedGroup = null;
      }
    });
  }
  

  initWindowResizeHandler() {
    window.addEventListener('resize', () => {
      this.clampPan();
      this.updateTransform();
    });
  }

  initDoubleClickHandler() {
    document.addEventListener('dblclick', (event) => {
      if (this.isPanning) return;
      const coords = this.screenToCanvas(event.clientX, event.clientY);
      new MathGroup(this, coords.x, coords.y);
    });
  }

  clampPan() {
    const minX = window.innerWidth - 10000;
    const maxX = 10000;
    this.canvasOffset.x = Math.min(maxX, Math.max(minX, this.canvasOffset.x));

    const minY = window.innerHeight - 10000;
    const maxY = 10000;
    this.canvasOffset.y = Math.min(maxY, Math.max(minY, this.canvasOffset.y));
  }

  updateTransform() {
    this.canvas.style.transform = `translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px)`;
  }

  initBoxSelection() {
    // Track the box selection state.
    this.boxSelect = {
      isSelecting: false,
      startX: 0,
      startY: 0,
      element: null,
    };
  
    // Start box selection on mousedown if clicking on the canvas background.
    this.canvas.addEventListener('mousedown', (e) => {
      // Only act on left-click, and if space is not held (panning takes precedence)
      if (e.button !== 0 || this.spaceDown) return;
      // Only start box selection if clicking directly on the canvas.
      if (e.target !== this.canvas) return;
  
      this.boxSelect.isSelecting = true;
      this.boxSelect.startX = e.clientX;
      this.boxSelect.startY = e.clientY;
  
      // Create the selection rectangle element.
      this.boxSelect.element = document.createElement('div');
      this.boxSelect.element.className = 'box-select-rect';
      this.boxSelect.element.style.position = 'absolute';
      this.boxSelect.element.style.border = '1px dashed #00c59a';
      this.boxSelect.element.style.backgroundColor = 'rgba(0, 197, 154, 0.1)';
      this.boxSelect.element.style.pointerEvents = 'none';
      this.boxSelect.element.style.left = `${this.boxSelect.startX}px`;
      this.boxSelect.element.style.top = `${this.boxSelect.startY}px`;
      this.boxSelect.element.style.width = '0px';
      this.boxSelect.element.style.height = '0px';
  
      // Append to document body so its position is in viewport coordinates.
      document.body.appendChild(this.boxSelect.element);
    });
  
    // Update the selection rectangle as the mouse moves.
    document.addEventListener('mousemove', (e) => {
      if (!this.boxSelect.isSelecting) return;
      const startX = this.boxSelect.startX;
      const startY = this.boxSelect.startY;
      const currentX = e.clientX;
      const currentY = e.clientY;
      // Calculate rectangle position and size.
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
  
      this.boxSelect.element.style.left = `${left}px`;
      this.boxSelect.element.style.top = `${top}px`;
      this.boxSelect.element.style.width = `${width}px`;
      this.boxSelect.element.style.height = `${height}px`;
    });
  
    // On mouseup, finalize the selection.
    document.addEventListener('mouseup', (e) => {
      if (!this.boxSelect.isSelecting) return;
      this.boxSelect.isSelecting = false;
      // Get bounding rect of the selection element (in viewport coordinates).
      const selectionRect = this.boxSelect.element.getBoundingClientRect();
      // Remove the selection rectangle.
      this.boxSelect.element.remove();
      this.boxSelect.element = null;
  
      // Optionally, clear previous selection.
      document.querySelectorAll('.math-group').forEach((group) => {
        group.classList.remove('selected');
      });
  
      // For each math group, check if its bounding rectangle intersects the selection rectangle.
      document.querySelectorAll('.math-group').forEach((group) => {
        const groupRect = group.getBoundingClientRect();
        if (
          selectionRect.left < groupRect.right &&
          selectionRect.right > groupRect.left &&
          selectionRect.top < groupRect.bottom &&
          selectionRect.bottom > groupRect.top
        ) {
          group.classList.add('selected');
        }
      });
    });
  
    // Cancel selection if the mouse leaves the canvas.
    this.canvas.addEventListener('mouseleave', () => {
      if (this.boxSelect.isSelecting && this.boxSelect.element) {
        this.boxSelect.element.remove();
        this.boxSelect.isSelecting = false;
      }
    });
  }
  
  

  // screenToCanvas remains unchanged:
  screenToCanvas(x, y) {
    return {
      x: (x - (this.canvasInitialOffset.x + this.canvasOffset.x)) / this.scale,
      y: (y - (this.canvasInitialOffset.y + this.canvasOffset.y)) / this.scale,
    };
  }

  
}