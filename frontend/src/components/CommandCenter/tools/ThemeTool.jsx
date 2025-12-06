// components/CommandCenter/tools/ThemeTool.jsx
import React from 'react';
import ToolTemplate from './ToolTemplate';

const ThemeTool = ({ compact }) => {
  return (
    <ToolTemplate
      icon="🎨"
      title="Theme"
      description="Switch between light and dark themes"
      compact={compact}
    >
      <div className="theme-tool-content">
        <p>Theme switcher coming soon</p>
      </div>
    </ToolTemplate>
  );
};

ThemeTool.toolId = 'theme';
ThemeTool.toolName = 'Theme';
ThemeTool.toolIcon = '🎨';
ThemeTool.toolDescription = 'Switch between light and dark themes';

export default ThemeTool;
