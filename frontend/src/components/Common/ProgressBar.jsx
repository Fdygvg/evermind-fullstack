import React from 'react';
import './css/progressBar.css';

const ProgressBar = ({ current, total, correct, wrong, height = 12 }) => {
  const progress = total > 0 ? (current / total) * 100 : 0;
  const correctPercentage = total > 0 ? (correct / total) * 100 : 0;
  const wrongPercentage = total > 0 ? (wrong / total) * 100 : 0;
  
  return (
    <div className="progress-bar-container">
      {/* Stats Display */}
      <div className="progress-stats">
        <div className="stat-item">
          <span className="stat-number">{current}/{total}</span>
          <span className="stat-label">Progress</span>
        </div>
        <div className="stat-item correct-stat">
          <span className="stat-number">{correct}</span>
          <span className="stat-label">Correct</span>
        </div>
        <div className="stat-item wrong-stat">
          <span className="stat-number">{wrong}</span>
          <span className="stat-label">Wrong</span>
        </div>
      </div>
      
      {/* Main Progress Bar */}
      <div className="progress-bar-wrapper" style={{ height: `${height}px` }}>
        <div 
          className="progress-bar-background"
          style={{ height: `${height}px` }}
        >
          {/* Correct Progress (Green) */}
          <div 
            className="progress-segment correct-progress"
            style={{ width: `${correctPercentage}%` }}
          ></div>
          
          {/* Wrong Progress (Red) */}
          <div 
            className="progress-segment wrong-progress"
            style={{ width: `${wrongPercentage}%` }}
          ></div>
          
          {/* Remaining Progress (Gray) */}
          <div 
            className="progress-segment remaining-progress"
            style={{ width: `${100 - progress}%` }}
          ></div>
        </div>
        
        {/* Progress Indicator */}
        <div 
          className="progress-indicator"
          style={{ 
            left: `${progress}%`,
            height: `${height + 8}px`,
            width: `${height + 8}px`
          }}
        >
          <div className="indicator-glow"></div>
        </div>
      </div>
      
      {/* Percentage Display */}
      <div className="progress-percentage">
        {Math.round(progress)}% Complete
      </div>
    </div>
  );
};

export default ProgressBar;