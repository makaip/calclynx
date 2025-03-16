const MQ = MathQuill.getInterface(2);
const canvas = document.getElementById('canvas');

// Variables for panning.
let isPanning = false;
let panStart = { x: 0, y: 0 };
let canvasOffset = { x: 0, y: 0 };
let spaceDown = false; // Track space bar state.
const scale = 1; // Fixed scale (zoom removed).

// The canvas is 20,000x20,000 with top-left at (-10000, -10000).
const canvasInitialOffset = { x: -10000, y: -10000 };

function clampPan() {
  // With scale fixed to 1, these values remain constant.
  const minX = window.innerWidth - 10000;
  const maxX = 10000;
  canvasOffset.x = Math.min(maxX, Math.max(minX, canvasOffset.x));
  
  const minY = window.innerHeight - 10000;
  const maxY = 10000;
  canvasOffset.y = Math.min(maxY, Math.max(minY, canvasOffset.y));
}

function updateTransform() {
  // Only translate, no scaling.
  canvas.style.transform = `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`;
}

function screenToCanvas(x, y) {
  return {
    x: (x - (canvasInitialOffset.x + canvasOffset.x)) / scale,
    y: (y - (canvasInitialOffset.y + canvasOffset.y)) / scale
  };
}

// Handle space bar state.
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') spaceDown = true;
});
document.addEventListener('keyup', (e) => {
  if (e.code === 'Space') spaceDown = false;
});

// Panning via middle mouse or left mouse with space held.
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 1 || (e.button === 0 && spaceDown)) {
    isPanning = true;
    panStart.x = e.clientX - canvasOffset.x;
    panStart.y = e.clientY - canvasOffset.y;
    e.preventDefault();
  }
});
canvas.addEventListener('mousemove', (e) => {
  if (isPanning) {
    canvasOffset.x = e.clientX - panStart.x;
    canvasOffset.y = e.clientY - panStart.y;
    clampPan();
    updateTransform();
  }
});
canvas.addEventListener('mouseup', (e) => {
  if (e.button === 1 || e.button === 0) isPanning = false;
});
canvas.addEventListener('mouseleave', () => isPanning = false);

// Update transform on window resize.
window.addEventListener('resize', () => {
  clampPan();
  updateTransform();
});

// Prevent context menu on right-click.
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Create a new math group on double-click (when not panning).
document.addEventListener('dblclick', (event) => {
  if (isPanning) return;
  const coords = screenToCanvas(event.clientX, event.clientY);
  createMathGroup(coords.x, coords.y);
});

// ----- Math Group Selection -----
// (These listeners simply deselect all groups then select the clicked one.)
document.addEventListener('click', (event) => {
  // If we're panning or dragging, don't handle clicks
  if (isPanning || groupDragging) return;

  // Deselect all groups first
  document.querySelectorAll('.math-group').forEach(group => group.classList.remove('selected'));
  
  let target = event.target;
  
  // Check if we clicked a static math field container.
  // (This is triggered when clicking a non-editing math field, causing it to become editable.)
  const mathContainer = target.closest('.math-field-container');
  if (mathContainer && !mathContainer.querySelector('.mq-editable-field')) {
    event.stopPropagation();
    editMathField(mathContainer);
    return;
  }
  
  // If the click is inside any math field container (either static or in edit mode),
  // do not highlight the whole math group.
  if (target.closest('.math-field-container')) {
    return;
  }
  
  // Otherwise, handle group selection by finding the math-group container.
  while (target && !target.classList.contains('math-group')) {
    target = target.parentElement;
  }
  
  if (target && target.classList.contains('math-group')) {
    target.classList.add('selected');
  }
});


// ----- Math Group Dragging -----
// When clicking in the 10px margin, allow dragging of math groups.
let groupDragging = false;
let draggedGroup = null;
let dragOffsetX = 0, dragOffsetY = 0;
const margin = 10;

document.addEventListener('mousedown', (event) => {
  // Only proceed if left button is pressed and space is not down (panning not active).
  if (event.button !== 0 || spaceDown) return;
  
  // If the click is inside a math field container, do nothing.
  if (event.target.closest('.math-field-container')) return;
  
  let target = event.target;
  while (target && !target.classList.contains('math-group')) {
    target = target.parentElement;
  }
  if (target && target.classList.contains('math-group')) {
    groupDragging = true;
    draggedGroup = target;
    dragOffsetX = event.clientX - target.offsetLeft;
    dragOffsetY = event.clientY - target.offsetTop;
    target.classList.add('dragging');
    // Stop further propagation to prevent other listeners from interfering.
    event.stopPropagation();
  }
});



document.addEventListener('mousemove', (event) => {
  if (groupDragging && draggedGroup) {
    draggedGroup.style.left = (event.clientX - dragOffsetX) + 'px';
    draggedGroup.style.top = (event.clientY - dragOffsetY) + 'px';
  }
});

document.addEventListener('mouseup', () => {
  if (groupDragging && draggedGroup) {
    draggedGroup.classList.remove('dragging');
    groupDragging = false;
    draggedGroup = null;
  }
});

