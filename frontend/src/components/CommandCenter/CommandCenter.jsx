// components/CommandCenter/CommandCenter.jsx
import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import ToolPalette from './ToolPalette';
import DraggableTool from './DraggableTool';
import tools from './tools';
import '../Common/css/commandCenter.css';



const CommandCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [minimizedTools, setMinimizedTools] = useState({});
  
  // Initialize directly from localStorage
  const [activeTools, setActiveTools] = useState(() => {
    try {
      const saved = localStorage.getItem('evermind_active_tools');
      return saved ? JSON.parse(saved) : ['timer'];
    } catch {
      return ['timer'];
    }
  });
  
  const [toolPositions, setToolPositions] = useState(() => {
    try {
      const saved = localStorage.getItem('evermind_tool_positions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  

  // Save to localStorage when tools change
  useEffect(() => {
    localStorage.setItem('evermind_active_tools', JSON.stringify(activeTools));
  }, [activeTools]);
  
  // Save to localStorage when positions change
  useEffect(() => {
    localStorage.setItem('evermind_tool_positions', JSON.stringify(toolPositions));
  }, [toolPositions]);
  

  
  const toggleTool = (toolId) => {
    if (activeTools.includes(toolId)) {
      setActiveTools(prev => prev.filter(id => id !== toolId));
    } else {
      setActiveTools(prev => [...prev, toolId]);
    }
  };
  
  const updateToolPosition = (toolId, position) => {
    setToolPositions(prev => ({
      ...prev,
      [toolId]: position
    }));
  };
  
  const resetPositions = () => {
    setToolPositions({});
  };
  
  return (
    <>
      {/* Floating Trigger Button */}
      <Motion.button
        className="command-center-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        drag
        dragConstraints={{ 
          left: 0, 
          right: window.innerWidth - 60,
          top: 0, 
          bottom: window.innerHeight - 60 
        }}
        dragElastic={0.1}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
      >
        <Settings size={24} />
      </Motion.button>
      
      {/* Tool Palette Modal */}
      <AnimatePresence>
        {isOpen && (
          <ToolPalette
            activeTools={activeTools}
            availableTools={tools}
            onToggleTool={toggleTool}
            onClose={() => setIsOpen(false)}
            onResetPositions={resetPositions}
          />
        )}
      </AnimatePresence>
      
      {/* Active Draggable Tools */}
      {activeTools.map(toolId => {
        const ToolComponent = tools[toolId];
        if (!ToolComponent) return null;
        
        return (
          <DraggableTool
            key={toolId}
            toolId={toolId}
            isMinimized={minimizedTools[toolId] || false}
            position={toolPositions[toolId]}
            onPositionChange={updateToolPosition}
            onMinimize={() => {
              setMinimizedTools(prev => ({
                ...prev,
                [toolId]: !prev[toolId]
              }));
            }}
            onRemove={() => toggleTool(toolId)}
          >
            <ToolComponent />
          </DraggableTool>
        );
      })}
    </>
  );
};

export default CommandCenter;