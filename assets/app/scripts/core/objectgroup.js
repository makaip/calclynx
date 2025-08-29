/**
 * Base class for all object groups (Math, Text, Image)
 * Provides common functionality like positioning, selection, dragging, and removal
 * Follows the Single Responsibility Principle by handling only shared concerns
 */
class ObjectGroup {
  constructor(board, x, y, data = null, groupType) {
    if (this.constructor === ObjectGroup) {
      throw new Error("ObjectGroup is an abstract class and cannot be instantiated directly");
    }
    
    this.board = board;
    this.groupType = groupType;
    
    // Create DOM element with appropriate class
    this.element = document.createElement('div');
    this.element.className = `${groupType}-group`;
    
    // Set position - handle both saved data and new coordinates
    const left = data ? data.left : `${x}px`;
    const top = data ? data.top : `${y}px`;
    this.element.style.left = left;
    this.element.style.top = top;
    
    // Make focusable and link back to instance
    this.element.tabIndex = -1;
    this.element[`${groupType}Group`] = this; // e.g., element.mathGroup = this
    
    // Append to canvas
    board.canvas.appendChild(this.element);
  }

  /**
   * Remove the group from the DOM and save state
   * This method can be overridden by subclasses if additional cleanup is needed
   */
  remove() {
    this.element.remove();
    // Save state after removal
    this.board.fileManager.saveState();
  }

  /**
   * Get the group's position as an object
   * @returns {Object} Position object with left and top properties
   */
  getPosition() {
    return {
      left: this.element.style.left,
      top: this.element.style.top
    };
  }

  /**
   * Set the group's position
   * @param {number|string} left - Left position (with or without 'px')
   * @param {number|string} top - Top position (with or without 'px')
   */
  setPosition(left, top) {
    this.element.style.left = typeof left === 'number' ? `${left}px` : left;
    this.element.style.top = typeof top === 'number' ? `${top}px` : top;
  }

  /**
   * Add a CSS class to the group element
   * @param {string} className - Class name to add
   */
  addClass(className) {
    this.element.classList.add(className);
  }

  /**
   * Remove a CSS class from the group element
   * @param {string} className - Class name to remove
   */
  removeClass(className) {
    this.element.classList.remove(className);
  }

  /**
   * Check if the group has a specific CSS class
   * @param {string} className - Class name to check
   * @returns {boolean} True if class exists
   */
  hasClass(className) {
    return this.element.classList.contains(className);
  }

  /**
   * Focus the group element
   */
  focus() {
    this.element.focus();
  }

  /**
   * Get the bounding rectangle of the group
   * @returns {DOMRect} Bounding rectangle
   */
  getBoundingRect() {
    return this.element.getBoundingClientRect();
  }

  /**
   * Mark this group as selected
   */
  select() {
    this.element.classList.add('selected');
  }

  /**
   * Remove selection from this group
   */
  deselect() {
    this.element.classList.remove('selected');
  }

  /**
   * Check if this group is currently selected
   * @returns {boolean} True if selected
   */
  isSelected() {
    return this.element.classList.contains('selected');
  }

  /**
   * Toggle selection state of this group
   * @returns {boolean} New selection state
   */
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

  /**
   * Static helper to clear all selections
   */
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
