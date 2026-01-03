/**
 * drag-utils.js - Utilities for draggable components
 */

/**
 * Calculate bounded position to keep element within viewport
 * @param {Object} position - { x, y }
 * @param {Object} size - { width, height }
 * @param {Object} bounds - { minX, maxX, minY, maxY }
 * @returns {Object} Bounded position
 */
export function calculateBoundedPosition(position, size = { width: 0, height: 0 }, bounds = {}) {
  const {
    minX = 0,
    maxX = window.innerWidth,
    minY = 0,
    maxY = window.innerHeight,
  } = bounds;
  
  const boundedX = Math.max(minX, Math.min(position.x, maxX - size.width));
  const boundedY = Math.max(minY, Math.min(position.y, maxY - size.height));
  
  return { x: boundedX, y: boundedY };
}

/**
 * Snap position to grid
 * @param {Object} position - { x, y }
 * @param {number} gridSize - Grid size in pixels
 * @returns {Object} Snapped position
 */
export function snapToGrid(position, gridSize = 10) {
  const snappedX = Math.round(position.x / gridSize) * gridSize;
  const snappedY = Math.round(position.y / gridSize) * gridSize;
  
  return { x: snappedX, y: snappedY };
}

/**
 * Prevent overlapping between draggable elements
 * @param {Object} position - New position
 * @param {Object} size - Element size
 * @param {Array} otherElements - Array of { position, size } objects
 * @param {number} padding - Minimum padding between elements
 * @returns {Object} Non-overlapping position
 */
export function preventOverlap(position, size, otherElements = [], padding = 20) {
  let adjustedPosition = { ...position };
  
  otherElements.forEach((element) => {
    const elementRight = element.position.x + element.size.width;
    const elementBottom = element.position.y + element.size.height;
    const newRight = adjustedPosition.x + size.width;
    const newBottom = adjustedPosition.y + size.height;
    
    // Check for overlap
    if (
      adjustedPosition.x < elementRight + padding &&
      newRight > element.position.x - padding &&
      adjustedPosition.y < elementBottom + padding &&
      newBottom > element.position.y - padding
    ) {
      // Move to the right of the overlapping element
      adjustedPosition.x = elementRight + padding;
      
      // If still overlapping vertically, move down
      if (
        adjustedPosition.y < elementBottom + padding &&
        newBottom > element.position.y - padding
      ) {
        adjustedPosition.y = elementBottom + padding;
      }
    }
  });
  
  return adjustedPosition;
}

/**
 * Calculate magnetic attraction to edges or other elements
 * @param {Object} position - Current position
 * @param {Object} size - Element size
 * @param {number} threshold - Magnetic threshold in pixels
 * @returns {Object} Potentially adjusted position
 */
export function applyMagnetism(position, size, threshold = 20) {
  let adjustedPosition = { ...position };
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Attract to left edge
  if (Math.abs(position.x) < threshold) {
    adjustedPosition.x = 0;
  }
  
  // Attract to right edge
  if (Math.abs(position.x + size.width - viewportWidth) < threshold) {
    adjustedPosition.x = viewportWidth - size.width;
  }
  
  // Attract to top edge
  if (Math.abs(position.y) < threshold) {
    adjustedPosition.y = 0;
  }
  
  // Attract to bottom edge
  if (Math.abs(position.y + size.height - viewportHeight) < threshold) {
    adjustedPosition.y = viewportHeight - size.height;
  }
  
  // Attract to center horizontally
  if (Math.abs(position.x + size.width / 2 - viewportWidth / 2) < threshold) {
    adjustedPosition.x = viewportWidth / 2 - size.width / 2;
  }
  
  // Attract to center vertically
  if (Math.abs(position.y + size.height / 2 - viewportHeight / 2) < threshold) {
    adjustedPosition.y = viewportHeight / 2 - size.height / 2;
  }
  
  return adjustedPosition;
}

/**
 * Get drag handle element (for nested drag handles)
 * @param {Event} event - Mouse or touch event
 * @param {string} handleSelector - CSS selector for drag handle
 * @returns {HTMLElement|null} Drag handle element or null
 */
export function getDragHandle(event, handleSelector = '.drag-handle') {
  let element = event.target;
  
  while (element && element !== document.body) {
    if (element.matches(handleSelector)) {
      return element;
    }
    element = element.parentElement;
  }
  
  return null;
}

/**
 * Calculate drag velocity for momentum scrolling
 * @param {Array} positions - Array of { x, y, timestamp } objects
 * @returns {Object} Velocity in pixels per second { x, y }
 */
