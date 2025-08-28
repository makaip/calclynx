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
  
    // Check if the right-click is on a math group, text group, or image group element.
    const targetMathGroupElement = e.target.closest('.math-group');
    const targetTextGroupElement = e.target.closest('.text-group');
    const targetImageGroupElement = e.target.closest('.image-group');
    const targetGroupElement = targetMathGroupElement || targetTextGroupElement || targetImageGroupElement;
    const isAnythingSelected = !!document.querySelector('.math-group.selected, .text-group.selected, .image-group.selected');
    const canPerformClipboardAction = targetGroupElement || isAnythingSelected;
    const canPaste = window.mathBoard && window.mathBoard.clipboard;
  
    // Convert the screen coordinates to canvas coordinates.
    const canvasCoords = window.mathBoard
      ? window.mathBoard.screenToCanvas(e.pageX, e.pageY)
      : { x: e.pageX, y: e.pageY };
  
    // Build the menu items array.
    const menuItems = [
      {
        label: 'New Math Stack',
        action: () => {
          new MathGroup(window.mathBoard, canvasCoords.x, canvasCoords.y);
          window.mathBoard.fileManager.saveState();
        }
      },
      {
        label: 'New Text Stack',
        action: () => {
          new TextGroup(window.mathBoard, canvasCoords.x, canvasCoords.y);
          window.mathBoard.fileManager.saveState();
        }
      },
      {
        label: 'New Image from URL',
        action: () => {
          window.imageUrlInput.show((url) => {
            const imageGroup = new ImageGroup(window.mathBoard, canvasCoords.x, canvasCoords.y);
            imageGroup.setImageUrl(url);
          });
        }
      },
      { separator: true },
      {
        label: 'Cut',
        disabled: !canPerformClipboardAction,
        action: () => {
          if (targetGroupElement && !targetGroupElement.classList.contains('selected')) {
            // If right-clicked on a non-selected group, select only it before cutting
            document.querySelectorAll('.math-group.selected, .text-group.selected, .image-group.selected').forEach(g => g.classList.remove('selected'));
            targetGroupElement.classList.add('selected');
          }
          window.mathBoard.cutSelectedGroups();
        }
      },
      {
        label: 'Copy',
        disabled: !canPerformClipboardAction,
        action: () => {
           if (targetGroupElement && !targetGroupElement.classList.contains('selected')) {
             // If right-clicked on a non-selected group, select only it before copying
             document.querySelectorAll('.math-group.selected, .text-group.selected, .image-group.selected').forEach(g => g.classList.remove('selected'));
             targetGroupElement.classList.add('selected');
           }
           window.mathBoard.copySelectedGroups();
        }
      },
      {
        label: 'Paste',
        disabled: !canPaste,
        action: () => {
          window.mathBoard.pasteGroups(); // Paste uses internal mouse coords
        }
      },
      { separator: true },
      {
        label: 'Delete',
        disabled: !canPerformClipboardAction, // Disable if nothing is selected or targeted
        action: () => {
          if (targetGroupElement && !targetGroupElement.classList.contains('selected')) {
            // If right-clicked on a non-selected group, delete only it
             targetGroupElement.remove();
          } else {
            // Otherwise, delete all selected groups (math, text, and image).
            const selectedGroups = document.querySelectorAll('.math-group.selected, .text-group.selected, .image-group.selected');
            selectedGroups.forEach(group => group.remove());
          }
          window.mathBoard.fileManager.saveState();
        }
      }
    ];
  
    contextMenu.show(e.pageX, e.pageY, menuItems);
  });
