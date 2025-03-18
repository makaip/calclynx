class ContextMenu {
    constructor(menuElement) {
      this.menuElement = menuElement;
      // Hide the menu if clicking anywhere outside or on window resize.
      document.addEventListener('click', () => this.hide());
      window.addEventListener('resize', () => this.hide());
    }
  
    show(x, y, items) {
      // Clear any existing menu items.
      this.menuElement.innerHTML = '';
  
      items.forEach(item => {
        if (item.separator) {
          const sep = document.createElement('div');
          sep.className = 'context-menu-separator';
          this.menuElement.appendChild(sep);
        } else {
          const menuItem = document.createElement('div');
          menuItem.className = 'context-menu-item';
          menuItem.textContent = item.label;
          if (item.disabled) {
            menuItem.classList.add('disabled');
          }
          menuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!item.disabled && item.action) {
              item.action();
            }
            this.hide();
          });
          this.menuElement.appendChild(menuItem);
        }
      });
  
      // Adjust position if the menu might overflow the viewport.
      const menuRect = this.menuElement.getBoundingClientRect();
      if (x + menuRect.width > window.innerWidth) {
        x = window.innerWidth - menuRect.width - 10;
      }
      if (y + menuRect.height > window.innerHeight) {
        y = window.innerHeight - menuRect.height - 10;
      }
      this.menuElement.style.left = x + 'px';
      this.menuElement.style.top = y + 'px';
      this.menuElement.style.display = 'block';
    }
  
    hide() {
      this.menuElement.style.display = 'none';
    }
  }
  
  // Initialize the context menu.
  const contextMenu = new ContextMenu(document.getElementById('context-menu'));
  
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  
    // Check if the right-click is on a math group element.
    const targetGroupElement = e.target.closest('.math-group');
    // Convert the screen coordinates to canvas coordinates.
    const canvasCoords = window.mathBoard
      ? window.mathBoard.screenToCanvas(e.pageX, e.pageY)
      : { x: e.pageX, y: e.pageY };
  
    // Build the menu items array.
    const menuItems = [
      {
        label: 'New Stack',
        action: () => {
          new MathGroup(window.mathBoard, canvasCoords.x, canvasCoords.y);
          window.mathBoard.fileManager.saveState();
        }
      },
      { separator: true },
      {label: 'Cut', disabled: true},
      {label: 'Copy', disabled: true},
      {label: 'Paste', disabled: true},
      { separator: true },
      {
        label: 'Delete',
        action: () => {
          if (targetGroupElement) {
            // Delete the math group that was right-clicked.
            targetGroupElement.mathGroup.remove();
          } else {
            // Otherwise, delete all selected math groups.
            const selectedGroups = document.querySelectorAll('.math-group.selected');
            selectedGroups.forEach(group => group.remove());
          }
          if (window.mathBoard) {
            window.mathBoard.fileManager.saveState();
          }
        }
      }
    ];
  
    contextMenu.show(e.pageX, e.pageY, menuItems);
  });
  