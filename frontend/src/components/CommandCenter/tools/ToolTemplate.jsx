import React from 'react';
import '../../Common/css/toolTemplate.css';

const ToolTemplate = ({
  icon = '⚙️',
  title = 'Tool Name',
  description = 'Tool description',
  children,
  compact = false
}) => {
  return (
    <div className={`tool-template ${compact ? 'compact' : ''}`}>
      <div className="tool-header">
        <span className="tool-icon">{icon}</span>
        <div className="tool-title">
          <h4>{title}</h4>
          {!compact && <p className="tool-desc">{description}</p>}
        </div>
      </div>
      
      <div className="tool-body">
        {children}
      </div>
    </div>
  );
};

export default ToolTemplate;