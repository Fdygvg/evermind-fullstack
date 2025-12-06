// components/CommandCenter/DraggableTool.jsx
import React, { useState, useEffect } from 'react';
import { Minus, X } from 'lucide-react';
import Draggable from './Draggable';
import '../Common/css/commandCenter.css';

const DraggableTool = ({
  toolId,
  children,
  isMinimized = false,
  position,
  onPositionChange,
  onMinimize,
  onRemove
}) => {
  const defaultPos = position || { 
    x: 100 + ((toolId?.charCodeAt?.(0) || 0) % 300), 
    y: 100 
  };
  const [localMinimized, setLocalMinimized] = useState(isMinimized);

  useEffect(() => {
    setLocalMinimized(isMinimized);
  }, [isMinimized]);

  const handleDragEnd = (newPosition) => {
    if (onPositionChange) {
      onPositionChange(toolId, newPosition);
    }
  };

  const handleMinimize = (e) => {
    e.stopPropagation();
    const newMinimized = !localMinimized;
    setLocalMinimized(newMinimized);
    if (onMinimize) {
      onMinimize();
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <Draggable
      defaultPosition={defaultPos}
      position={position}
      onDragEnd={handleDragEnd}
      className={`draggable-tool ${localMinimized ? 'tool-minimized' : ''}`}
      showHandle={false}
      constraints={{
        left: 0,
        right: window.innerWidth - 200,
        top: 0,
        bottom: window.innerHeight - 100
      }}
    >
      <div className="tool-wrapper">
        <div className="tool-header">
          <div className="tool-controls">
            <button
              className="tool-control-btn"
              onClick={handleMinimize}
              title={localMinimized ? 'Restore' : 'Minimize'}
            >
              <Minus size={14} />
            </button>
            <button
              className="tool-control-btn tool-close-btn"
              onClick={handleRemove}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        {!localMinimized && (
          <div className="tool-content">
            {children}
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default DraggableTool;
