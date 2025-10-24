import { FileManager } from '../file/filemanager.js';
import { ObjectGroup } from './objectgroup.js';
import { BoxSelection } from './selection.js';
import { Clipboard } from './clipboard.js';
import { Navigation } from './navigation.js';
// import { MathFieldEditor } from '../math/mathfield-editor.js';
import { TextGroup } from '../text/textgroup.js';
import { MathGroup } from '../math/mathgroup.js';

class MathBoard {
	constructor() {
		this.canvas = document.getElementById('canvas');
		this.mouse = { x: 0, y: 0 };

		this.canvasState = {
			offset: { x: 0, y: 0 },
			initialOffset: { x: -10000, y: -10000 },
			scale: 1
		};

		this.pan = {
			active: false,
			start: { x: 0, y: 0 },
			spaceDown: false
		};

		this.drag = {
			active: false,
			group: null,
			offset: { x: 0, y: 0 },
			margin: 10,
			gridSize: 20
		};

		this.boxSelect = {
			active: false,
			start: { x: 0, y: 0 },
			element: null,
			justCompleted: false
		};

		this.fileManager = new FileManager(this);
		this.clipboard = new Clipboard(this);
		this.initEventListeners();

		this.fileManager.loadState();
		this.navigation = new Navigation(this);
		this.navigation.init();
	}

	initEventListeners() {
		this.initGlobalKeyHandlers();
		this.initDocumentClickHandler();
		this.initGroupDragging();
		this.initWindowResizeHandler();
		this.initDoubleClickHandler();
	}

	initGlobalKeyHandlers() {
		document.addEventListener('keydown', (e) => this.handleKeyDown(e));
		document.addEventListener('keyup', (e) => this.handleKeyUp(e));
	}

	handleKeyDown(e) {
		if (e.code === 'Space') this.pan.spaceDown = true;
		this.handleDeleteKeys(e);
		this.handleCtrlCommands(e);
	}

	handleKeyUp(e) {
		if (e.code === 'Space') this.pan.spaceDown = false;
	}

	handleDeleteKeys(e) {
		const isDeleteKey = e.key === 'Backspace' || e.key === 'Delete';
		const hasModifiers = e.ctrlKey || e.altKey || e.metaKey;
		const isEditingMath = document.querySelector('.mq-focused');
		const isEditingText = document.activeElement.closest('.text-editor');

		if (!isDeleteKey || hasModifiers || isEditingMath || isEditingText) {
			return;
		}

		const selectedGroups = ObjectGroup.getSelectedGroups();
		if (selectedGroups.length > 0) {
			e.preventDefault();
			this.deleteSelectedGroups(selectedGroups);
		}
	}

	handleCtrlCommands(e) {
		if (!(e.ctrlKey || e.metaKey)) return;
		if (this.isUserCurrentlyEditing()) return;

		switch (e.key) {
			case 'c':
				e.preventDefault();
				this.clipboard.copySelectedGroups();
				break;
			case 'x':
				e.preventDefault();
				this.clipboard.cutSelectedGroups();
				break;
			case 'v':
				e.preventDefault();
				this.clipboard.pasteGroups();
				break;
		}
	}

