class TextFieldResizeHandler {
	constructor(textField) {
		this.textField = textField;
		this.isResizing = false;
		this.resizeHandle = null;
		this.resizeStartData = null;
		this.isFixedWidth = false;

		this.boundHandleResize = this.handleResize.bind(this);
		this.boundEndResize = this.endResize.bind(this);
	}

	createResizeHandles(container) {
		container.querySelectorAll('.text-resize-handle').forEach(h => h.remove());

		const createHandle = (position) => {
			const handle = document.createElement('div');
			handle.className = `text-resize-handle text-resize-handle-${position}`;
			handle.innerHTML = '||';
			handle.title = 'Drag to resize width';
			handle.dataset.position = position;
			handle.addEventListener('mousedown', (e) => this.startResize(e, position));
			handle.addEventListener('click', (e) => this.handleHandleClick(e, position));
			return handle;
		};

		container.appendChild(createHandle('left'));
		container.appendChild(createHandle('right'));

		this.setupVisibilityListeners(container);
		this.updateHandleVisibility();
	}

	setupVisibilityListeners() {
		const textGroup = this.textField.textGroup.element;

		const observer = new MutationObserver(() => {
			this.updateHandleVisibility();
		});

		observer.observe(textGroup, {
			attributes: true,
			attributeFilter: ['class']
		});

		textGroup.addEventListener('mouseenter', () => {
			this.updateHandleVisibility();
		});

		textGroup.addEventListener('mouseleave', () => {
			this.updateHandleVisibility();
		});

		this.visibilityObserver = observer;
	}

	handleHandleClick(e) {
		if (e.altKey) {
			e.preventDefault();
			e.stopPropagation();
			this.toggleFreeWidth();
		}
	}

	toggleFreeWidth() {
		this.isFixedWidth = !this.isFixedWidth;

		if (!this.isFixedWidth) {
			const editor = this.textField.editorElement;
			if (editor) {
				editor.style.width = '';
				editor.style.minWidth = '';
				editor.style.maxWidth = '';
			}
		} else {
			const editor = this.textField.editorElement;
			if (editor) {
				const currentWidth = editor.getBoundingClientRect().width;
				editor.style.width = `${currentWidth}px`;
				editor.style.minWidth = `${currentWidth}px`;
				editor.style.maxWidth = `${currentWidth}px`;
			}
		}

		this.updateHandleVisibility();
		this.textField.textGroup.board.fileManager.saveState();
	}

	updateHandleVisibility() {
		const container = this.textField.container;
		const textGroup = this.textField.textGroup.element;
		const handles = container.querySelectorAll('.text-resize-handle');

		handles.forEach(handle => {
			if (this.isFixedWidth && textGroup.matches(':hover')) {
				handle.style.display = 'flex';
				handle.style.opacity = '1';
			} else {
				handle.style.display = 'none';
			}
		});
	}

	startResize(e, position) {
		e.preventDefault();
		e.stopPropagation();

		if (!this.isFixedWidth) return;

		this.isResizing = true;
		this.resizeHandle = position;

		const editor = this.textField.editorElement;
		const container = this.textField.container;
		const textGroup = this.textField.textGroup;
		const editorRect = editor.getBoundingClientRect();
		const containerRect = container.getBoundingClientRect();

		this.resizeStartData = {
			startX: e.clientX,
			startWidth: editorRect.width,
			containerLeft: containerRect.left,
			containerWidth: containerRect.width,
			textGroupX: parseFloat(textGroup.element.style.left) || 0,
			minWidth: 100,
			maxWidth: window.innerWidth * 0.8
		};

		document.addEventListener('mousemove', this.boundHandleResize);
		document.addEventListener('mouseup', this.boundEndResize);

		container.classList.add('text-resizing');
		document.body.classList.add('text-resize-cursor');
	}

	handleResize(e) {
		if (!this.isResizing || !this.resizeStartData) return;

		e.preventDefault();

		const deltaX = e.clientX - this.resizeStartData.startX;
		const snapToGrid = e.ctrlKey || e.metaKey;
		const gridSize = this.textField.textGroup.board.drag.gridSize || 20;

		let newWidth;
		let newPos;

		if (this.resizeHandle === 'right') {
			newWidth = this.resizeStartData.startWidth + deltaX;
			if (snapToGrid) newWidth = Math.round(newWidth / gridSize) * gridSize;

		} else { // left handle
			newWidth = this.resizeStartData.startWidth - deltaX;
			newPos = this.resizeStartData.textGroupX + deltaX;

			if (snapToGrid) {
				newPos = Math.round(newPos / gridSize) * gridSize;
				newWidth = Math.round(newWidth / gridSize) * gridSize;
			}

			if (newPos < 0) {
				newPos = 0;
				newWidth = this.resizeStartData.startWidth + this.resizeStartData.textGroupX;
			}

			if (newWidth < this.resizeStartData.minWidth) {
				newWidth = this.resizeStartData.minWidth;
				const maxPos = this.resizeStartData.textGroupX + (this.resizeStartData.startWidth - this.resizeStartData.minWidth);
				newPos = Math.min(newPos, maxPos);
			}
		}

		newWidth = Math.max(this.resizeStartData.minWidth, Math.min(newWidth, this.resizeStartData.maxWidth));

		const editor = this.textField.editorElement;
		if (editor) {
			editor.style.width = `${newWidth}px`;
			editor.style.minWidth = `${newWidth}px`;
			editor.style.maxWidth = `${newWidth}px`;
		}

		if (this.resizeHandle === 'left' && newPos !== undefined) {
			const textGroup = this.textField.textGroup;
			const currentTop = parseFloat(textGroup.element.style.top) || 0;
			textGroup.setPosition(newPos, currentTop);
		}
	}

	endResize() {
		if (!this.isResizing) return;

		this.isResizing = false;
		this.resizeHandle = null;
		this.resizeStartData = null;

		document.removeEventListener('mousemove', this.boundHandleResize);
		document.removeEventListener('mouseup', this.boundEndResize);

		const container = this.textField.container;
		container.classList.remove('text-resizing');
		document.body.classList.remove('text-resize-cursor');

		this.textField.textGroup.board.fileManager.saveState();
	}

	getWidthData() {
		if (!this.isFixedWidth) {
			return null;
		}

		const editor = this.textField.editorElement;
		if (editor) {
			return {
				isFixedWidth: this.isFixedWidth,
				width: parseFloat(editor.style.width) || null
			};
		}

		return null;
	}

	setWidthData(data) {
		if (!data) {
			this.isFixedWidth = false;
			this.updateHandleVisibility();
			return;
		}

		this.isFixedWidth = data.isFixedWidth || false;

		if (this.isFixedWidth && data.width && data.width > 0) {
			const editor = this.textField.editorElement;
			if (editor) {
				editor.style.width = `${data.width}px`;
				editor.style.minWidth = `${data.width}px`;
				editor.style.maxWidth = `${data.width}px`;
			}
		}

		this.updateHandleVisibility();
	}

	destroy() {
		if (this.isResizing) {
			document.removeEventListener('mousemove', this.boundHandleResize);
			document.removeEventListener('mouseup', this.boundEndResize);
		}

		if (this.visibilityObserver) {
			this.visibilityObserver.disconnect();
		}

		if (this.textField.container) {
			this.textField.container.querySelectorAll('.text-resize-handle').forEach(h => h.remove());
		}
	}
}

export { TextFieldResizeHandler };