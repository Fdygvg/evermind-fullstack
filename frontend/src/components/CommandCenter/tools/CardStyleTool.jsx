// components/CommandCenter/tools/CardStyleTool.jsx
import React from 'react';
import ToolTemplate from './ToolTemplate';

const CardStyleTool = ({ compact }) => {
  return (
    <ToolTemplate
      icon="🎴"
      title="Card Style"
      description="Switch between flashcard and normal mode"
      compact={compact}
    >
      <div className="card-style-tool-content">
        <p>Card style toggle coming soon</p>
      </div>
    </ToolTemplate>
  );
};

CardStyleTool.toolId = 'cardStyle';
CardStyleTool.toolName = 'Card Style';
CardStyleTool.toolIcon = '🎴';
CardStyleTool.toolDescription = 'Switch between flashcard and normal card mode';

export default CardStyleTool;
