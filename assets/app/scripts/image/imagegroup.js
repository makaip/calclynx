class ImageGroup extends ObjectGroup {
  constructor(board, x, y, data = null) {

    super(board, x, y, data, 'image');
    
    this.resizeDirections = {
      se: { dx: +1, dy: +1 },
      nw: { dx: -1, dy: -1 },
      ne: { dx: +1, dy: -1 },
      sw: { dx: -1, dy: +1 },
    };

    this.positionAdjustments = {
      nw: { moveX: true,  moveY: true  },
      ne: { moveX: false, moveY: true  },
      sw: { moveX: true,  moveY: false },
      se: { moveX: false, moveY: false },
    };
    
    this.imageUrl = data ? data.imageUrl : null;
    this.imageWidth = data ? data.imageWidth : null;
    this.imageHeight = data ? data.imageHeight : null;
    
    this.isResizing = false;
    this.resizeHandle = null;
    this.resizeStartData = null;
    
    if (this.imageUrl) {
      this.createImageElement();
    }
  }

  getScaleFactor(handle, deltaX, deltaY, startWidth, startHeight) {
    const dir = this.resizeDirections[handle];
    if (!dir) return 1; // default no-scale

    return Math.max(
      (startWidth + dir.dx * deltaX) / startWidth,
      (startHeight + dir.dy * deltaY) / startHeight
    );
  }

  getNewPosition(handle, start, widthDiff, heightDiff) {
    const adj = this.positionAdjustments[handle];
    if (!adj) return { newLeft: start.left, newTop: start.top };

    return {
      newLeft: start.left - (adj.moveX ? widthDiff : 0),
      newTop: start.top - (adj.moveY ? heightDiff : 0),
    };
  }

  createImageElement() {
    this.element.innerHTML = '';
    
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    
    const img = document.createElement('img');
    img.src = this.imageUrl;
    img.alt = 'User image';
    img.className = 'image-content';
    
    if (this.imageWidth && this.imageHeight) {
      img.style.width = this.imageWidth + 'px';
      img.style.height = this.imageHeight + 'px';
    }
    
    img.draggable = false;
    img.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    });
    
    img.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    
    img.onload = () => {
      console.log('Image loaded successfully:', this.imageUrl);
      if (!this.imageWidth || !this.imageHeight) {
        const maxWidth = 800;
        const maxHeight = 600;
        
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        this.imageWidth = width;
        this.imageHeight = height;
        img.style.width = this.imageWidth + 'px';
        img.style.height = this.imageHeight + 'px';
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image:', this.imageUrl);
      const errorSvg = `
        <svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#2a2a2a" stroke="#666" stroke-width="1" rx="4"/>
          <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="12" fill="#999" text-anchor="middle">⚠ Image not found</text>
          <text x="50%" y="65%" font-family="Arial, sans-serif" font-size="10" fill="#666" text-anchor="middle">Check URL</text>
        </svg>
      `;
      img.src = 'data:image/svg+xml;base64,' + btoa(errorSvg);
      this.imageWidth = 200;
      this.imageHeight = 100;
      img.style.width = this.imageWidth + 'px';
      img.style.height = this.imageHeight + 'px';
    };
    
    imageContainer.appendChild(img);
    this.createResizeHandles(imageContainer);
    this.element.appendChild(imageContainer);
  }

  createResizeHandles(container) {
    const handles = ['nw', 'ne', 'sw', 'se']; // Only corner handles
    
    handles.forEach(position => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-handle-${position}`;
      handle.dataset.position = position;
      handle.addEventListener('mousedown', (e) => this.startResize(e, position));
      container.appendChild(handle);
    });
  }

  endResize(e) {
    if (!this.isResizing) return;
    
    this.isResizing = false;
    this.resizeHandle = null;
    this.resizeStartData = null;
    
    document.removeEventListener('mousemove', this.boundHandleResize);
    document.removeEventListener('mouseup', this.boundEndResize);
    this.element.classList.remove('resizing');
    this.board.fileManager.saveState();
  }

  startResize(e, position) {
    e.preventDefault();
    e.stopPropagation();
    
    this.isResizing = true;
    this.resizeHandle = position;
    
    const img = this.element.querySelector('.image-content');
    const rect = img.getBoundingClientRect();
    
    this.resizeStartData = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: this.imageWidth,
      startHeight: this.imageHeight,
      aspectRatio: this.imageWidth / this.imageHeight,
      originalRect: rect,

      originalLeft: parseFloat(this.element.style.left) || 0,
      originalTop: parseFloat(this.element.style.top) || 0
    };
    
    // Bind methods to preserve 'this' context
    this.boundHandleResize = this.handleResize.bind(this);
    this.boundEndResize = this.endResize.bind(this);
    
    // Add global mouse event listeners
    document.addEventListener('mousemove', this.boundHandleResize);
    document.addEventListener('mouseup', this.boundEndResize);
    
    // Add resizing class for visual feedback
    this.element.classList.add('resizing');
  }

  handleResize(e) {
    if (!this.isResizing || !this.resizeStartData) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - this.resizeStartData.startX;
    const deltaY = e.clientY - this.resizeStartData.startY;
    
    // Calculate the scale factor using the helper function
    const scaleFactor = this.getScaleFactor(
      this.resizeHandle, 
      deltaX, 
      deltaY, 
      this.resizeStartData.startWidth, 
      this.resizeStartData.startHeight
    );
    
    const minSize = 50;
    const adjustedScaleFactor = Math.max(scaleFactor, minSize / Math.min(this.resizeStartData.startWidth, this.resizeStartData.startHeight));
    
    const newWidth = this.resizeStartData.startWidth * adjustedScaleFactor;
    const newHeight = this.resizeStartData.startHeight * adjustedScaleFactor;
    
    const widthDiff = newWidth - this.resizeStartData.startWidth;
    const heightDiff = newHeight - this.resizeStartData.startHeight;
    
    const { newLeft, newTop } = this.getNewPosition(this.resizeHandle, {
      left: this.resizeStartData.originalLeft,
      top: this.resizeStartData.originalTop
    }, widthDiff, heightDiff);
    
    // Update image dimensions
    this.imageWidth = newWidth;
    this.imageHeight = newHeight;
    
    const img = this.element.querySelector('.image-content');
    if (img) {
      img.style.width = newWidth + 'px';
      img.style.height = newHeight + 'px';
    }
    
    this.element.style.left = newLeft + 'px';
    this.element.style.top = newTop + 'px';
  }

  setImageUrl(url) {
    this.imageUrl = url;
    this.createImageElement();
    this.board.fileManager.saveState();
  }

  remove() {
    super.remove(); // Call parent remove method
  }
}
