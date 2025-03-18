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

    // Initialize FileManager and load saved state (if any)
    this.fileManager = new FileManager(this);
    this.fileManager.loadState();

    // Variables for group dragging.
    this.groupDragging = false;
    this.draggedGroup = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.margin = 10;

    // Box select properties.
    this.isBoxSelecting = false;
    this.boxSelectStart = { x: 0, y: 0 };
    this.selectionBox = null;

    this.initEventListeners();

    this.navigation = new Navigation(this);
    this.navigation.init();
  }

  // -------------------------
  // EVENT INITIALIZERS (unchanged except where noted)
  // -------------------------
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
        this.spaceDown = true;
      }
      if (
        (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'x') &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
      ) {
        const selectedGroups = document.querySelectorAll('.math-group.selected');
        if (selectedGroups.length > 0) {
          e.preventDefault();
          selectedGroups.forEach((group) => {
            group.remove();
          });
          // Save updated state
          this.fileManager.saveState();
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.spaceDown = false;
      }
    });
  }

  
  initDocumentClickHandler() {
    document.addEventListener('click', (event) => {
      if (this.isPanning || this.groupDragging) return;
      const mathContainer = event.target.closest('.math-field-container');
      if (mathContainer && !mathContainer.querySelector('.mq-editable-field')) {
        event.stopPropagation();
        MathField.edit(mathContainer);
        return;
      }
      if (event.target.closest('.math-field-container')) return;
      const mathGroupTarget = event.target.closest('.math-group');
      if (mathGroupTarget) {
        if (!event.shiftKey) {
          document.querySelectorAll('.math-group').forEach((group) => group.classList.remove('selected'));
          mathGroupTarget.classList.add('selected');
        } else {
          mathGroupTarget.classList.toggle('selected');
        }
      } else {
        document.querySelectorAll('.math-group').forEach((group) => group.classList.remove('selected'));
      }
    });
  }

  initGroupDragging() {
    document.addEventListener('mousedown', (event) => {
      if (event.button !== 0 || this.spaceDown) return;
      if (event.target.closest('.mq-editable-field')) return;
      let target = event.target;
      while (target && !target.classList.contains('math-group')) {
        target = target.parentElement;
      }
      if (target && target.classList.contains('math-group')) {
        let groups;
        if (target.classList.contains('selected')) {
          groups = Array.from(document.querySelectorAll('.math-group.selected'));
        } else {
          groups = [target];
        }
        this.groupDragging = true;
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
    });

    document.addEventListener('mousemove', (event) => {
      if (this.groupDragging && this.selectedGroups) {
        const deltaX = event.clientX - this.dragStart.x;
        const deltaY = event.clientY - this.dragStart.y;
        this.initialPositions.forEach((item) => {
          item.group.style.left = (item.left + deltaX) + 'px';
          item.group.style.top = (item.top + deltaY) + 'px';
        });
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.groupDragging && this.selectedGroups) {
        this.selectedGroups.forEach((group) => group.classList.remove('dragging'));
        this.groupDragging = false;
        this.selectedGroups = null;
        this.initialPositions = null;
        // Save state after dragging ends.
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
      if (this.isPanning) return;
      const coords = this.screenToCanvas(event.clientX, event.clientY);
      // Create a new MathGroup and then save state.
      new MathGroup(this, coords.x, coords.y);
      this.fileManager.saveState()
    });
  }

  updateTransform() {
    this.canvas.style.transform = `translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px)`;
  }

  selectStacksWithinBox(selectionRect) {
    document.querySelectorAll('.math-group').forEach((group) => {
      group.classList.remove('selected');
    });

    document.querySelectorAll('.math-group').forEach((group) => {
      const groupRect = group.getBoundingClientRect();
      if (
        groupRect.left >= selectionRect.left &&
        groupRect.right <= selectionRect.right &&
        groupRect.top >= selectionRect.top &&
        groupRect.bottom <= selectionRect.bottom
      ) {
        group.classList.add('selected');
      }
    });
  }

  screenToCanvas(x, y) {
    return {
      x: (x - (this.canvasInitialOffset.x + this.canvasOffset.x)) / this.scale,
      y: (y - (this.canvasInitialOffset.y + this.canvasOffset.y)) / this.scale,
    };
  }
}
