// components/CommandCenter/tools/AITool.jsx
import React from 'react';
import ToolTemplate from './ToolTemplate';

const AITool = ({ compact }) => {
  return (
    <ToolTemplate
      icon="🤖"
      title="AI Assistant"
      description="Get AI-powered hints and explanations"
      compact={compact}
    >
      <div className="ai-tool-content">
        <p>AI assistant coming soon</p>
      </div>
    </ToolTemplate>
  );
};

AITool.toolId = 'ai';
AITool.toolName = 'AI Assistant';
AITool.toolIcon = '🤖';
AITool.toolDescription = 'Get AI-powered hints and explanations';

export default AITool;
