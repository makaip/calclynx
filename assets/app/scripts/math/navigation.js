const ZOOM = { FACTOR: 1.08, MIN: 0.3, MAX: 3.3333 };

class Navigation {
  constructor(board) {
    this.board = board;
    this.boxSelection = new BoxSelection(board);
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
    this.boxSelection.init();
    this.initZoom();
    this.initZoomControls();

    window.addEventListener('resize', () => this.updateTransform());
  }

  initZoom() {
    this.board.canvas.addEventListener('wheel', (e) => {
        if (!(e.ctrlKey || e.deltaMode !== 0)) return;
        e.preventDefault();

        const logical = this.screenToCanvas(e.clientX, e.clientY);
        const delta = this.normalizeWheelDelta(e);
        const factor = Math.pow(ZOOM.FACTOR, -delta / 3);
        const newScale = this.clampScale(this.board.canvasState.scale * factor);

        this.applyZoom(newScale, e.clientX, e.clientY, logical);
      },
      { passive: false }
    );
  }

  normalizeWheelDelta(e) {
    if (e.deltaMode === 1 || Math.abs(e.deltaY) > 50) {
      return Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY) / 10, 10);
    } else {
      return e.deltaY;
    }
  }

  clampScale(scale) {
    return Math.min(ZOOM.MAX, Math.max(ZOOM.MIN, scale));
  }

  applyZoom(newScale, screenX, screenY, logical) {
    this.board.canvasState.scale = newScale;
    this.board.canvasState.offset.x = screenX - (this.board.canvasState.initialOffset.x + logical.x * newScale);
    this.board.canvasState.offset.y = screenY - (this.board.canvasState.initialOffset.y + logical.y * newScale);

    this.updateTransform();
    this.updateZoomControls();
  }

  initZoomControls() {
    const { zoomSlider, zoomIn, zoomOut, resetZoom } = this.dom;
    if (!zoomSlider) return;

    this.updateZoomControls();

    zoomSlider.addEventListener('input', (e) => this.setZoomLevel(parseFloat(e.target.value) / 100));
    zoomIn.addEventListener('click', () => this.setZoomLevel(this.clampScale(this.board.canvasState.scale * ZOOM.FACTOR)));
    zoomOut.addEventListener('click', () => this.setZoomLevel(this.clampScale(this.board.canvasState.scale / ZOOM.FACTOR)));
    resetZoom.addEventListener('click', () => this.setZoomLevel(1));
  }

  setZoomLevel(newScale) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const logical = this.screenToCanvas(cx, cy);

    this.board.canvasState.scale = newScale;
    this.board.canvasState.offset.x =
      cx - (this.board.canvasState.initialOffset.x + logical.x * newScale);
    this.board.canvasState.offset.y =
      cy - (this.board.canvasState.initialOffset.y + logical.y * newScale);

    this.updateTransform();
    this.updateZoomControls();
  }

  updateZoomControls() {
    const { zoomControls, zoomSlider } = this.dom;
    if (!zoomControls || !zoomSlider) return;

    zoomSlider.value = Math.round(this.board.canvasState.scale * 100);
    zoomControls.classList.toggle(
      'visible',
      Math.abs(this.board.canvasState.scale - 1) >= 0.01
    );
    zoomControls.classList.toggle(
      'hidden',
      Math.abs(this.board.canvasState.scale - 1) < 0.01
    );
  }

  initCanvasPanning() {
    const canvas = this.board.canvas;

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 1 || (e.button === 0 && this.board.pan.spaceDown)) {
        this.board.pan.active = true;
        this.board.pan.start = {
          x: e.clientX - this.board.canvasState.offset.x,
          y: e.clientY - this.board.canvasState.offset.y,
        };
        e.preventDefault();
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.board.pan.active) {
        this.board.canvasState.offset.x = e.clientX - this.board.pan.start.x;
        this.board.canvasState.offset.y = e.clientY - this.board.pan.start.y;
        this.updateTransform();
      }
    });

    canvas.addEventListener('mouseup', () => (this.board.pan.active = false));
    canvas.addEventListener('mouseleave', () => (this.board.pan.active = false));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  initTrackpadNavigation() {
    this.board.canvas.addEventListener(
      'wheel',
      (e) => {
        if (e.deltaMode === 0 && (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < 50)) {
          e.preventDefault();
          this.board.canvasState.offset.x -= e.deltaX;
          this.board.canvasState.offset.y -= e.deltaY;
          this.updateTransform();
        }
      },
      { passive: false }
    );
  }

  updateTransform() {
    const { x, y } = this.board.canvasState.offset;
    const s = this.board.canvasState.scale;
    this.board.canvas.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    this.updateZoomControls();
  }

  screenToCanvas(x, y) {
    return {
      x: (x - (this.board.canvasState.initialOffset.x + this.board.canvasState.offset.x)) / this.board.canvasState.scale,
      y: (y - (this.board.canvasState.initialOffset.y + this.board.canvasState.offset.y)) / this.board.canvasState.scale,
    };
  }
}
