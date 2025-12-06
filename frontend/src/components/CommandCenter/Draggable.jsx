// components/Common/Draggable.jsx
import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import '../Common/css/draggable.css'

const Draggable = ({
  children,
  defaultPosition = { x: 100, y: 100 },
  position: controlledPosition,
  constraints,
  showHandle = true,
  onDragStart,
  onDragEnd,
  style = {},
  className = '',
  ...props
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);

  // Use controlled position if provided, otherwise use internal state
  const currentPosition = controlledPosition !== undefined ? controlledPosition : position;

  const handleDragStart = () => {
    setIsDragging(true);
    onDragStart?.();
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    
    const newX = currentPosition.x + info.offset.x;
    const newY = currentPosition.y + info.offset.y;
    
    const newPosition = { x: newX, y: newY };
    
    // Only update internal state if not controlled
    if (controlledPosition === undefined) {
      setPosition(newPosition);
    }
    
    onDragEnd?.(newPosition);
  };

  return (
    <Motion.div
      className={`draggable-container ${className} ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'fixed',
        left: currentPosition.x,
        top: currentPosition.y,
        zIndex: 1000,
        ...style
      }}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={constraints || {
        left: 0,
        right: window.innerWidth - 200,
        top: 0,
        bottom: window.innerHeight - 100
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      {...props}
    >
      {showHandle && (
        <div className="draggable-handle">
          <GripVertical size={16} />
        </div>
      )}
      
      <div className="draggable-content">
        {children}
      </div>
    </Motion.div>
  );
};

export default Draggable;  