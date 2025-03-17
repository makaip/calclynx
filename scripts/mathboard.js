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

    this.initEventListeners();
  }

  initEventListeners() {
    this.initGlobalKeyHandlers();
    this.initCanvasPanning();
    this.initDocumentClickHandler();
    this.initGroupDragging();
    this.initWindowResizeHandler();
    this.initDoubleClickHandler();
  }

  initGlobalKeyHandlers() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.spaceDown = true;
      }
      // Backspace deletion for selected math group.
      if ((e.key === 'Backspace' || e.key === 'x') && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const selectedGroup = document.querySelector('.math-group.selected');
        if (selectedGroup) {
          e.preventDefault();
          selectedGroup.remove();
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

      // Deselect all groups.
      document.querySelectorAll('.math-group').forEach((group) =>
        group.classList.remove('selected')
      );

      let target = event.target;
      const mathContainer = target.closest('.math-field-container');
      // If clicking on a container that isn’t in edit mode, enable editing.
      if (mathContainer && !mathContainer.querySelector('.mq-editable-field')) {
        event.stopPropagation();
        MathField.edit(mathContainer);
        return;
      }
      // If click is inside a math container, do nothing.
      if (target.closest('.math-field-container')) return;

      // Otherwise, select the parent math group.
      while (target && !target.classList.contains('math-group')) {
        target = target.parentElement;
      }
      if (target && target.classList.contains('math-group')) {
        target.classList.add('selected');
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

  screenToCanvas(x, y) {
    return {
      x: (x - (this.canvasInitialOffset.x + this.canvasOffset.x)) / this.scale,
      y: (y - (this.canvasInitialOffset.y + this.canvasOffset.y)) / this.scale,
    };
  }
}