	isUserCurrentlyEditing() {
		const isTextEditorFocused = document.activeElement &&
			(document.activeElement.closest('.text-editor') ||
				document.activeElement.classList.contains('text-editor'));
		const isMathFieldFocused = document.querySelector('.mq-focused');
		const isImageUrlInputFocused = document.activeElement &&
			document.activeElement.closest('.image-url-input');

		const isModalInputFocused = document.activeElement &&
			(document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') &&
			document.activeElement.closest('.modal');

		return isTextEditorFocused || isMathFieldFocused || isImageUrlInputFocused || isModalInputFocused;
	}

	deleteSelectedGroups(groups) {
		groups.forEach((group) => group.remove());
		this.fileManager.saveState();
	}

	initDocumentClickHandler() {
		document.addEventListener('click', (event) => {
			if (this.boxSelect.justCompleted) {
				this.boxSelect.justCompleted = false;
				return;
			}

			const clickHandlers = [
				() => this.handleEditableFieldClick(event),
				() => this.handleContainerClick(event),
				() => this.handleGroupClick(event)
			];

			for (const handler of clickHandlers) {
				if (handler()) return;
			}

			ObjectGroup.clearAllSelections();
		});
	}

	handleEditableFieldClick(event) {
		if (event.target.closest('.mq-editable-field') ||
			event.target.closest('.text-editor')) {
			return true;
		}
		return false;
	}

	handleContainerClick(event) {
		const containers = [
			/*{
				selector: '.math-field-container',
				action: (container) => MathFieldEditor.edit(container)
			},*/
			{
				selector: '.text-field-container',
				action: (container) => {

					container.textFieldInstance?.focus();
				}
			},
			{
				selector: '.image-container',
				action: (container) => {
					const imageGroup = container.closest('.image-group');
					if (imageGroup) {
						BoxSelection.selectGroup(imageGroup, event.shiftKey);
					}
				}
			}
		];

		for (const { selector, action } of containers) {
			const container = event.target.closest(selector);
			if (container) {
				if (!container.classList.contains('text-field-container')) {
					ObjectGroup.clearAllSelections();
				}
				event.stopPropagation();
				action(container);
				return true;
			}
		}

		this.cleanupContainerSelections(event);
		return false;
	}

	cleanupContainerSelections(event) {
		const containerSelectors = ['.math-field-container', '.text-field-container', '.image-container'];
		const isOutsideContainers = !containerSelectors.some(selector =>
			event.target.closest(selector)
		);

		if (isOutsideContainers) {
			document.querySelectorAll('.math-field-container.selected-field')
				.forEach(el => el.classList.remove('selected-field'));
		}
	}

	handleGroupClick(event) {
		const groupSelectors = ['.math-group', '.text-group', '.image-group'];
		const groupTarget = groupSelectors
			.map(selector => event.target.closest(selector))
			.find(Boolean);

		if (groupTarget) {
			BoxSelection.selectGroup(groupTarget, event.shiftKey);
			return true;
		}
		return false;
	}

	initGroupDragging() {
		document.addEventListener('mousedown', (event) => {
			// Ignore if not left click, if space is down, or if clicking inside an editable field
			if (event.button !== 0 ||
				this.pan.spaceDown ||
				event.target.closest('.mq-editable-field') ||
				event.target.closest('.text-editor')) return;
			// Ignore clicks starting on the field drag handle
			if (event.target.closest('.drag-handle')) return;

			let target = event.target;
			while (target && !target.classList.contains('math-group') &&
				!target.classList.contains('text-group') &&
				!target.classList.contains('image-group')) {
				target = target.parentElement;
			}

			if (target && (
				target.classList.contains('math-group') ||
				target.classList.contains('text-group') ||
				target.classList.contains('image-group'))) {

				let groups;
				if (target.classList.contains('selected')) {
					groups = Array.from(ObjectGroup.getSelectedGroups());
				} else {
					groups = [target];
				}

				this.drag.active = true;
				this.selectedGroups = groups;
				this.dragStart = { x: event.clientX, y: event.clientY };
				this.initialPositions = groups.map((group) => {
					const screenPos = { x: parseInt(group.style.left, 10), y: parseInt(group.style.top, 10) };
					const canvasPos = this.screenToCanvas(screenPos.x, screenPos.y);
					return {
						group: group,
						left: screenPos.x,
						top: screenPos.y,
						canvasLeft: canvasPos.x,
						canvasTop: canvasPos.y
					};
				});

				groups.forEach((group) => group.classList.add('dragging'));
				event.stopPropagation();
			}

			if (!target) {
				ObjectGroup.clearAllSelections();
			}
		});

		document.addEventListener('mousemove', (event) => {
			this.mouse.x = event.clientX;
			this.mouse.y = event.clientY;

			if (this.drag.active && this.selectedGroups) {
				const screenDeltaX = event.clientX - this.dragStart.x;
				const screenDeltaY = event.clientY - this.dragStart.y;

				const canvasDeltaX = screenDeltaX / this.canvasState.scale;
				const canvasDeltaY = screenDeltaY / this.canvasState.scale;

				const snapToGrid = event.ctrlKey || event.metaKey;

				this.initialPositions.forEach((item) => {
					let newCanvasX = item.canvasLeft + canvasDeltaX;
					let newCanvasY = item.canvasTop + canvasDeltaY;

					if (snapToGrid) {
						newCanvasX = Math.round(newCanvasX / this.drag.gridSize) * this.drag.gridSize;
						newCanvasY = Math.round(newCanvasY / this.drag.gridSize) * this.drag.gridSize;
					}

					const screenCoords = this.canvasToScreen(newCanvasX, newCanvasY);
					item.group.style.left = `${screenCoords.x}px`;
					item.group.style.top = `${screenCoords.y}px`;
				});
			}
		});

		document.addEventListener('mouseup', () => {
			if (this.drag.active && this.selectedGroups) {
				this.selectedGroups.forEach((group) => group.classList.remove('dragging'));
				this.drag.active = false;
				this.selectedGroups = null;
				this.initialPositions = null;
				this.fileManager.saveState();
			}
		});
	}

	initDoubleClickHandler() {
		document.addEventListener('dblclick', (event) => {
			if (event.target.closest('.math-group') ||
				event.target.closest('.text-group') ||
				event.target.closest('.image-group')) return;
			if (this.pan.active) return;
			const coords = this.screenToCanvas(event.clientX, event.clientY);

			if (event.shiftKey) {
				new TextGroup(this, coords.x, coords.y);
			} else {
				new MathGroup(this, coords.x, coords.y);
			}

			this.fileManager.saveState();
		});
	}

	initWindowResizeHandler() {
		window.addEventListener('resize', () => {
			this.updateTransform();
		});
	}

	updateTransform() {
		const scale = this.canvasState.scale || 1;
		const tx = (this.canvasState.initialOffset.x + this.canvasState.offset.x);
		const ty = (this.canvasState.initialOffset.y + this.canvasState.offset.y);
		this.canvas.style.transformOrigin = '0 0';
		this.canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
	}

	screenToCanvas(x, y) {
		return {
			x: (x - (this.canvasState.initialOffset.x + this.canvasState.offset.x)) / this.canvasState.scale,
			y: (y - (this.canvasState.initialOffset.y + this.canvasState.offset.y)) / this.canvasState.scale,
		};
	}

	canvasToScreen(x, y) {
		return {
			x: (x * this.canvasState.scale) + (this.canvasState.initialOffset.x + this.canvasState.offset.x),
			y: (y * this.canvasState.scale) + (this.canvasState.initialOffset.y + this.canvasState.offset.y),
		};
	}
}

export { MathBoard };
