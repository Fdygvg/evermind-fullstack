// components/CommandCenter/tools/ShuffleTool.jsx
import React from 'react';
import { Shuffle } from 'lucide-react';
import ToolTemplate from './ToolTemplate';

const ShuffleTool = ({ compact }) => {
  return (
    <ToolTemplate
      icon="🔀"
      title="Shuffle"
      description="Shuffle questions in session"
      compact={compact}
    >
      <div className="shuffle-tool-content">
        <p>Shuffle functionality coming soon</p>
      </div>
    </ToolTemplate>
  );
};

ShuffleTool.toolId = 'shuffle';
ShuffleTool.toolName = 'Shuffle';
ShuffleTool.toolIcon = '🔀';
ShuffleTool.toolDescription = 'Shuffle questions in your session';

export default ShuffleTool;
