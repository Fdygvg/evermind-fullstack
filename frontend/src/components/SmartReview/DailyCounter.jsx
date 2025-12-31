import React from 'react';
import '../Common/css/dailyCounter.css';

const DailyCounter = ({ 
  current, 
  total, 
  showProgressBar = true,
  trackBreakdown = null // { new: 0, pending: 0, review: 0 }
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  const getStatus = () => {
    if (percentage >= 100) return 'complete';
    if (percentage >= 75) return 'high';
    if (percentage >= 50) return 'medium';
    if (percentage >= 25) return 'low';
    return 'very-low';
  };

  const status = getStatus();
  const remaining = Math.max(0, total - current);

  return (
    <div className="daily-counter">
      <div className="counter-header">
        <h3 className="counter-title">Today's Progress</h3>
        <div className="counter-stats">
          <span className="current">{current}</span>
          <span className="separator">/</span>
          <span className="total">{total}</span>
          <span className="questions-label">questions</span>
        </div>
      </div>

      {/* THREE-TRACK BREAKDOWN */}
      {trackBreakdown && (trackBreakdown.new > 0 || trackBreakdown.pending > 0 || trackBreakdown.review > 0) && (
        <div className="track-breakdown">
          {trackBreakdown.new > 0 && (
            <div className="track-item track-new">
              <span className="track-badge">NEW</span>
              <span className="track-count">{trackBreakdown.new}</span>
            </div>
          )}
          {trackBreakdown.pending > 0 && (
            <div className="track-item track-pending">
              <span className="track-badge">PENDING</span>
              <span className="track-count">{trackBreakdown.pending}</span>
            </div>
          )}
          {trackBreakdown.review > 0 && (
            <div className="track-item track-review">
              <span className="track-badge">REVIEW</span>
              <span className="track-count">{trackBreakdown.review}</span>
            </div>
          )}
        </div>
      )}

      {showProgressBar && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className={`progress-fill progress-${status}`}
              style={{ width: `${percentage}%` }}
            >
              <span className="progress-text">
                {percentage}%
              </span>
            </div>
          </div>
          
          <div className="progress-labels">
            <span className="progress-label start">0</span>
            <span className="progress-label middle">{Math.floor(total / 2)}</span>
            <span className="progress-label end">{total}</span>
          </div>
        </div>
      )}

      <div className="counter-footer">
        <div className="remaining-info">
          <span className="remaining-count">{remaining}</span>
          <span className="remaining-text">questions remaining today</span>
        </div>
        
        <div className="status-indicator">
          <div className={`status-dot status-${status}`}></div>
          <span className="status-text">
            {status === 'complete' ? 'Complete!' :
             status === 'high' ? 'Almost there!' :
             status === 'medium' ? 'Halfway!' :
             status === 'low' ? 'Getting started' : 'Begin'}
          </span>
        </div>
      </div>

      {remaining === 0 && current > 0 && (
        <div className="completion-message">
          🎉 Amazing! You've completed today's review!
        </div>
      )}
    </div>
  );
};

export default DailyCounter;