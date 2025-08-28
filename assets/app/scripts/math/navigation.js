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
    this.initZoom();
    this.initZoomControls();
    window.addEventListener('resize', () => {
      this.updateTransform();
    });
  }    initZoom() {
      const canvas = this.board.canvas;
      const zoomFactor = 1.08;
      const minScale   = 0.3;
      const maxScale   = 3.33333;

      canvas.addEventListener('wheel', e => {
        // ignore if trackpad-pan heuristic already caught it
        if (e.ctrlKey || e.deltaMode !== 0) {
          e.preventDefault();

          // 1. logical coords under cursor *before* scaling
          const logical = this.screenToCanvas(e.clientX, e.clientY);

          // 2. compute new scale
          // Normalize deltaY for different input types
          // Mouse wheel typically gives larger values (±100), trackpad gives smaller values
          let normalizedDelta = e.deltaY;
          
          // For mouse wheel (deltaMode 1 or larger deltaY values), normalize to smaller increments
          if (e.deltaMode === 1 || Math.abs(e.deltaY) > 50) {
            normalizedDelta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY) / 10, 10);
          }
          
          const factor    = Math.pow(zoomFactor, -normalizedDelta / 3);
          const newScale  = Math.min(maxScale, Math.max(minScale, this.board.scale * factor));

          // 3. update scale
          this.board.scale = newScale;

          // 4. adjust pan offsets so logical point remains under cursor
          // screenX = (logical.x * newScale) + initialOffsetX + canvasOffset.x
          // ⇒ canvasOffset.x = screenX - initialOffsetX - logical.x * newScale
          this.board.canvasOffset.x = e.clientX
              - (this.board.canvasInitialOffset.x + logical.x * newScale);
          this.board.canvasOffset.y = e.clientY
              - (this.board.canvasInitialOffset.y + logical.y * newScale);

          // 5. redraw
          this.updateTransform();
          this.updateZoomControls();
        }
      }, { passive: false });
    }

    initZoomControls() {
      const zoomControls = document.getElementById('zoom-controls');
      const zoomSlider = document.getElementById('zoom-slider');
      const zoomInBtn = document.getElementById('zoom-in-btn');
      const zoomOutBtn = document.getElementById('zoom-out-btn');
      const resetZoomBtn = document.getElementById('reset-zoom-btn');

      // Update zoom controls visibility and values
      this.updateZoomControls();

      // Slider input handler
      zoomSlider.addEventListener('input', (e) => {
        const newScale = parseFloat(e.target.value) / 100;
        this.setZoomLevel(newScale);
      });

      // Zoom in button
      zoomInBtn.addEventListener('click', () => {
        const newScale = Math.min(3.33333, this.board.scale * 1.08);
        this.setZoomLevel(newScale);
      });

      // Zoom out button
      zoomOutBtn.addEventListener('click', () => {
        const newScale = Math.max(0.3, this.board.scale / 1.08);
        this.setZoomLevel(newScale);
      });

      // Reset zoom button
      resetZoomBtn.addEventListener('click', () => {
        this.setZoomLevel(1);
      });
    }

    setZoomLevel(newScale) {
      // Get center of viewport for zoom anchor point
      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = window.innerHeight / 2;
      
      // Get logical coordinates under center before scaling
      const logical = this.screenToCanvas(viewportCenterX, viewportCenterY);
      
      // Update scale
      this.board.scale = newScale;
      
      // Adjust pan offsets so center point remains in center
      this.board.canvasOffset.x = viewportCenterX
          - (this.board.canvasInitialOffset.x + logical.x * newScale);
      this.board.canvasOffset.y = viewportCenterY
          - (this.board.canvasInitialOffset.y + logical.y * newScale);
      
      // Update transform and controls
      this.updateTransform();
      this.updateZoomControls();
    }

    updateZoomControls() {
      const zoomControls = document.getElementById('zoom-controls');
      const zoomSlider = document.getElementById('zoom-slider');
      
      if (!zoomControls || !zoomSlider) return;
      
      // Update slider value
      zoomSlider.value = Math.round(this.board.scale * 100);
      
      // Show/hide controls based on zoom level
      const isDefaultZoom = Math.abs(this.board.scale - 1) < 0.01;
      if (isDefaultZoom) {
        zoomControls.classList.remove('visible');
        zoomControls.classList.add('hidden');
      } else {
        zoomControls.classList.remove('hidden');
        zoomControls.classList.add('visible');
      }
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

    updateTransform() {
      const { x, y } = this.board.canvasOffset;
      const s        = this.board.scale;
      this.board.canvas.style.transform =
          `translate(${x}px, ${y}px) scale(${s})`;
      this.updateZoomControls();
    }
  
    initTrackpadNavigation() {
      const canvas = this.board.canvas;
      canvas.addEventListener('wheel', (e) => {
        // Trackpad heuristic: deltaMode 0 with horizontal scrolling or small vertical deltas.
        if (e.deltaMode === 0 && (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < 50)) {
          e.preventDefault();
          this.board.canvasOffset.x -= e.deltaX;
          this.board.canvasOffset.y -= e.deltaY;
          this.updateTransform();
        }
      }, { passive: false });
    }
  
    initBoxSelection() {
      const canvas = this.board.canvas;
      canvas.addEventListener('mousedown', (e) => {
        // Only left click and when not panning.
        if (e.button !== 0 || this.board.spaceDown) return;
        // Don't start box selection if group dragging is already in progress
        if (this.board.groupDragging) return;
        
        // Check if clicking on a group (math, text, or image group)
        let target = e.target;
        while (target && target !== canvas) {
          if (target.classList.contains('math-group') || target.classList.contains('text-group') || target.classList.contains('image-group')) {
            // Clicking on a group, don't start box selection
            return;
          }
          target = target.parentElement;
        }
        
        // Only trigger box selection if NOT clicking inside a text editor
        if (e.target.closest('.text-editor')) return;
        
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
        // Cancel box selection if group dragging starts
        if (this.board.groupDragging) {
          this.boxSelect.isSelecting = false;
          if (this.boxSelect.element) {
            this.boxSelect.element.remove();
            this.boxSelect.element = null;
          }
          return;
        }
        
        // Prevent text selection when mouse moves over text editors during box selection
        if (e.target.closest('.text-editor')) {
          e.preventDefault();
          // Clear any text selection that might have occurred
          if (window.getSelection) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              selection.removeAllRanges();
            }
          }
        }
        
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
        
        // For each math group, text group, and image group, check if it overlaps with the selection box.
        document.querySelectorAll('.math-group, .text-group, .image-group').forEach((group) => {
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
      document.querySelectorAll('.math-group, .text-group, .image-group').forEach((group) => {
        group.classList.remove('selected');
      });
  
      document.querySelectorAll('.math-group, .text-group, .image-group').forEach((group) => {
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
