class ZoomControls {
  constructor(board) {
    this.board = board;
    this.dom = {};
    
    this.lastClickTime = 0;
    this.doubleClickDelay = 300; // ms
  }

  cacheDOMElements() {
    this.dom = {
      zoomControls: document.getElementById('zoom-controls'),
      zoomPercentageBtn: document.getElementById('zoom-percentage-btn'),
      zoomInput: document.getElementById('zoom-input'),
      zoomIn: document.getElementById('zoom-in-btn'),
      zoomOut: document.getElementById('zoom-out-btn'),
    };
  }

  init() {
    this.cacheDOMElements();
    this.setupZoomEventListeners();
    this.updateZoomControls();
  }

  setupZoomEventListeners() {
    const { zoomPercentageBtn, zoomInput, zoomIn, zoomOut } = this.dom;
    
    if (!zoomIn || !zoomOut || !zoomPercentageBtn || !zoomInput) {
      console.warn('ZoomControls: Missing required DOM elements, skipping event listeners setup');
      return;
    }
    
    zoomIn.addEventListener('click', (e) => {
      this.onZoomIn();
      e.target.blur();
    });
    
    zoomOut.addEventListener('click', (e) => {
      this.onZoomOut();
      e.target.blur();
    });
    
    zoomPercentageBtn.addEventListener('click', (e) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - this.lastClickTime;
      
      if (timeDiff < this.doubleClickDelay) {
        e.preventDefault();
        this.enableZoomEditing();
      } else {
        setTimeout(() => {
          if (Date.now() - this.lastClickTime >= this.doubleClickDelay) {
            this.onZoomReset();
            e.target.blur();
          }
        }, this.doubleClickDelay);
      }
      
      this.lastClickTime = currentTime;
    });
    
    zoomInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.applyZoomInput();
      } else if (e.key === 'Escape') {
        this.cancelZoomEditing();
      }
    });
    
    zoomInput.addEventListener('blur', () => {
      this.applyZoomInput();
    });
    
    zoomInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/[^0-9]/g, '');

      if (value.length > 3) {
        value = value.slice(0, 3);
      }

      e.target.value = value;
    });
  }

  onZoomIn() {
    if (this.board.navigation && this.board.navigation.zoom) {
      this.board.navigation.zoom.zoomIn();
    }
  }

  onZoomOut() {
    if (this.board.navigation && this.board.navigation.zoom) {
      this.board.navigation.zoom.zoomOut();
    }
  }

  onZoomReset() {
    if (this.board.navigation && this.board.navigation.zoom) {
      this.board.navigation.zoom.setZoomLevel(1);
    }
  }

  updateZoomControls() {
    const { zoomControls, zoomPercentageBtn, zoomInput } = this.dom;
    if (!zoomControls || !zoomPercentageBtn) return;

    const percentage = Math.round(this.board.canvasState.scale * 100);
    zoomPercentageBtn.textContent = `${percentage}%`;
    zoomInput.value = percentage;
    
    zoomControls.classList.toggle(
      'visible',
      Math.abs(this.board.canvasState.scale - 1) >= 0.01
    );
    zoomControls.classList.toggle(
      'hidden',
      Math.abs(this.board.canvasState.scale - 1) < 0.01
    );
  }

  enableZoomEditing() {
    const { zoomPercentageBtn, zoomInput } = this.dom;
    
    zoomPercentageBtn.classList.add('d-none');
    zoomInput.classList.remove('d-none');
    zoomInput.focus();
    zoomInput.select();
  }

  cancelZoomEditing() {
    const { zoomPercentageBtn, zoomInput } = this.dom;
    
    zoomInput.classList.add('d-none');
    zoomPercentageBtn.classList.remove('d-none');
    
    zoomInput.value = Math.round(this.board.canvasState.scale * 100);
  }

  applyZoomInput() {
    const { zoomInput } = this.dom;
    let value = parseInt(zoomInput.value);
    
    if (isNaN(value) || value < 30) {
      value = 30;
    } else if (value > 333) {
      value = 333;
    }
    
    if (this.board.navigation && this.board.navigation.zoom) {
      this.board.navigation.zoom.setZoomLevel(value / 100);
    }
    
    this.cancelZoomEditing();
  }
}

export { ZoomControls };
