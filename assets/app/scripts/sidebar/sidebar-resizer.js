export class SidebarResizer {
    constructor(sidebar, mainContent, resizer) {
        this.sidebar = sidebar;
        this.mainContent = mainContent;
        this.resizer = resizer;
        this.minWidth = 200;
        this.maxWidth = 800;
        this.currentWidth = 400;
        this.isResizing = false;
    }

    applyWidthImmediate(width) {
        if (!this.sidebar) return;
        
        const clampedWidth = Math.max(this.minWidth, Math.min(width, this.maxWidth));
        this.sidebar.style.transition = 'none';
        this.sidebar.style.width = `${clampedWidth}px`;
        
        const isOpen = this.sidebar.classList.contains('show');
        
        if (isOpen && this.mainContent) {
            this.mainContent.style.marginLeft = `${clampedWidth}px`;
        }
        
        this.currentWidth = clampedWidth;
    }

    applyWidthWithTransition(width) {
        if (!this.sidebar) return;

        const clampedWidth = Math.max(this.minWidth, Math.min(width, this.maxWidth));
        this.sidebar.style.transition = 'width 0.3s ease';
        this.sidebar.style.width = `${clampedWidth}px`;
        
        if (this.mainContent) {
            this.mainContent.style.transition = 'margin-left 0.3s ease';
        }
        
        const isOpen = this.sidebar.classList.contains('show');
        if (isOpen && this.mainContent) {
            this.mainContent.style.marginLeft = `${clampedWidth}px`;
        }
        
        this.currentWidth = clampedWidth;
    }

    syncMainContentMargin() {
        if (!this.sidebar || !this.mainContent) return;

        const isOpen = this.sidebar.classList.contains('show');
        this.mainContent.style.marginLeft = isOpen ? `${this.currentWidth}px` : '0';
    }

    handleResizeStart(e) {
        this.isResizing = true;
        document.body.classList.add('no-select');
        document.onmousemove = this.handleMouseMove.bind(this);
        document.onmouseup = this.handleResizeEnd.bind(this);
    }

    handleMouseMove(e) {
        if (!this.isResizing) return;
        this.applyWidthImmediate(e.clientX);
    }

    handleResizeEnd() {
        if (!this.isResizing) return;
        this.isResizing = false;
        document.body.classList.remove('no-select');
        document.onmousemove = null;
        document.onmouseup = null;
        this.applyWidthWithTransition(this.currentWidth);
    }

    init() {
        if (this.resizer) {
            this.resizer.onmousedown = this.handleResizeStart.bind(this);
        }

        if (this.sidebar) {
            const handleOffcanvasShow = () => this.syncMainContentMargin();
            const handleOffcanvasHide = () => this.syncMainContentMargin();
            
            this.sidebar.addEventListener('shown.bs.offcanvas', handleOffcanvasShow);
            this.sidebar.addEventListener('hidden.bs.offcanvas', handleOffcanvasHide);
        }

        this.applyWidthWithTransition(this.currentWidth);
        this.syncMainContentMargin();
    }
}
