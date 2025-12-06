// components/CommandCenter/tools/PositionTool.jsx
import React from 'react';
import { RotateCcw } from 'lucide-react';
import ToolTemplate from './ToolTemplate';

const PositionTool = ({ compact, onResetPositions }) => {
  return (
    <ToolTemplate
      icon="📍"
      title="Reset Positions"
      description="Reset all tool positions to default"
      compact={compact}
    >
      <div className="position-tool-content">
        <button
          className="reset-positions-btn"
          onClick={onResetPositions}
        >
          <RotateCcw size={16} />
          Reset All Positions
        </button>
      </div>
    </ToolTemplate>
  );
};

PositionTool.toolId = 'position';
PositionTool.toolName = 'Reset Positions';
PositionTool.toolIcon = '📍';
PositionTool.toolDescription = 'Reset all tool positions to default';

export default PositionTool;
