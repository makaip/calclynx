import { BoxSelection } from './selection.js';
import { ZoomControls } from '../ui/zoom-controls.js';

const ZOOM = { FACTOR: 1.08, MIN: 0.3, MAX: 3.3333 };

class Navigation {
	constructor(board) {
		this.board = board;
		this.boxSelection = new BoxSelection(board);
		this.zoom = new Zoom(board);
		this.zoomControls = new ZoomControls(board);
	}

	init() {
		this.initCanvasPanning();
		this.initTrackpadNavigation();
		this.boxSelection.init();
		this.zoom.init();
		this.zoomControls.init();

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
		this.zoomControls.updateZoomControls();
	}

	screenToCanvas(x, y) {
		return CanvasUtils.screenToCanvas(x, y, this.board);
	}
}

class Zoom {
	constructor(board) {
		this.board = board;
	}

	init() {
		this.initZoom();
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
		this.board.navigation.zoomControls.updateZoomControls();
	}

	zoomIn() {
		this.setZoomLevel(this.clampScale(this.board.canvasState.scale * ZOOM.FACTOR));
	}

	zoomOut() {
		this.setZoomLevel(this.clampScale(this.board.canvasState.scale / ZOOM.FACTOR));
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
		this.board.navigation.zoomControls.updateZoomControls();
	}

	updateTransform() {
		CanvasUtils.updateTransform(this.board);
		this.board.navigation.zoomControls.updateZoomControls();
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

export { Navigation };