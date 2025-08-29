class ImageGroup extends ObjectGroup {
  constructor(board, x, y, data = null) {
    // Call parent constructor with groupType
    super(board, x, y, data, 'image');
    
    // Store the image URL and size
    this.imageUrl = data ? data.imageUrl : null;
    this.imageWidth = data ? data.imageWidth : null;
    this.imageHeight = data ? data.imageHeight : null;
    
    // Resize state
    this.isResizing = false;
    this.resizeHandle = null;
    this.resizeStartData = null;
    
    if (this.imageUrl) {
      this.createImageElement();
    }
  }

  createImageElement() {
    // Clear existing content
    this.element.innerHTML = '';
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    
    // Create image element
    const img = document.createElement('img');
    img.src = this.imageUrl;
    img.alt = 'User image';
    img.className = 'image-content';
    
    // Apply custom size if available
    if (this.imageWidth && this.imageHeight) {
      img.style.width = this.imageWidth + 'px';
      img.style.height = this.imageHeight + 'px';
    }
    
    // Prevent default browser drag behavior for images
    img.draggable = false;
    img.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    });
    
    // Prevent context menu on image to avoid right-click save issues
    img.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    
    // Handle image load and error
    img.onload = () => {
      console.log('Image loaded successfully:', this.imageUrl);
      // Store natural dimensions if not already set
      if (!this.imageWidth || !this.imageHeight) {
        // Use natural dimensions up to a reasonable maximum
        const maxWidth = 800;
        const maxHeight = 600;
        
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        
        // Scale down proportionally if too large
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
      // Show error placeholder with a more informative message
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
    
    // Create resize handles
    this.createResizeHandles(imageContainer);
    
    this.element.appendChild(imageContainer);
  }

  createResizeHandles(container) {
    const handles = ['nw', 'ne', 'sw', 'se']; // Only corner handles
    
    handles.forEach(position => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-handle-${position}`;
      handle.dataset.position = position;
      
      // Add mouse event listeners for resize
      handle.addEventListener('mousedown', (e) => this.startResize(e, position));
      
      container.appendChild(handle);
    });
  }

  endResize(e) {
    if (!this.isResizing) return;
    
    this.isResizing = false;
    this.resizeHandle = null;
    this.resizeStartData = null;
    
    // Remove global event listeners
    document.removeEventListener('mousemove', this.boundHandleResize);
    document.removeEventListener('mouseup', this.boundEndResize);
    
    // Remove resizing class
    this.element.classList.remove('resizing');
    
    // Save state after resize
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
      // Store original position
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
    
    // Calculate the distance from the starting point for uniform scaling
    let scaleFactor = 1;
    
    // Use the dominant axis to determine scale factor
    switch (this.resizeHandle) {
      case 'se': // Bottom-right (simple case)
        scaleFactor = Math.max(
          (this.resizeStartData.startWidth + deltaX) / this.resizeStartData.startWidth,
          (this.resizeStartData.startHeight + deltaY) / this.resizeStartData.startHeight
        );
        break;
      case 'nw': // Top-left
        scaleFactor = Math.max(
          (this.resizeStartData.startWidth - deltaX) / this.resizeStartData.startWidth,
          (this.resizeStartData.startHeight - deltaY) / this.resizeStartData.startHeight
        );
        break;
      case 'ne': // Top-right
        scaleFactor = Math.max(
          (this.resizeStartData.startWidth + deltaX) / this.resizeStartData.startWidth,
          (this.resizeStartData.startHeight - deltaY) / this.resizeStartData.startHeight
        );
        break;
      case 'sw': // Bottom-left
        scaleFactor = Math.max(
          (this.resizeStartData.startWidth - deltaX) / this.resizeStartData.startWidth,
          (this.resizeStartData.startHeight + deltaY) / this.resizeStartData.startHeight
        );
        break;
    }
    
    // Ensure minimum size
    const minSize = 50;
    scaleFactor = Math.max(scaleFactor, minSize / Math.min(this.resizeStartData.startWidth, this.resizeStartData.startHeight));
    
    // Calculate new dimensions maintaining aspect ratio
    const newWidth = this.resizeStartData.startWidth * scaleFactor;
    const newHeight = this.resizeStartData.startHeight * scaleFactor;
    
    // Calculate position adjustments based on which corner is being dragged
    // Use the ORIGINAL position as the reference point
    let newLeft = this.resizeStartData.originalLeft;
    let newTop = this.resizeStartData.originalTop;
    
    const widthDiff = newWidth - this.resizeStartData.startWidth;
    const heightDiff = newHeight - this.resizeStartData.startHeight;
    
    switch (this.resizeHandle) {
      case 'nw': // Top-left: move left and up by the size difference
        newLeft = this.resizeStartData.originalLeft - widthDiff;
        newTop = this.resizeStartData.originalTop - heightDiff;
        break;
      case 'ne': // Top-right: only move up by height difference
        newLeft = this.resizeStartData.originalLeft;
        newTop = this.resizeStartData.originalTop - heightDiff;
        break;
      case 'sw': // Bottom-left: only move left by width difference
        newLeft = this.resizeStartData.originalLeft - widthDiff;
        newTop = this.resizeStartData.originalTop;
        break;
      case 'se': // Bottom-right: no position change
        newLeft = this.resizeStartData.originalLeft;
        newTop = this.resizeStartData.originalTop;
        break;
    }
    
    // Update image dimensions
    this.imageWidth = newWidth;
    this.imageHeight = newHeight;
    
    // Apply new dimensions to the image element
    const img = this.element.querySelector('.image-content');
    if (img) {
      img.style.width = newWidth + 'px';
      img.style.height = newHeight + 'px';
    }
    
    // Update position
    this.element.style.left = newLeft + 'px';
    this.element.style.top = newTop + 'px';
  }

  setImageUrl(url) {
    this.imageUrl = url;
    this.createImageElement();
    // Save state after setting image
    this.board.fileManager.saveState();
  }

  remove() {
    super.remove(); // Call parent remove method
  }
}
