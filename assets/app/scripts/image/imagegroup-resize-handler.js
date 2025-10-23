class ImageGroupResizeHandler {
	constructor(imageGroup) {
		this.imageGroup = imageGroup;
		this.isResizing = false;
		this.resizeHandle = null;
		this.resizeStartData = null;
	}

	createResizeHandles(container) {
		const handles = ['nw', 'ne', 'sw', 'se'];

		container.querySelectorAll('.resize-handle').forEach(h => h.remove());
		handles.forEach(position => {
			const handle = document.createElement('div');
			handle.className = `resize-handle resize-handle-${position}`;
			handle.dataset.position = position;
			handle.addEventListener('mousedown', (e) => this.startResize(e, position));
			container.appendChild(handle);
		});
	}

	startResize(e, position) {
		e.preventDefault();
		e.stopPropagation();

		this.isResizing = true;
		this.resizeHandle = position;

		const img = this.imageGroup.element.querySelector('.image-content');
		const rect = img.getBoundingClientRect();

		this.resizeStartData = {
			startX: e.clientX,
			startY: e.clientY,
			startWidth: this.imageGroup.imageWidth,
			startHeight: this.imageGroup.imageHeight,
			aspectRatio: this.imageGroup.imageWidth / this.imageGroup.imageHeight,
			originalRect: rect,

			originalLeft: parseFloat(this.imageGroup.element.style.left) || 0,
			originalTop: parseFloat(this.imageGroup.element.style.top) || 0
		};

		this.boundHandleResize = this.handleResize.bind(this);
		this.boundEndResize = this.endResize.bind(this);

		document.addEventListener('mousemove', this.boundHandleResize);
		document.addEventListener('mouseup', this.boundEndResize);

		this.imageGroup.element.classList.add('resizing');
	}

	handleResize(e) {
		if (!this.isResizing || !this.resizeStartData) return;

		e.preventDefault();

		const deltaX = e.clientX - this.resizeStartData.startX;
		const deltaY = e.clientY - this.resizeStartData.startY;

		const scaleFactor = this.imageGroup.getScaleFactor(
			this.resizeHandle,
			deltaX,
			deltaY,
			this.resizeStartData.startWidth,
			this.resizeStartData.startHeight
		);

		const minSize = 50;
		const adjustedScaleFactor = Math.max(scaleFactor, minSize / Math.min(this.resizeStartData.startWidth, this.resizeStartData.startHeight));

		const newWidth = this.resizeStartData.startWidth * adjustedScaleFactor;
		const newHeight = this.resizeStartData.startHeight * adjustedScaleFactor;

		const widthDiff = newWidth - this.resizeStartData.startWidth;
		const heightDiff = newHeight - this.resizeStartData.startHeight;

		const { newLeft, newTop } = this.imageGroup.getNewPosition(this.resizeHandle, {
			left: this.resizeStartData.originalLeft,
			top: this.resizeStartData.originalTop
		}, widthDiff, heightDiff);

		this.imageGroup.imageWidth = newWidth;
		this.imageGroup.imageHeight = newHeight;

		const img = this.imageGroup.element.querySelector('.image-content');
		if (img) {
			img.style.width = newWidth + 'px';
			img.style.height = newHeight + 'px';
		}

		this.imageGroup.element.style.left = newLeft + 'px';
		this.imageGroup.element.style.top = newTop + 'px';
	}

	endResize() {
		if (!this.isResizing) return;

		this.isResizing = false;
		this.resizeHandle = null;
		this.resizeStartData = null;

		document.removeEventListener('mousemove', this.boundHandleResize);
		document.removeEventListener('mouseup', this.boundEndResize);
		this.imageGroup.element.classList.remove('resizing');
		this.imageGroup.board.fileManager.saveState();
	}
}

export { ImageGroupResizeHandler };