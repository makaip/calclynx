const MQ = MathQuill.getInterface(2);

class MathBoard {
  constructor() {
    this.canvas = document.getElementById('canvas');

    this.mouseX = 0;
    this.mouseY = 0;

    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.canvasOffset = { x: 0, y: 0 };
    this.spaceDown = false;
    this.scale = 1;
    this.canvasInitialOffset = { x: -10000, y: -10000 };

    this.groupDragging = false;
    this.draggedGroup = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.margin = 10;

    this.isBoxSelecting = false;
    this.boxSelectStart = { x: 0, y: 0 };
    this.selectionBox = null;
    this.justBoxSelected = false;

    this.fileManager = new FileManager(this);
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

      if (e.shiftKey && e.key === 'A' && !document.querySelector('.mq-focused')) {
        e.preventDefault();
        const coords = this.screenToCanvas(this.mouseX, this.mouseY);
        new MathGroup(this, coords.x, coords.y);
        this.fileManager.saveState();
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
      // If a box selection just finished, skip the normal click handling.
      if (this.justBoxSelected) {
        this.justBoxSelected = false;
        return;
      }
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

      if (!target) {
        document.querySelectorAll('.math-group').forEach((group) => group.classList.remove('selected'));
      }
    });

    document.addEventListener('mousemove', (event) => {
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;

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
      new MathGroup(this, coords.x, coords.y);
      this.fileManager.saveState()
    });
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