export function calculateDragVelocity(positions) {
  if (positions.length < 2) {
    return { x: 0, y: 0 };
  }
  
  const recentPositions = positions.slice(-3); // Last 3 positions
  const first = recentPositions[0];
  const last = recentPositions[recentPositions.length - 1];
  
  const timeDiff = (last.timestamp - first.timestamp) / 1000; // Convert to seconds
  if (timeDiff === 0) return { x: 0, y: 0 };
  
  const xVelocity = (last.x - first.x) / timeDiff;
  const yVelocity = (last.y - first.y) / timeDiff;
  
  return { x: xVelocity, y: yVelocity };
}

/**
 * Create a smooth drag animation with easing
 * @param {Object} startPosition - Starting position
 * @param {Object} endPosition - Target position
 * @param {Function} onUpdate - Callback for each frame
 * @param {number} duration - Animation duration in ms
 * @param {string} easing - Easing function name
 * @returns {Promise} Resolves when animation completes
 */
export function animateDrag(startPosition, endPosition, onUpdate, duration = 300, easing = 'easeOutCubic') {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    const easingFunctions = {
      linear: (t) => t,
      easeInQuad: (t) => t * t,
      easeOutQuad: (t) => t * (2 - t),
      easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      easeInCubic: (t) => t * t * t,
      easeOutCubic: (t) => (--t) * t * t + 1,
      easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    };
    
    const ease = easingFunctions[easing] || easingFunctions.easeOutCubic;
    
    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = ease(progress);
      
      const currentX = startPosition.x + (endPosition.x - startPosition.x) * easedProgress;
      const currentY = startPosition.y + (endPosition.y - startPosition.y) * easedProgress;
      
      onUpdate({ x: currentX, y: currentY });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }
    
    requestAnimationFrame(animate);
  });
}

/**
 * Check if element is draggable based on event target
 * @param {Event} event - Mouse or touch event
 * @param {HTMLElement} element - The draggable element
 * @param {string} handleSelector - CSS selector for drag handle
 * @param {string} cancelSelector - CSS selector for cancel elements
 * @returns {boolean} True if draggable
 */
export function isDraggable(event, element, handleSelector = null, cancelSelector = null) {
  let target = event.target;
  
  // Check cancel selector first
  if (cancelSelector) {
    while (target && target !== document.body) {
      if (target.matches(cancelSelector)) {
        return false;
      }
      target = target.parentElement;
    }
    
    // Reset target
    target = event.target;
  }
  
  // If no handle selector, entire element is draggable
  if (!handleSelector) {
    return true;
  }
  
  // Check handle selector
  while (target && target !== document.body) {
    if (target.matches(handleSelector)) {
      return true;
    }
    target = target.parentElement;
  }
  
  return false;
}

/**
 * Get element boundaries for constrained dragging
 * @param {HTMLElement} element - The draggable element
 * @param {Object} options - Boundary options
 * @returns {Object} Boundary object { minX, maxX, minY, maxY }
 */
export function getElementBoundaries(element, options = {}) {
  const {
    padding = 0,
    parentElement = document.body,
    allowOverflow = false,
  } = options;
  
  const elementRect = element.getBoundingClientRect();
  const parentRect = parentElement.getBoundingClientRect();
  
  if (allowOverflow) {
    return {
      minX: -elementRect.width + padding,
      maxX: window.innerWidth - padding,
      minY: -elementRect.height + padding,
      maxY: window.innerHeight - padding,
    };
  }
  
  return {
    minX: parentRect.left - elementRect.left + padding,
    maxX: parentRect.right - elementRect.left - elementRect.width - padding,
    minY: parentRect.top - elementRect.top + padding,
    maxY: parentRect.bottom - elementRect.top - elementRect.height - padding,
  };
}

/**
 * Save drag positions to localStorage with debouncing
 * @param {string} key - localStorage key
 * @param {Object} position - Position to save
 * @param {number} debounceDelay - Debounce delay in ms
 * @returns {Function} Debounced save function
 */
export function createPositionSaver(key, debounceDelay = 500) {
  let timeoutId = null;
  
  return (position) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(position));
      } catch (error) {
        console.warn('Failed to save position:', error);
      }
    }, debounceDelay);
  };
}

export default {
  calculateBoundedPosition,
  snapToGrid,
  preventOverlap,
  applyMagnetism,
  getDragHandle,
  calculateDragVelocity,
  animateDrag,
  isDraggable,
  getElementBoundaries,
  createPositionSaver,
};