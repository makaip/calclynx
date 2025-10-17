class ObjectGroup {
	constructor(board, x, y, data = null, groupType) {
		if (this.constructor === ObjectGroup) {
			throw new Error("ObjectGroup is an abstract class and cannot be instantiated directly");
		}

		if (!board || !board.canvas) {
			throw new Error("ObjectGroup requires a valid board object with a canvas property");
		}

		this.board = board;
		this.groupType = groupType;

		this.element = document.createElement('div');
		this.element.className = `${groupType}-group`;

		const left = data ? data.left : `${x}px`;
		const top = data ? data.top : `${y}px`;
		this.element.style.left = left;
		this.element.style.top = top;

		this.element.tabIndex = -1;
		this.element[`${groupType}Group`] = this; // like element.mathGroup = this

		board.canvas.appendChild(this.element);
	}

	remove() {
		this.element.remove();
		this.board.fileManager.saveState();
	}

	getPosition() {
		return {
			left: this.element.style.left,
			top: this.element.style.top
		};
	}

	setPosition(left, top) {
		this.element.style.left = typeof left === 'number' ? `${left}px` : left;
		this.element.style.top = typeof top === 'number' ? `${top}px` : top;
	}

	addClass(className) {
		this.element.classList.add(className);
	}

	removeClass(className) {
		this.element.classList.remove(className);
	}

	hasClass(className) {
		return this.element.classList.contains(className);
	}

	focus() {
		this.element.focus();
	}

	getBoundingRect() {
		return this.element.getBoundingClientRect();
	}

	select() {
		this.element.classList.add('selected');
	}

	deselect() {
		this.element.classList.remove('selected');
	}

	isSelected() {
		return this.element.classList.contains('selected');
	}

	toggleSelection() {
		this.element.classList.toggle('selected');
		return this.isSelected();
	}

	static getSelectedGroups() {
		return document.querySelectorAll('.math-group.selected, .text-group.selected, .image-group.selected');
	}

	static clearAllSelections() {
		document.querySelectorAll('.math-group.selected, .text-group.selected, .image-group.selected')
			.forEach(group => group.classList.remove('selected'));
	}

	static selectGroups(groupElements) {
		groupElements.forEach(element => element.classList.add('selected'));
	}
}

export { ObjectGroup };
