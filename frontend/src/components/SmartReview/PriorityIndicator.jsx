import React from 'react';
import '../css/priorityIndicator.css';
import { smartReviewService } from '../../services/smartReviewService';

const PriorityIndicator = ({ priority, showLabel = true, size = 'medium' }) => {
  const priorityInfo = smartReviewService.getPriorityInfo(priority);

  if (!priorityInfo) return null;

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'priority-small';
      case 'large': return 'priority-large';
      default: return 'priority-medium';
    }
  };

  return (
    <div className={`priority-indicator ${getSizeClass()} priority-${priority}`}>
      <div
        className="priority-color"
        style={{ backgroundColor: priorityInfo.color }}
      >
        <span className="priority-emoji">{priorityInfo.emoji}</span>
      </div>

      {showLabel && (
        <div className="priority-info">
          <span className="priority-label">{priorityInfo.label}</span>
          <span className="priority-description">{priorityInfo.description}</span>
        </div>
      )}
    </div>
  );
};

export default PriorityIndicator;