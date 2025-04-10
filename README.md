# MathBoard

Calclinx is a web-based interactive math board that lets you create, edit, and manage mathematical expressions using a graphical interface. Built using HTML, CSS, JavaScript, and MathQuill, it offers a versatile canvas for creating math groups, editing formulas, and organizing your work with intuitive navigation and file management features.

## Features

- **Interactive Canvas:** A huge canvas with a dotted background for infinite drawing and positioning.
- **Math Groups:** Create movable groups of math fields that can contain one or more math expressions.
- **Math Field Editing:** Use MathQuill for interactive math field input and static rendering.
- **Drag-and-Drop:** Easily move math groups by clicking and dragging.
- **Box Selection:** Select multiple math groups by clicking and dragging a selection box.
- **Undo/Redo:** Keyboard shortcuts (Ctrl+Z for undo, Ctrl+Y for redo) to revert or reapply changes.
- **Export/Import JSON:** Save your current math board state to a JSON file or import a previously saved state.
- **Responsive Navigation:** Panning and zooming of the canvas with mouse, spacebar, or trackpad.

## How to Use the Web App

### Creating and Editing Math Fields
- **Double-Click on the Canvas:** Creates a new math group at the clicked location.
- **Keyboard Shortcut (Shift+A):** Creates a new math field at the current mouse position.
- **Click on a Math Field:** Click to edit an existing math expression.
- **Enter Key:** Press to finalize your input. If editing the last math field in a group, a new math field will automatically be added.

### Managing Math Groups
- **Drag-and-Drop:** Click and drag a math group (or multiple selected groups) to move them around.
- **Box Selection:** Click and drag on an empty area to draw a selection box. Any math group that overlaps with the box will be selected.

### Using the Hamburger Menu
- **Export JSON:** Click on the "File" menu in the hamburger menu and select "Export JSON" to download the current board state.
- **Import JSON:** Click on the "File" menu and select "Import JSON" to load a previously exported board state.
- **Other Options:** Additional menu options include Undo/Redo and Zoom In/Out under the "Edit" and "View" menus.

### Keyboard Shortcuts
- **Ctrl+Z:** Undo the last action.
- **Ctrl+Y:** Redo the last undone action.
- **Shift+A:** Add a new math field at the mouse position if no MathQuill field is focused.
- **Backspace/Delete:** Remove selected math groups (when not editing a text field).

### Panning and Navigation
- **Canvas Panning:** Click and drag using the middle mouse button or hold the spacebar and drag with the left mouse button.
- **Trackpad Navigation:** Use your trackpad's scroll functionality to pan around the canvas.

## Credits

- **MathQuill:** Used for rendering and editing math expressions.
- **jQuery:** For simplified DOM manipulation and event handling.
- **Custom Code:** Developed to provide an intuitive interface for managing math groups and fields.

## License

This project is licensed under the MIT License.


# To-Do List  

- **Bug:** If you write one line and then click off, it deletes the stack.  
- **Feature:** Allow reordering of stack lines.  
- **Visualization:** Draw a connected line between equivalent expressions, like:  
```
╭─
│
├─
╰─
```
- **Editing Tools:**  
    - Undo & redo  
    - Cut, copy, paste  
- **Storage:** Cloud storage integration.  
- **Authentication:** Implement OAuth2.  
- Make a landing page