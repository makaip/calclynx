/**
 * Base class for all object groups (Math, Text, Image)
 */

class ObjectGroup {
  constructor(board, x, y, data = null, groupType) {
    if (this.constructor === ObjectGroup) {
      throw new Error("ObjectGroup is an abstract class and cannot be instantiated directly");
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

  /**
   * Static helper to get all selected groups of any type
   * @returns {NodeList} All selected group elements
   */
  static getSelectedGroups() {
    return document.querySelectorAll('.math-group.selected, .text-group.selected, .image-group.selected');
  }

  static clearAllSelections() {
    document.querySelectorAll('.math-group.selected, .text-group.selected, .image-group.selected')
      .forEach(group => group.classList.remove('selected'));
  }

  /**
   * Static helper to select multiple groups
   * @param {Array<Element>} groupElements - Array of group elements to select
   */
  static selectGroups(groupElements) {
    groupElements.forEach(element => element.classList.add('selected'));
  }
}
