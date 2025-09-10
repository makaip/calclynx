const ZOOM = { FACTOR: 1.08, MIN: 0.3, MAX: 3.3333 };
const BOX_SELECT_STYLE = { position: 'absolute', border: '1px dashed #00c59a', backgroundColor: 'rgba(0, 197, 154, 0.1)', pointerEvents: 'none', };

class Navigation {
    constructor(board) {
      this.board = board;
      this.boxSelect = { isSelecting: false, startX: 0, startY: 0, element: null };
      this.cacheDOM();
    }

  cacheDOM() {
    this.dom = {
      zoomControls: document.getElementById('zoom-controls'),
      zoomSlider: document.getElementById('zoom-slider'),
      zoomIn: document.getElementById('zoom-in-btn'),
      zoomOut: document.getElementById('zoom-out-btn'),
      resetZoom: document.getElementById('reset-zoom-btn'),
    };
  }

  init() {
    this.initCanvasPanning();
    this.initTrackpadNavigation();
    this.initBoxSelection();
    this.initZoom();
    this.initZoomControls();

    window.addEventListener('resize', () => this.updateTransform());
  }

    initZoom() {
      this.board.canvas.addEventListener(
        'wheel',
        (e) => {
          if (!(e.ctrlKey || e.deltaMode !== 0)) return;
          e.preventDefault();

          const logical = this.screenToCanvas(e.clientX, e.clientY);
          const delta = this.normalizeWheelDelta(e);
          const factor = Math.pow(ZOOM.FACTOR, -delta / 3);
          const newScale = this.clampScale(this.board.scale * factor);

          this.applyZoom(newScale, e.clientX, e.clientY, logical);
        },
        { passive: false }
      );
    }

