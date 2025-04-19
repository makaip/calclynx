# CalcLynx

![Website](https://img.shields.io/website?url=https%3A%2F%2Fmakaip.com%2Fmathboard&up_color=00c59a&style=flat-square)​ &nbsp;
![Build Status](https://img.shields.io/github/actions/workflow/status/makaip/mathboard/static.yml?style=flat-square&color=00c59a) &nbsp;
![Last Commit](https://img.shields.io/github/last-commit/makaip/mathboard?style=flat-square&color=00c59a)

CalcLynx is a web-based interactive math board that lets you create, edit, and manage mathematical expressions using a graphical interface. Built using HTML, CSS, JavaScript, and MathQuill, it offers a versatile canvas for creating math groups, editing formulas, and organizing your work with intuitive navigation and file management features.

## Features

### Creating and Editing Math Fields
- **Double-Click on the Canvas:** Creates a new math group at the clicked location.
- **Keyboard Shortcut (<kbd>Shift</kbd>+<kbd>A</kbd>):** Creates a new math field at the current mouse position.
- **Click on a Math Field:** Click to edit an existing math expression.
- **Enter Key (<kbd>Enter</kbd>):** Press to finalize your input. If editing the last math field in a group, a new math field will automatically be added.

### Managing Math Groups
- **Drag-and-Drop:** Click and drag a math group (or multiple selected groups) to move them around.
- **Snapping to Grid:** Hold <kbd>Ctrl</kbd> (or <kbd>Cmd</kbd> on Mac) while dragging to snap math groups to a grid.
- **Box Selection:** Click and drag on an empty area to draw a selection box. Any math group that overlaps with the box will be selected.
- **Cut, Copy, Paste:** Use <kbd>Ctrl</kbd>+<kbd>X</kbd> to cut, <kbd>Ctrl</kbd>+<kbd>C</kbd> to copy, and <kbd>Ctrl</kbd>+<kbd>V</kbd> to paste math groups. Alternatively, use the context menu by right-clicking on the canvas or a math group.

### Using the Hamburger Menu
- **Export JSON:** Click on the "File" menu in the hamburger menu and select "Export JSON" to download the current board state.
- **Import JSON:** Click on the "File" menu and select "Import JSON" to load a previously saved board state.
- **Other Options:** Additional menu options include Undo/Redo and Zoom In/Out under the "Edit" and "View" menus.

### Using the Context Menu
- **Right-Click on the Canvas:** Open the context menu to create a new math group.
- **Right-Click on a Math Group:** Access options to cut, copy, paste, or delete the selected math group(s).

### Keyboard Shortcuts
- <kbd>Ctrl</kbd>+<kbd>Z</kbd>: Undo the last action.
- <kbd>Ctrl</kbd>+<kbd>Y</kbd>: Redo the last undone action.
- <kbd>Shift</kbd>+<kbd>A</kbd>: Add a new math field at the mouse position if no MathQuill field is focused.
- <kbd>Ctrl</kbd>+<kbd>X</kbd>: Cut selected math groups.
- <kbd>Ctrl</kbd>+<kbd>C</kbd>: Copy selected math groups.
- <kbd>Ctrl</kbd>+<kbd>V</kbd>: Paste math groups at the current mouse position.
- <kbd>Backspace</kbd>/<kbd>Delete</kbd>/<kbd>X</kbd>: Remove selected math groups (when not editing a text field).

### Panning and Navigation
- **Canvas Panning:** Click and drag using the middle mouse button or hold the <kbd>Spacebar</kbd> and drag with the left mouse button.
- **Trackpad Navigation:** Use your trackpad's scroll functionality to pan around the canvas.

## Credits

- **MathQuill:** Used for rendering and editing math expressions.
- **jQuery:** For simplified DOM manipulation and event handling.
