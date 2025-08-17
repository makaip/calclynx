# CalcLynx

![Website](https://img.shields.io/website?url=https%3A%2F%2Fmakaip.com%2Fcalclynx&up_color=00c59a&style=flat-square)​ &nbsp;
![Build Status](https://img.shields.io/github/actions/workflow/status/makaip/calclynx/static.yml?style=flat-square&color=00c59a) &nbsp;
![Last Commit](https://img.shields.io/github/last-commit/makaip/calclynx?style=flat-square&color=00c59a)

CalcLynx is a web-based interactive math board that lets you create, edit, and manage mathematical expressions using a graphical interface. Built using HTML, CSS, JavaScript, and MathQuill, it offers a versatile canvas for creating math groups, editing formulas, and organizing your work with intuitive navigation and file management features.

## Core interactions

- Double-click on the canvas:
	- Regular double-click (left button) creates a new math group at the clicked canvas coordinates. 
	- <kbd>Shift</kbd> + double-click creates a new text area.

- Selecting groups:
	- Click a math group or text group to select it. Clicking an empty area clears selection.
	- <kbd>Shift</kbd> + click toggles selection of the clicked group (multi-select).

- Box selection:
	- Click and drag on an empty area of the canvas (left mouse) to draw a dashed selection box. 

- Dragging groups:
	- Click and drag a group (left mouse) to move it. If a clicked group is part of the current selection, all selected groups move together.
	- While dragging, hold <kbd>Ctrl</kbd> (Windows/Linux) or <kbd>Command</kbd> (Mac) to snap movement to grid. 

- Deleting selected groups (global keys):
	- When no MathQuill field or text editor is focused, pressing <kbd>Backspace</kbd>, <kbd>Delete</kbd>, or the character <kbd>x</kbd> will remove all selected groups. 

## Math field behavior

- Editable vs finalized fields:
	- Math fields start as editable and are finalized on <kbd>Enter</kbd> or blur. 

- Creating and moving fields inside a math group:
	- Press <kbd>Enter</kbd> while editing a math field to finalize it. If it was the last math field in the group, a new editable math field is appended.
	- <kbd>Backspace</kbd> while editing an empty math field will remove that field and focus the previous field (if present).

- Keyboard delete behaviors while editing a math field:
	- <kbd>Backspace</kbd> in an empty math field removes the field and focuses the previous one.
	- <kbd>Ctrl</kbd> + <kbd>Backspace</kbd> deletes the current math field.
	- <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Backspace</kbd> deletes the entire math group.

- Reordering math fields within a group:
	- Use the left dotted drag handle to drag a math field up/down inside its group. A placeholder shows the drop location; release to insert. 

## Text field behavior

- Single-field text areas:
	- Each `TextGroup` contains one editable. Text editing supports newlines.

- Inline math in text fields:
	- Press <kbd>$</kbd> while focused in a text editor to insert an inline math field.
	- Inline math in text fields can be clicked to be edited.

- Cursor and boundary handling (MathQuill inside text):
	- Arrow keys and the delete key behave intuitively at the boundaries between math and text.

## Clipboard

- Keyboard shortcuts (only when not focused inside a MathQuill field nor a text editor):
	- <kbd>Ctrl/Cmd</kbd> + <kbd>C</kbd> — Copy selected groups (copies math and text groups, stores relative positions).
	- <kbd>Ctrl/Cmd</kbd> + <kbd>X</kbd> — Cut selected groups (copy + remove original).
	- <kbd>Ctrl/Cmd</kbd> + <kbd>V</kbd> — Paste groups at the current mouse position (uses internal mouse coordinates updated on mousemove).

- Context menu clipboard:
	- Right-click the canvas or a group to open the custom context menu. Menu items include: New Math Stack, New Text Stack, Cut, Copy, Paste, and Delete.

## Context menu

- Right-click anywhere on the canvas to open a custom context menu with the following items:
	- **New Math Stack**: Creates a new math group at the clicked coordinates.
	- **New Text Stack**: Creates a new text group at the clicked coordinates.
	- **Cut / Copy / Paste**: Operates on the targeted or selected groups.
	- **Delete**: Removes the targeted group or all selected groups.

## Panning, zooming and navigation

- Panning:
	- Middle mouse button drag pans the canvas.
	- Hold <kbd>Space</kbd> and drag with the left mouse button to pan.
	- Trackpad panning is supported.

- Zooming:
	- Use the mouse wheel to zoom in and out. The zoom is centered around the cursor position.
	- UI controls are available to zoom in, zoom out, reset the zoom, or use a slider for precise control.

## Command palette and MathGene commands

- Open command palette:
	- <kbd>Ctrl/Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> or <kbd>Ctrl/Cmd</kbd> + <kbd>K</kbd> opens the command palette.

- Command palette keyboard interactions:
	- Type to filter commands. Use <kbd>ArrowUp</kbd> / <kbd>ArrowDown</kbd> to change selection, <kbd>Enter</kbd> to execute, and <kbd>Escape</kbd> to close.
	- Available commands include: `Simplify`, `Expand`, `Solve for`, and `Factor`.

- Solve-for special case:
	- You can type `Solve for x` directly into the palette input. The command will be applied to the currently focused math field.

- Applying operations:
	- When a command is applied, a new math field is inserted below the current one. The result will appear in the new field.

## Expression equivalence and indicators

- The application automatically detects when different math fields contain identical or equivalent expressions.
- Colored indicators appear next to these expressions to show their relationship.
- Clicking on an expression with an indicator will highlight all other expressions that are identical or equivalent.

- **Identical**: The expressions are exactly the same.
- **Equivalent**: The expressions are mathematically equivalent, like `(x+1)(x-1)` and `x^2-1`.

## File management

- Save behavior:
	- The current state of the board is saved to the cloud automatically. If you are working on a new file, it will be saved locally until you create a file in the sidebar.

- Export / Import:
	- You can export the current board as a JSON file.
	- You can import a previously exported JSON file to load a board state.

- Sidebar file list and actions (authenticated users):
	- The sidebar lists all your saved files.
	- Each file has a menu with options to **Rename**, **Download as JSON**, and **Delete**.

- Creating a blank file (sidebar):
	- A "Create Blank File" option in the sidebar lets you create a new, empty file and saves it to your account.

## Sidebar and hamburger

- The hamburger menu button toggles the sidebar, which can be resized.

## Exact keyboard shortcuts

- Canvas / Groups / Clipboard:
	- <kbd>Ctrl/Cmd</kbd> + <kbd>C</kbd> — Copy selected groups.
	- <kbd>Ctrl/Cmd</kbd> + <kbd>X</kbd> — Cut selected groups.
	- <kbd>Ctrl/Cmd</kbd> + <kbd>V</kbd> — Paste groups.
	- <kbd>Backspace</kbd> / <kbd>Delete</kbd> / <kbd>x</kbd> — Remove selected groups.

- Command palette:
	- <kbd>Ctrl/Cmd</kbd> + <kbd>K</kbd> — Open command palette.
	- <kbd>Escape</kbd> — Close command palette.
	- <kbd>ArrowUp</kbd> / <kbd>ArrowDown</kbd> — Move selection inside the palette list.
	- <kbd>Enter</kbd> — Execute selected command.

- Panning / Zooming / Navigation:
	- Middle mouse drag — Pan the canvas.
	- Hold <kbd>Space</kbd> + left-drag — Pan the canvas.
	- Mouse wheel — Zoom.

- Math field editing:
	- <kbd>Enter</kbd> — Finalize the focused math field and create a new one below it.
	- <kbd>Backspace</kbd> (in an empty math field) — Removes the field and focuses the one above it.
	- <kbd>Ctrl</kbd> + <kbd>Backspace</kbd> — Deletes the current math field.
	- <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Backspace</kbd> — Deletes the entire math group.

- Text editor math insertion:
	- <kbd>$</kbd> — Insert an inline math field at the cursor.