    normalizeWheelDelta(e) {
      if (e.deltaMode === 1 || Math.abs(e.deltaY) > 50) {
        return Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY) / 10, 10);
      }
      return e.deltaY;
    }

    clampScale(scale) {
      return Math.min(ZOOM.MAX, Math.max(ZOOM.MIN, scale));
    }

    applyZoom(newScale, screenX, screenY, logical) {
      this.board.scale = newScale;
      this.board.canvasOffset.x = screenX - (this.board.canvasInitialOffset.x + logical.x * newScale);
      this.board.canvasOffset.y = screenY - (this.board.canvasInitialOffset.y + logical.y * newScale);

      this.updateTransform();
      this.updateZoomControls();
    }

    initZoomControls() {
      const { zoomSlider, zoomIn, zoomOut, resetZoom } = this.dom;
      if (!zoomSlider) return;

      this.updateZoomControls();

      zoomSlider.addEventListener('input', (e) => this.setZoomLevel(parseFloat(e.target.value) / 100));
      zoomIn.addEventListener('click', () => this.setZoomLevel(this.clampScale(this.board.scale * ZOOM.FACTOR)));
      zoomOut.addEventListener('click', () => this.setZoomLevel(this.clampScale(this.board.scale / ZOOM.FACTOR)));
      resetZoom.addEventListener('click', () => this.setZoomLevel(1));
    }

    setZoomLevel(newScale) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const logical = this.screenToCanvas(cx, cy);

      this.board.scale = newScale;
      this.board.canvasOffset.x =
        cx - (this.board.canvasInitialOffset.x + logical.x * newScale);
      this.board.canvasOffset.y =
        cy - (this.board.canvasInitialOffset.y + logical.y * newScale);

      this.updateTransform();
      this.updateZoomControls();
    }

    updateZoomControls() {
      const { zoomControls, zoomSlider } = this.dom;
      if (!zoomControls || !zoomSlider) return;

      zoomSlider.value = Math.round(this.board.scale * 100);
      zoomControls.classList.toggle(
        'visible',
        Math.abs(this.board.scale - 1) >= 0.01
      );
      zoomControls.classList.toggle(
        'hidden',
        Math.abs(this.board.scale - 1) < 0.01
      );
    }

    initCanvasPanning() {
      const canvas = this.board.canvas;

      canvas.addEventListener('mousedown', (e) => {
        if (e.button === 1 || (e.button === 0 && this.board.spaceDown)) {
          this.board.isPanning = true;
          this.board.panStart = {
            x: e.clientX - this.board.canvasOffset.x,
            y: e.clientY - this.board.canvasOffset.y,
          };
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

      canvas.addEventListener('mouseup', () => (this.board.isPanning = false));
      canvas.addEventListener('mouseleave', () => (this.board.isPanning = false));
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    initTrackpadNavigation() {
      this.board.canvas.addEventListener(
        'wheel',
        (e) => {
          if (e.deltaMode === 0 && (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < 50)) {
            e.preventDefault();
            this.board.canvasOffset.x -= e.deltaX;
            this.board.canvasOffset.y -= e.deltaY;
            this.updateTransform();
          }
        },
        { passive: false }
      );
    }

    initBoxSelection() {
      const canvas = this.board.canvas;

      canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || this.board.spaceDown || this.board.groupDragging) return;
        if (e.target.closest('.text-editor')) return;
        if (this.isInsideGroup(e.target, canvas)) return;

        this.startBoxSelect(e.clientX, e.clientY);
      });

      document.addEventListener('mousemove', (e) => this.updateBoxSelect(e));
      document.addEventListener('mouseup', () => this.endBoxSelect());
      canvas.addEventListener('mouseleave', () => this.cancelBoxSelect());
    }

    isInsideGroup(target, canvas) {
      while (target && target !== canvas) {
        if (
          target.classList.contains('math-group') ||
          target.classList.contains('text-group') ||
          target.classList.contains('image-group')
        )
          return true;
        target = target.parentElement;
      }
      return false;
    }

    startBoxSelect(x, y) {
      this.boxSelect = {
        isSelecting: true,
        startX: x,
        startY: y,
        element: this.createBoxSelectElement(x, y),
      };
      document.body.appendChild(this.boxSelect.element);
    }

    updateBoxSelect(e) {
      if (!this.boxSelect.isSelecting) return;
      if (this.board.groupDragging) return this.cancelBoxSelect();

      this.updateBoxElement(this.boxSelect.element, this.boxSelect.startX, this.boxSelect.startY, e.clientX, e.clientY);
      this.highlightGroups(this.boxSelect.element.getBoundingClientRect());
    }

    endBoxSelect() {
      if (!this.boxSelect.isSelecting) return;
      this.cancelBoxSelect();
      this.board.justBoxSelected = true;
    }

    cancelBoxSelect() {
      if (this.boxSelect.element) this.boxSelect.element.remove();
      this.boxSelect.isSelecting = false;
      this.boxSelect.element = null;
    }

    createBoxSelectElement(x, y) {
      const el = document.createElement('div');
      Object.assign(el.style, BOX_SELECT_STYLE, { left: `${x}px`, top: `${y}px`, width: '0px', height: '0px' });
      el.className = 'box-select-rect';
      return el;
    }

    updateBoxElement(el, x1, y1, x2, y2) {
      const left = Math.min(x1, x2);
      const top = Math.min(y1, y2);
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);
      Object.assign(el.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
    }

    highlightGroups(selectionRect) {
      document.querySelectorAll('.math-group, .text-group, .image-group').forEach((group) => {
        const groupRect = group.getBoundingClientRect();
        const overlap =
          groupRect.left < selectionRect.right &&
          groupRect.right > selectionRect.left &&
          groupRect.top < selectionRect.bottom &&
          groupRect.bottom > selectionRect.top;

        group.classList.toggle('selected', overlap);
      });
    }

    updateTransform() {
      const { x, y } = this.board.canvasOffset;
      const s = this.board.scale;
      this.board.canvas.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
      this.updateZoomControls();
    }

    screenToCanvas(x, y) {
      return {
        x: (x - (this.board.canvasInitialOffset.x + this.board.canvasOffset.x)) / this.board.scale,
        y: (y - (this.board.canvasInitialOffset.y + this.board.canvasOffset.y)) / this.board.scale,
      };
    }
}
