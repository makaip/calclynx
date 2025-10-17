import { ObjectGroup } from './objectgroup.js';
import { TextGroup } from '../text/textgroup.js';
import { MathGroup } from '../math/mathgroup.js';
import { ImageGroup } from '../image/imagegroup.js';

class Clipboard {
	constructor(mathBoard) {
		this.mathBoard = mathBoard;
		this.clipboardData = null;
	}

	copySelectedGroups() {
		const selectedGroups = Array.from(ObjectGroup.getSelectedGroups());
		if (selectedGroups.length === 0) {
			this.clipboardData = null;
			return;
		}

		let minX = Infinity;
		let minY = Infinity;

		selectedGroups.forEach(group => {
			const left = parseInt(group.style.left, 10);
			const top = parseInt(group.style.top, 10);
			if (left < minX) minX = left;
			if (top < minY) minY = top;
		});

		this.clipboardData = selectedGroups.map(group => {
			const left = parseInt(group.style.left, 10);
			const top = parseInt(group.style.top, 10);

			if (group.classList.contains('math-group')) {
				const fields = [];
				group.querySelectorAll('.math-field-container').forEach(container => {
					if (container.dataset.latex) {
						fields.push(container.dataset.latex);
					}
				});

				return {
					type: 'math',
					relativeLeft: left - minX,
					relativeTop: top - minY,
					fields
				};
			} else if (group.classList.contains('text-group')) {
				const fields = [];
				let widthData = null;
				const container = group.querySelector('.text-field-container');
				if (container && container.textFieldInstance) {
					fields.push(container.textFieldInstance.getContent());

					if (container.textFieldInstance.getWidthData) {
						widthData = container.textFieldInstance.getWidthData();
					}
				}

				const result = {
					type: 'text',
					relativeLeft: left - minX,
					relativeTop: top - minY,
					fields
				};

				if (widthData) {
					result.widthData = widthData;
				}

				return result;
			} else if (group.classList.contains('image-group')) {
				return {
					type: 'image',
					relativeLeft: left - minX,
					relativeTop: top - minY,
					imageUrl: group.imageGroup.imageUrl,
					imageWidth: group.imageGroup.imageWidth,
					imageHeight: group.imageGroup.imageHeight
				};
			}
		});
	}

	cutSelectedGroups() {
		this.copySelectedGroups();
		if (!this.clipboardData) return;
		const selectedGroups = ObjectGroup.getSelectedGroups();
		selectedGroups.forEach(group => group.remove());
		this.mathBoard.fileManager.saveState();
	}

	pasteGroups() {
		if (!this.clipboardData) return;

		ObjectGroup.clearAllSelections();

		const pasteCenterCoords = this.mathBoard.screenToCanvas(this.mathBoard.mouse.x, this.mathBoard.mouse.y);
		const pasteBaseX = pasteCenterCoords.x;
		const pasteBaseY = pasteCenterCoords.y;

		const pastedGroups = [];
		this.clipboardData.forEach(groupData => {
			const newLeft = pasteBaseX + groupData.relativeLeft;
			const newTop = pasteBaseY + groupData.relativeTop;
			const data = {
				left: `${newLeft}px`,
				top: `${newTop}px`,
				fields: groupData.fields,
				imageUrl: groupData.imageUrl,
				imageWidth: groupData.imageWidth,
				imageHeight: groupData.imageHeight,
				widthData: groupData.widthData
			};

			let newGroupInstance;

			switch (groupData.type) {
				case 'text':
					newGroupInstance = new TextGroup(this.mathBoard, 0, 0, data);
					break;
				case 'math':
					newGroupInstance = new MathGroup(this.mathBoard, 0, 0, data);
					break;
				case 'image':
					newGroupInstance = new ImageGroup(this.mathBoard, 0, 0, data);
					break;
				default:
					console.warn('Unknown group type:', groupData.type);
					return;
			}
			pastedGroups.push(newGroupInstance.element);
		});

		pastedGroups.forEach(groupEl => groupEl.classList.add('selected'));
		this.mathBoard.fileManager.saveState();
	}

	hasClipboardData() {
		return this.clipboardData !== null;
	}

	clearClipboard() {
		this.clipboardData = null;
	}
}

export { Clipboard };