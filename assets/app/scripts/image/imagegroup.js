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
    
    this.resizeHandler = new ImageGroupResizeHandler(this);
    
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
    
    imageContainer.appendChild(img);
    this.resizeHandler.createResizeHandles(this.element);
    this.element.appendChild(imageContainer);
  }

  setImageUrl(url) {
    this.imageUrl = url;
    this.createImageElement();
    this.board.fileManager.saveState();
  }

  remove() {
    super.remove();
  }
}
