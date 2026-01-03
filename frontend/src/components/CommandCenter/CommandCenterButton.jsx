import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { useCommandCenter } from './hooks';

/**
 * CommandCenterButton Component
 */
export function CommandCenterButton() {
  const { isOpen, toggle, position, updatePosition } = useCommandCenter();
  const [isDragging, setIsDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState(position);
  const nodeRef = useRef(null);
  const dragStartTime = useRef(0);

  // Load saved position on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('command-center-button-position');
      if (saved) {
        const savedPosition = JSON.parse(saved);
        setLocalPosition(savedPosition);
        updatePosition(savedPosition);
      }
    } catch (error) {
      console.warn('Failed to load button position:', error);
    }
  }, [updatePosition]);

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
    dragStartTime.current = Date.now();
  };

  // Handle drag stop
  const handleDragStop = (e, data) => {
    setIsDragging(false);

    const newPosition = { x: data.x, y: data.y };
    setLocalPosition(newPosition);
    updatePosition(newPosition);

    // Save to localStorage
    try {
      localStorage.setItem('command-center-button-position', JSON.stringify(newPosition));
    } catch (error) {
      console.warn('Failed to save button position:', error);
    }

    // If it was a very short drag (click), toggle the menu
    const dragDuration = Date.now() - dragStartTime.current;
    if (dragDuration < 200) {
      toggle();
    }
  };

  // Calculate button position with boundary constraints
  const getBoundedPosition = () => {
    const maxX = window.innerWidth - 48; // Button width
    const maxY = window.innerHeight - 48; // Button height

    return {
      x: Math.max(0, Math.min(localPosition.x, maxX)),
      y: Math.max(0, Math.min(localPosition.y, maxY)),
    };
  };

  const boundedPosition = getBoundedPosition();

  // Button styles based on state
  const buttonStyles = {
    position: 'absolute',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: isOpen
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    border: isOpen
      ? '2px solid rgba(255, 255, 255, 0.8)'
      : '2px solid rgba(255, 255, 255, 0.2)',
    color: 'white',
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    boxShadow: isOpen
      ? '0 0 30px rgba(102, 126, 234, 0.6), 0 8px 24px rgba(0, 0, 0, 0.3)'
      : '0 8px 24px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
    transition: 'all 0.3s ease',
    zIndex: 9998,
    transform: isDragging ? 'scale(1.05)' : 'scale(1)',
  };

  // Hover effect styles
  const hoverStyles = {
    background: isOpen
      ? 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
      : 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
    boxShadow: isOpen
      ? '0 0 40px rgba(102, 126, 234, 0.8), 0 12px 32px rgba(0, 0, 0, 0.4)'
      : '0 12px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={boundedPosition}
      onStart={handleDragStart}
      onStop={handleDragStop}
      bounds="parent"
      defaultClassName="command-center-draggable"
      defaultClassNameDragging="command-center-dragging"
    >
      <div
        ref={nodeRef}
        className="command-center-button"
        style={buttonStyles}
        onMouseEnter={(e) => {
          Object.assign(e.target.style, hoverStyles);
        }}
        onMouseLeave={(e) => {
          Object.assign(e.target.style, buttonStyles);
        }}
        onClick={(e) => {
          // Prevent toggle if we just dragged (handled in dragStop)
          if (!isDragging) {
            e.stopPropagation();
            toggle();
          }
        }}
        title="Command Center (drag to move, click to open)"
      >
        {isOpen ? '✕' : '⚙️'}
      </div>
    </Draggable>
  );
}

/**
 * Alternative button with different styling options
 */
export function CommandCenterButtonVariant({ variant = 'default' }) {
  const { toggle } = useCommandCenter();

  const variants = {
    default: {
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      icon: '⚙️',
    },
    matrix: {
      background: 'linear-gradient(135deg, #00ff88 0%, #00ccff 100%)',
      icon: '🧠',
    },
    terminal: {
      background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
      icon: '>_',
    },
    minimal: {
      background: 'rgba(255, 255, 255, 0.1)',
      icon: '⋮',
    },
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <button
      onClick={toggle}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        background: currentVariant.background,
        border: 'none',
        color: 'white',
        fontSize: '18px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      }}
      title="Open Command Center"
    >
      {currentVariant.icon}
    </button>
  );
}

export default CommandCenterButton;