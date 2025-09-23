const ZOOM = { FACTOR: 1.08, MIN: 0.3, MAX: 3.3333 };

class Navigation {
  constructor(board) {
    this.board = board;
    this.boxSelection = new BoxSelection(board);
    this.zoom = new Zoom(board);
  }

  init() {
    this.initCanvasPanning();
    this.initTrackpadNavigation();
    this.boxSelection.init();
    this.zoom.init();

    window.addEventListener('resize', () => CanvasUtils.updateTransform(this.board));
  }

  initCanvasPanning() {
    const canvas = this.board.canvas;

    canvas.addEventListener('mousedown', (e) => this.handlePanStart(e));
    canvas.addEventListener('mousemove', (e) => this.handlePanMove(e));
    canvas.addEventListener('mouseup', () => this.handlePanEnd());
    canvas.addEventListener('mouseleave', () => this.handlePanEnd());
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handlePanStart(e) {
    if (this.shouldStartPanning(e)) {
      this.board.pan.active = true;
      this.board.pan.start = {
        x: e.clientX - this.board.canvasState.offset.x,
        y: e.clientY - this.board.canvasState.offset.y,
      };
      e.preventDefault();
    }
  }

  shouldStartPanning(e) {
    return e.button === 1 || (e.button === 0 && this.board.pan.spaceDown);
  }

  handlePanMove(e) {
    if (this.board.pan.active) {
      this.updatePanPosition(e.clientX, e.clientY);
    }
  }

  updatePanPosition(clientX, clientY) {
    this.board.canvasState.offset.x = clientX - this.board.pan.start.x;
    this.board.canvasState.offset.y = clientY - this.board.pan.start.y;
    CanvasUtils.updateTransform(this.board);
  }

  handlePanEnd() {
    this.board.pan.active = false;
  }

  initTrackpadNavigation() {
    this.board.canvas.addEventListener('wheel', (e) => this.handleTrackpadWheel(e), { passive: false });
  }

  handleTrackpadWheel(e) {
    if (this.shouldHandleTrackpadPan(e)) {
      e.preventDefault();
      this.applyTrackpadPan(e.deltaX, e.deltaY);
    }
  }

  shouldHandleTrackpadPan(e) {
    return e.deltaMode === 0 && (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < 50);
  }

  applyTrackpadPan(deltaX, deltaY) {
    this.board.canvasState.offset.x -= deltaX;
    this.board.canvasState.offset.y -= deltaY;
    CanvasUtils.updateTransform(this.board);
  }

  updateTransform() {
    CanvasUtils.updateTransform(this.board);
    this.zoom.updateZoomControls();
  }

  screenToCanvas(x, y) {
    return CanvasUtils.screenToCanvas(x, y, this.board);
  }
}

class Zoom {
  constructor(board) {
    this.board = board;
    this.cacheDOMElements();
  }

  cacheDOMElements() {
    this.dom = {
      zoomControls: document.getElementById('zoom-controls'),
      zoomSlider: document.getElementById('zoom-slider'),
      zoomIn: document.getElementById('zoom-in-btn'),
      zoomOut: document.getElementById('zoom-out-btn'),
      resetZoom: document.getElementById('reset-zoom-btn'),
    };
  }

  init() {
    this.initZoom();
    this.initZoomControls();
  }

  initZoom() {
    this.board.canvas.addEventListener('wheel', (e) => this.handleZoomWheel(e), { passive: false });
  }

  handleZoomWheel(e) {
    if (!this.shouldZoom(e)) return;
    
    e.preventDefault();
    const zoomData = this.calculateZoomData(e);
    this.applyZoom(zoomData.newScale, e.clientX, e.clientY, zoomData.logical);
  }

  shouldZoom(e) {
    return e.ctrlKey || e.deltaMode !== 0;
  }

  calculateZoomData(e) {
    const logical = CanvasUtils.screenToCanvas(e.clientX, e.clientY, this.board);
    const delta = this.normalizeWheelDelta(e);
    const factor = Math.pow(ZOOM.FACTOR, -delta / 3);
    const newScale = this.clampScale(this.board.canvasState.scale * factor);
    
    return { logical, newScale };
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

    CanvasUtils.updateTransform(this.board);
    this.updateZoomControls();
  }

  initZoomControls() {
    const { zoomSlider, zoomIn, zoomOut, resetZoom } = this.dom;
    if (!zoomSlider) return;

    this.updateZoomControls();
    this.setupZoomEventListeners();
  }

  setupZoomEventListeners() {
    const { zoomSlider, zoomIn, zoomOut, resetZoom } = this.dom;
    
    zoomSlider.addEventListener('input', (e) => 
      this.setZoomLevel(parseFloat(e.target.value) / 100)
    );
    
    zoomIn.addEventListener('click', () => 
      this.setZoomLevel(this.clampScale(this.board.canvasState.scale * ZOOM.FACTOR))
    );
    
    zoomOut.addEventListener('click', () => 
      this.setZoomLevel(this.clampScale(this.board.canvasState.scale / ZOOM.FACTOR))
    );
    
    resetZoom.addEventListener('click', () => this.setZoomLevel(1));
  }

  setZoomLevel(newScale) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const logical = CanvasUtils.screenToCanvas(cx, cy, this.board);

    this.board.canvasState.scale = newScale;
    this.board.canvasState.offset.x =
      cx - (this.board.canvasState.initialOffset.x + logical.x * newScale);
    this.board.canvasState.offset.y =
      cy - (this.board.canvasState.initialOffset.y + logical.y * newScale);

    CanvasUtils.updateTransform(this.board);
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

  updateTransform() {
    CanvasUtils.updateTransform(this.board);
    this.updateZoomControls();
  }

  screenToCanvas(x, y) {
    return CanvasUtils.screenToCanvas(x, y, this.board);
  }
}

class CanvasUtils {
  static updateTransform(board) {
    const { x, y } = board.canvasState.offset;
    const s = board.canvasState.scale;
    board.canvas.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  }

  static screenToCanvas(x, y, board) {
    return {
      x: (x - (board.canvasState.initialOffset.x + board.canvasState.offset.x)) / board.canvasState.scale,
      y: (y - (board.canvasState.initialOffset.y + board.canvasState.offset.y)) / board.canvasState.scale,
    };
  }
}