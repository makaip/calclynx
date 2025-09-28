import { ObjectGroup } from '../core/objectgroup.js';
import { MathGroup } from '../math/mathgroup.js';
import { TextGroup } from '../text/textgroup.js';
import { ImageGroup } from '../image/imagegroup.js';
import { App } from '../core/main.js';

class ContextMenu {
    constructor(menuElement) {
      this.menuElement = menuElement;
      document.addEventListener('click', () => this.hide());
      window.addEventListener('resize', () => this.hide());
    }
  
    show(x, y, items) {
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

document.addEventListener('DOMContentLoaded', () => {
  const contextMenu = new ContextMenu(document.getElementById('context-menu'));
  
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  
    // Check if the right-click is on a math group, text group, or image group element.
    const targetMathGroupElement = e.target.closest('.math-group');
    const targetTextGroupElement = e.target.closest('.text-group');
    const targetImageGroupElement = e.target.closest('.image-group');
    const targetGroupElement = targetMathGroupElement || targetTextGroupElement || targetImageGroupElement;
    const isAnythingSelected = ObjectGroup.getSelectedGroups().length > 0;
    const canPerformClipboardAction = targetGroupElement || isAnythingSelected;
    const canPaste = App?.mathBoard && App.mathBoard.clipboard;
  
    // Convert the screen coordinates to canvas coordinates.
    const canvasCoords = App?.mathBoard
      ? App.mathBoard.screenToCanvas(e.pageX, e.pageY)
      : { x: e.pageX, y: e.pageY };
  
    // Build the menu items array.
    const menuItems = [
      {
        label: 'New Math Stack',
        action: () => {
          if (!App?.mathBoard) return;
          new MathGroup(App.mathBoard, canvasCoords.x, canvasCoords.y);
          App.mathBoard.fileManager.saveState();
        }
      },
      {
        label: 'New Text Stack',
        action: () => {
          if (!App?.mathBoard) return;
          new TextGroup(App.mathBoard, canvasCoords.x, canvasCoords.y);
          App.mathBoard.fileManager.saveState();
        }
      },
      {
        label: 'New Image from URL',
        action: () => {
          if (!App?.mathBoard) return;
          window.showImageUrlModal((url) => {
            const imageGroup = new ImageGroup(App.mathBoard, canvasCoords.x, canvasCoords.y);
            imageGroup.setImageUrl(url);
            App.mathBoard.fileManager.saveState();
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
            ObjectGroup.clearAllSelections();
            targetGroupElement.classList.add('selected');
          }
          if (!App?.mathBoard) return;
          App.mathBoard.cutSelectedGroups();
        }
      },
      {
        label: 'Copy',
        disabled: !canPerformClipboardAction,
        action: () => {
           if (targetGroupElement && !targetGroupElement.classList.contains('selected')) {
             // If right-clicked on a non-selected group, select only it before copying
             ObjectGroup.clearAllSelections();
             targetGroupElement.classList.add('selected');
           }
           if (!App?.mathBoard) return;
           App.mathBoard.copySelectedGroups();
        }
      },
      {
        label: 'Paste',
        disabled: !canPaste,
        action: () => {
          if (!App?.mathBoard) return;
          App.mathBoard.pasteGroups(); 
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
            const selectedGroups = ObjectGroup.getSelectedGroups();
            selectedGroups.forEach(group => group.remove());
          }
          if (!App?.mathBoard) return;
          App.mathBoard.fileManager.saveState();
        }
      }
    ];
  
    contextMenu.show(e.pageX, e.pageY, menuItems);
  });
});

export { ContextMenu };
