class TextFormatToolbar {
    constructor() {
        this.toolbar = document.getElementById('toolbar');
        this.isVisible = false;
        this.activeTextField = null;
        
        this.init();
    }
    
    init() {
        const formatButtons = this.toolbar.querySelectorAll('.format-btn');
        formatButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const format = btn.dataset.format;
                this.handleFormatAction(format);
            });
        });
        
        document.addEventListener('click', (e) => {
            setTimeout(() => {
                if (!this.toolbar.contains(e.target) && !this.isTextFieldTarget(e.target)) {
                    this.hide();
                }
            }, 50);
        });
    }
    
    show(textField = null) {
        if (textField) {
            this.activeTextField = textField;
        }
        
        this.toolbar.style.display = 'flex';
        this.toolbar.classList.remove('hidden');
        this.isVisible = true;
        
        this.updateButtonStates();
    }
    
    hide() {
        this.toolbar.classList.add('hidden');
        this.isVisible = false;
        this.activeTextField = null;
        
        setTimeout(() => {
            if (!this.isVisible) {
                this.toolbar.style.display = 'none';
            }
        }, 200);
    }
    
    toggle(textField = null) {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show(textField);
        }
    }
    
    handleFormatAction(format) {
        console.log(`Format action: ${format}`);
        
        // TODO: implement actual formatting logic based on active text field        
        switch (format) {
            case 'bold':
                this.toggleButtonState('bold');
                break;
            case 'italic':
                this.toggleButtonState('italic');
                break;
            case 'underline':
                this.toggleButtonState('underline');
                break;
            case 'heading':
                this.toggleButtonState('heading');
                break;
            case 'equation':

                break;
            case 'bullet-list':
                this.toggleButtonState('bullet-list');
                break;
            case 'number-list':
                this.toggleButtonState('number-list');
                break;
        }
    }
    
    toggleButtonState(format) {
        const button = this.toolbar.querySelector(`[data-format="${format}"]`);
        if (button) {
            button.classList.toggle('active');
        }
    }
    
    updateButtonStates() {
        // TODO: update button states based on current selection
    }
    
    isTextFieldTarget(element) {
        return element.closest('.text-editor') || 
               element.closest('.text-field-container') ||
               element.classList.contains('ProseMirror') ||
               element.closest('.prosemirror-editor');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.textFormatToolbar = new TextFormatToolbar();
    console.log('Text Format Toolbar initialized');
});

window.TextFormatToolbar = TextFormatToolbar;

window.showTextToolbar = function() {
    if (window.textFormatToolbar) {
        window.textFormatToolbar.show();
    }
};