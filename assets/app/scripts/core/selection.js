const BOX_SELECT_STYLE = { position: 'absolute', border: '1px dashed #00c59a', backgroundColor: 'rgba(0, 197, 154, 0.1)', pointerEvents: 'none', };

class BoxSelection {
  constructor(board) {
    this.board = board;
    this.isSelecting = false;
    this.startX = 0;
    this.startY = 0;
    this.element = null;
  }

  init() {
    const canvas = this.board.canvas;

    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || this.board.pan.spaceDown || this.board.drag.active) return;
      if (e.target.closest('.text-editor')) return;
      if (this.isInsideGroup(e.target, canvas)) return;

      this.start(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', (e) => this.update(e));
    document.addEventListener('mouseup', () => this.end());
    canvas.addEventListener('mouseleave', () => this.cancel());
  }

  isInsideGroup(target, canvas) {
    while (target && target !== canvas) {
      if (
        target.classList.contains('math-group') ||
        target.classList.contains('text-group') ||
        target.classList.contains('image-group')
      )
        return true;
      target = target.parentElement;
    }
    return false;
  }

  start(x, y) {
    this.isSelecting = true;
    this.startX = x;
    this.startY = y;
    this.element = this.createElement(x, y);
    document.body.appendChild(this.element);
  }

  update(e) {
    if (!this.isSelecting) return;
    if (this.board.drag.active) return this.cancel();

    this.updateElement(this.element, this.startX, this.startY, e.clientX, e.clientY);
    this.highlightGroups(this.element.getBoundingClientRect());
  }

  end() {
    if (!this.isSelecting) return;
    this.cancel();
    this.board.boxSelect.justCompleted = true;
  }

  cancel() {
    if (this.element) this.element.remove();
    this.isSelecting = false;
    this.element = null;
  }

  createElement(x, y) {
    const el = document.createElement('div');
    Object.assign(el.style, BOX_SELECT_STYLE, { left: `${x}px`, top: `${y}px`, width: '0px', height: '0px' });
    el.className = 'box-select-rect';
    return el;
  }

  updateElement(el, x1, y1, x2, y2) {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    Object.assign(el.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
  }

  highlightGroups(selectionRect) {
    document.querySelectorAll('.math-group, .text-group, .image-group').forEach((group) => {
      const groupRect = group.getBoundingClientRect();
      const overlap =
        groupRect.left < selectionRect.right &&
        groupRect.right > selectionRect.left &&
        groupRect.top < selectionRect.bottom &&
        groupRect.bottom > selectionRect.top;

      group.classList.toggle('selected', overlap);
    });
  }

  static selectGroup(groupElement, isShiftHeld = false) {
    if (isShiftHeld) {
      groupElement.classList.toggle('selected');
    } else {
      ObjectGroup.clearAllSelections();
      groupElement.classList.add('selected');
    }
  }
}