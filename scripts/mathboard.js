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

    // Load saved state (if any)
    this.loadState();
  }

  // -------------------------
  // SAVE / LOAD STATE METHODS
  // ------------------------- 
// In mathboard.js

saveState() {
  const groups = [];
  const mathGroupElements = this.canvas.querySelectorAll('.math-group');
  mathGroupElements.forEach((group) => {
    const left = group.style.left;
    const top = group.style.top;
    const fields = [];
    group.querySelectorAll('.math-field-container').forEach((container) => {
      if (container.dataset.latex) {
        fields.push(container.dataset.latex);
      }
    });
    groups.push({ left, top, fields });
  });
  const stateString = JSON.stringify(groups);
  // Save state using localStorage
  localStorage.setItem("mathBoardState", stateString);
}

loadState() {
  const stateString = localStorage.getItem("mathBoardState");
  if (!stateString) return;
  let groups;
  try {
    groups = JSON.parse(stateString);
  } catch (e) {
    console.error("Failed to parse state from localStorage:", e);
    return;
  }
  groups.forEach((groupData) => {
    new MathGroup(this, groupData.left, groupData.top, groupData);
  });
}


  // Exports the current state as a JSON file.
exportData() {
  const groups = [];
  const mathGroupElements = this.canvas.querySelectorAll('.math-group');
  mathGroupElements.forEach((group) => {
    const left = group.style.left;
    const top = group.style.top;
    const fields = [];
    group.querySelectorAll('.math-field-container').forEach((container) => {
      if (container.dataset.latex) {
        fields.push(container.dataset.latex);
      }
    });
    groups.push({ left, top, fields });
  });
  const dataStr = JSON.stringify(groups, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "mathboard-data.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Imports board data from a JSON string.
importData(jsonData) {
  try {
    const groups = JSON.parse(jsonData);
    // Clear the current canvas (remove all existing math groups).
    this.canvas.innerHTML = '';
    groups.forEach((groupData) => {
       new MathGroup(this, groupData.left, groupData.top, groupData);
    });
    // Save the new state.
    this.saveState();
  } catch (error) {
    console.error("Failed to import data:", error);
  }
}


  // -------------------------
  // EVENT INITIALIZERS (unchanged except where noted)
  // -------------------------
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
          this.saveState();
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
        this.saveState();
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
      // Create a new MathGroup and then save state.
      new MathGroup(this, coords.x, coords.y);
      this.saveState();
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
    this.boxSelect = {
      isSelecting: false,
      startX: 0,
      startY: 0,
      element: null,
    };

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || this.spaceDown) return;
      if (e.target !== this.canvas) return;
      this.boxSelect.isSelecting = true;
      this.boxSelect.startX = e.clientX;
      this.boxSelect.startY = e.clientY;

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

      document.body.appendChild(this.boxSelect.element);
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.boxSelect.isSelecting) return;
      const startX = this.boxSelect.startX;
      const startY = this.boxSelect.startY;
      const currentX = e.clientX;
      const currentY = e.clientY;
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      this.boxSelect.element.style.left = `${left}px`;
      this.boxSelect.element.style.top = `${top}px`;
      this.boxSelect.element.style.width = `${width}px`;
      this.boxSelect.element.style.height = `${height}px`;
    });

    document.addEventListener('mouseup', (e) => {
      if (!this.boxSelect.isSelecting) return;
      this.boxSelect.isSelecting = false;
      const selectionRect = this.boxSelect.element.getBoundingClientRect();
      this.boxSelect.element.remove();
      this.boxSelect.element = null;
      this.selectStacksWithinBox(selectionRect);
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.boxSelect.isSelecting && this.boxSelect.element) {
        this.boxSelect.element.remove();
        this.boxSelect.isSelecting = false;
      }
    });
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
