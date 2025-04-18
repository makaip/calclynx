function isMathquillFieldFocused() {
    // Assumes mathquill fields have a specific class, e.g., 'mq-editable-field'
    const active = document.activeElement;
    return active && active.classList.contains('mq-editable-field');
}

// Clipboard event handlers for cut/copy/paste (keyboard and context menu)
document.addEventListener('cut', function(event) {
    if (isMathquillFieldFocused()) {
        // Let mathquill handle the event
        return;
    }
    event.preventDefault();
    if (window.mathBoard) {
        window.mathBoard.cutSelectedGroups();
    }
});

document.addEventListener('copy', function(event) {
    if (isMathquillFieldFocused()) {
        // Let mathquill handle the event
        return;
    }
    event.preventDefault();
    if (window.mathBoard) {
        window.mathBoard.copySelectedGroups();
    }
});

document.addEventListener('paste', function(event) {
    if (isMathquillFieldFocused()) {
        // Let mathquill handle the event
        return;
    }
    event.preventDefault();
    if (window.mathBoard) {
        window.mathBoard.pasteGroups();
    }
});

// Keyboard shortcuts for clipboard actions (Ctrl/Cmd + X/C/V)
document.addEventListener('keydown', function(e) {
    // Only handle if not focused on MathQuill field or other editable field
    const activeEl = document.activeElement;
    const isEditable = activeEl &&
      (activeEl.tagName === 'INPUT' ||
       activeEl.tagName === 'TEXTAREA' ||
       activeEl.isContentEditable ||
       activeEl.classList.contains('mq-editable-field'));
    if (isEditable) return;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierKey = isMac ? e.metaKey : e.ctrlKey;

    if (modifierKey && e.key === 'c') {
        e.preventDefault();
        if (window.mathBoard) window.mathBoard.copySelectedGroups();
    } else if (modifierKey && e.key === 'x') {
        e.preventDefault();
        if (window.mathBoard) window.mathBoard.cutSelectedGroups();
    } else if (modifierKey && e.key === 'v') {
        e.preventDefault();
        if (window.mathBoard) window.mathBoard.pasteGroups();
    }
});