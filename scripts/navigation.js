// navigation.js

class Navigation {
    constructor(board) {
      this.board = board;
      this.boxSelect = {
        isSelecting: false,
        startX: 0,
        startY: 0,
        element: null,
      };
    }
  
    init() {
      this.initCanvasPanning();
      this.initTrackpadNavigation();
      this.initBoxSelection();
      window.addEventListener('resize', () => {
        this.clampPan();
        this.updateTransform();
      });
    }
  
    initCanvasPanning() {
      const canvas = this.board.canvas;
      canvas.addEventListener('mousedown', (e) => {
        // Start panning with middle mouse or left mouse when space is held.
        if (e.button === 1 || (e.button === 0 && this.board.spaceDown)) {
          this.board.isPanning = true;
          this.board.panStart.x = e.clientX - this.board.canvasOffset.x;
          this.board.panStart.y = e.clientY - this.board.canvasOffset.y;
          e.preventDefault();
        }
      });
  
      canvas.addEventListener('mousemove', (e) => {
        if (this.board.isPanning) {
          this.board.canvasOffset.x = e.clientX - this.board.panStart.x;
          this.board.canvasOffset.y = e.clientY - this.board.panStart.y;
          this.clampPan();
          this.updateTransform();
        }
      });
  
      canvas.addEventListener('mouseup', (e) => {
        if (e.button === 1 || e.button === 0) {
          this.board.isPanning = false;
        }
      });
  
      canvas.addEventListener('mouseleave', () => {
        this.board.isPanning = false;
      });
  
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  
    clampPan() {
      const minX = window.innerWidth - 10000;
      const maxX = 10000;
      this.board.canvasOffset.x = Math.min(maxX, Math.max(minX, this.board.canvasOffset.x));
  
      const minY = window.innerHeight - 10000;
      const maxY = 10000;
      this.board.canvasOffset.y = Math.min(maxY, Math.max(minY, this.board.canvasOffset.y));
    }
  
    updateTransform() {
      this.board.canvas.style.transform = `translate(${this.board.canvasOffset.x}px, ${this.board.canvasOffset.y}px)`;
    }
  
    initTrackpadNavigation() {
      const canvas = this.board.canvas;
      canvas.addEventListener('wheel', (e) => {
        // Trackpad heuristic: deltaMode 0 with horizontal scrolling or small vertical deltas.
        if (e.deltaMode === 0 && (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < 50)) {
          e.preventDefault();
          this.board.canvasOffset.x -= e.deltaX;
          this.board.canvasOffset.y -= e.deltaY;
          this.clampPan();
          this.updateTransform();
        }
      }, { passive: false });
    }
  
    initBoxSelection() {
      const canvas = this.board.canvas;
      canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || this.board.spaceDown) return;
        if (e.target !== canvas) return;
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
    
        // Get the current selection rectangle's bounds.
        const selectionRect = this.boxSelect.element.getBoundingClientRect();
        
        // For each math group, check if it overlaps with the selection box.
        document.querySelectorAll('.math-group').forEach((group) => {
          const groupRect = group.getBoundingClientRect();
          // Check for any overlap:
          const isOverlapping =
            groupRect.left < selectionRect.right &&
            groupRect.right > selectionRect.left &&
            groupRect.top < selectionRect.bottom &&
            groupRect.bottom > selectionRect.top;
          
          if (isOverlapping) {
            group.classList.add('selected');
          } else {
            group.classList.remove('selected');
          }
        });
      });
    
      document.addEventListener('mouseup', (e) => {
        if (!this.boxSelect.isSelecting) return;
        this.boxSelect.isSelecting = false;
        // Remove the selection rectangle element
        if (this.boxSelect.element) {
          this.boxSelect.element.remove();
          this.boxSelect.element = null;
        }
        // Set a flag to prevent the global click handler from clearing the selection immediately.
        this.board.justBoxSelected = true;
      });
    
      canvas.addEventListener('mouseleave', () => {
        if (this.boxSelect.isSelecting && this.boxSelect.element) {
          this.boxSelect.element.remove();
          this.boxSelect.isSelecting = false;
        }
      });
    }
    
    
  
    selectGroupsWithinBox(selectionRect) {
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
  
    // Helper to convert screen coordinates to canvas coordinates.
    screenToCanvas(x, y) {
      return {
        x: (x - (this.board.canvasInitialOffset.x + this.board.canvasOffset.x)) / this.board.scale,
        y: (y - (this.board.canvasInitialOffset.y + this.board.canvasOffset.y)) / this.board.scale,
      };
    }
  }
  