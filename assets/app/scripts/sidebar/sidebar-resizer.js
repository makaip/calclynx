export class SidebarResizer {
	constructor(sidebar, mainContent, resizer) {
		this.sidebar = sidebar;
		this.mainContent = mainContent;
		this.resizer = resizer;
		this.minWidth = 200;
		this.maxWidth = 800;
		this.currentWidth = 400;
		this.isResizing = false;
	}

	applyWidth(width) {
		if (!this.sidebar) return;

		const clampedWidth = Math.max(this.minWidth, Math.min(width, this.maxWidth));
		this.sidebar.style.setProperty('--bs-offcanvas-width', `${clampedWidth}px`);

		this.currentWidth = clampedWidth;
	}

	handleResizeStart() {
		this.isResizing = true;
		document.body.classList.add('no-select');
		document.onmousemove = this.handleMouseMove.bind(this);
		document.onmouseup = this.handleResizeEnd.bind(this);
	}

	handleMouseMove(e) {
		if (!this.isResizing) return;
		this.applyWidth(e.clientX);
	}

	handleResizeEnd() {
		if (!this.isResizing) return;
		this.isResizing = false;
		document.body.classList.remove('no-select');
		document.onmousemove = null;
		document.onmouseup = null;
	}

	init() {
		if (this.resizer) {
			this.resizer.onmousedown = this.handleResizeStart.bind(this);
		}

		if (this.sidebar) {
			this.sidebar.style.setProperty('--bs-offcanvas-width', `${this.currentWidth}px`);
		}
	}
}
