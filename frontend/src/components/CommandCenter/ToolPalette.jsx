// components/CommandCenter/ToolPalette.jsx
import React from 'react';
import { motion as Motion } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';


const ToolPalette = ({ activeTools, availableTools, onToggleTool, onClose, onResetPositions }) => {
  // Get tool metadata from availableTools
  const getToolMetadata = (toolId) => {
    const ToolComponent = availableTools[toolId];
    if (!ToolComponent) return null;
    
    return {
      id: ToolComponent.toolId || toolId,
      name: ToolComponent.toolName || toolId,
      icon: ToolComponent.toolIcon || '⚙️',
      description: ToolComponent.toolDescription || 'Tool description'
    };
  };

  // Get all available tool IDs from the tools export
  const toolIds = Object.keys(availableTools).filter(key => {
    const Tool = availableTools[key];
    return Tool && (Tool.toolId || typeof Tool === 'function');
  });

  return (
    <>
      {/* Overlay */}
      <MIDIConnectionEventotion.div
        className="tool-palette-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <Motion.div
        className="tool-palette"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="palette-header">
          <h3>🎛️ Command Center</h3>
          <div className="palette-header-actions">
            {onResetPositions && (
              <button
                className="palette-action-btn"
                onClick={onResetPositions}
                title="Reset tool positions"
              >
                <RotateCcw size={18} />
              </button>
            )}
            <button
              className="palette-close-btn"
              onClick={onClose}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Tools List */}
        <div className="tools-list">
          {toolIds.map(toolId => {
            const metadata = getToolMetadata(toolId);
            if (!metadata) return null;
            
            const isActive = activeTools.includes(toolId);
            
            return (
              <div
                key={toolId}
                className={`tool-item ${isActive ? 'active' : ''}`}
              >
                <div className="tool-item-info">
                  <span className="tool-icon">{metadata.icon}</span>
                  <div className="tool-item-details">
                    <h4>{metadata.name}</h4>
                    <p>{metadata.description}</p>
                  </div>
                </div>
                <label className="tool-toggle">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => onToggleTool(toolId)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            );
          })}
        </div>
      </Motion.div>
    </>
  );
};

export default ToolPalette;