document.addEventListener('keydown', (e) => {
  // Check if the Backspace key is pressed without any modifiers
  if (e.key === 'Backspace' && !e.ctrlKey && !e.altKey && !e.metaKey) {
    const selectedGroup = document.querySelector('.math-group.selected');
    if (selectedGroup) {
      e.preventDefault(); // Prevent default backspace behavior (like browser navigation)
      selectedGroup.remove();
    }
  }
});



// Create a new math group at the given canvas coordinates.
function createMathGroup(x, y) {
  const group = document.createElement('div');
  group.className = 'math-group';
  group.style.left = `${x}px`;
  group.style.top = `${y}px`;
  group.tabIndex = -1; // Make group focusable

  // When focus leaves the group, check if it should be removed.
  group.addEventListener('focusout', function() {
    // Delay a bit to allow focus to shift inside the group.
    setTimeout(() => {
      if (!group.contains(document.activeElement)) {
        // If the group has only one math field container…
        if (group.children.length === 1) {
          const container = group.children[0];
          // And if that container was never finalized (i.e. empty LaTeX)
          if (!container.dataset.latex || container.dataset.latex.trim() === '') {
            group.remove();
          }
        }
      }
    }, 50);
  });

  // Append the group to the canvas.
  canvas.appendChild(group);
  createMathField(group);
}

// Create a new math field inside a given group.
function createMathField(group) {
  const container = document.createElement('div');
  container.className = 'math-field-container';
  // Prevent mousedown events on this container from bubbling up.
  container.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });
  group.appendChild(container);

  const mathFieldElement = document.createElement('div');
  mathFieldElement.className = 'math-field';
  container.appendChild(mathFieldElement);

  const mathField = MQ.MathField(mathFieldElement, {
    spaceBehavesLikeTab: true
  });

  container.dataset.latex = '';

  // On blur, check if the math field is empty and remove it (and possibly the group).
  mathFieldElement.addEventListener('blur', function() {
    setTimeout(() => {
      if (!mathField.latex().trim()) {
        container.remove();
        if (!group.querySelector('.math-field-container')) {
          group.remove();
        }
      }
    }, 50);
  });

  // Keydown events for deletion and creating new fields.
  mathFieldElement.addEventListener('keydown', function(event) {
    // Ctrl+Backspace deletes the field (or the whole group if Shift is also held).
    if (event.key === 'Backspace' && event.ctrlKey) {
      event.preventDefault();
      if (event.shiftKey) {
        group.remove();
      } else {
        container.remove();
        if (!group.querySelector('.math-field-container')) {
          group.remove();
        }
      }
      return;
    }
    // Enter finalizes the field.
    if (event.key === 'Enter') {
      event.preventDefault();
      finalizeMathField(container, mathField);
      if (event.ctrlKey) {
        mathFieldElement.blur();
      } else {
        // Only auto-create a new field if this container is the last child in the group.
        if (container === group.lastElementChild) {
          setTimeout(() => createMathField(group), 0);
        }
      }
    }
  });

  mathField.focus();
}

// Finalize the math field into a static display.
// If the field is empty, remove it (and remove the group if it becomes empty).
function finalizeMathField(container, mathField) {
  const latex = mathField.latex().trim();
  if (!latex) {
    container.remove();
    const group = container.parentElement;
    if (group && !group.querySelector('.math-field-container')) {
      group.remove();
    }
    return;
  }
  container.dataset.latex = latex;
  container.innerHTML = '';
  const staticMath = document.createElement('div');
  staticMath.className = 'math-field';
  container.appendChild(staticMath);
  MQ.StaticMath(staticMath).latex(latex);
}

// Enable editing of an existing math field.
function editMathField(container) {
  const existingLatex = container.dataset.latex || '';
  // Prevent re-editing if already in edit mode.
  if (container.querySelector('.mq-editable-field')) return;
  container.innerHTML = '';

  const mathFieldElement = document.createElement('div');
  mathFieldElement.className = 'math-field';
  container.appendChild(mathFieldElement);

  const mathField = MQ.MathField(mathFieldElement, {
    spaceBehavesLikeTab: true
  });
  mathField.latex(existingLatex);
  mathField.focus();

  mathFieldElement.addEventListener('keydown', function(event) {
    // Ctrl+Backspace deletes the field (or the whole group with Shift).
    if (event.key === 'Backspace' && event.ctrlKey) {
      event.preventDefault();
      if (event.shiftKey) {
        container.parentElement.remove();
      } else {
        container.remove();
        const group = container.parentElement;
        if (group && !group.querySelector('.math-field-container')) {
          group.remove();
        }
      }
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      finalizeMathField(container, mathField);
      if (event.ctrlKey) {
        mathFieldElement.blur();
      } else {
        // Only auto-create a new field if this container is the last child.
        if (container === container.parentElement.lastElementChild) {
          setTimeout(() => createMathField(container.parentElement), 0);
        }
      }
    }
  });
  

  mathFieldElement.addEventListener('blur', function() {
    setTimeout(() => {
      if (!mathField.latex().trim()) {
        container.remove();
        const group = container.parentElement;
        if (group && !group.querySelector('.math-field-container')) {
          group.remove();
        }
      }
    }, 50);
  });
}