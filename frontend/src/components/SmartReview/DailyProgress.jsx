import React, { useState, useEffect } from 'react';
import { Flame, Timer, Target, BarChart } from 'lucide-react';
import '../css/dailyProgress.css';

const DailyProgress = ({
  current,
  total,
  showProgressBar = true,
  trackBreakdown = null, // { new: 0, pending: 0, review: 0 }
  // Session stats props (from ProgressBar)
  currentStreak = 0,
  sessionTime = 0, // in seconds
  correctCount = 0,
  wrongCount = 0,
  showAccuracy = true,
  showTimer = true,
  showStats = true, // Show session stats bar by default
  compact = false,
  title = "Today's Progress",
  subtitle = "questions remaining today"
}) => {
  const [animatedStreak, setAnimatedStreak] = useState(currentStreak);
  const [previousStreak, setPreviousStreak] = useState(currentStreak);
  const [internalTime, setInternalTime] = useState(0);

  // Internal timer (starts on mount)
  useEffect(() => {
    const timer = setInterval(() => {
      setInternalTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Use prop if provided (>0), otherwise internal
  const displayTime = sessionTime > 0 ? sessionTime : internalTime;

  // Animate streak increase
  useEffect(() => {
    if (currentStreak > previousStreak) {
      setAnimatedStreak(currentStreak);
      const timer = setTimeout(() => {
        setPreviousStreak(currentStreak);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentStreak, previousStreak]);

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

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate accuracy
  const accuracy = correctCount + wrongCount > 0
    ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
    : 0;

  return (
    <div className={`daily-counter ${compact ? 'compact' : ''}`}>
      {/* SESSION STATS BAR */}
      {showStats && (
        <div className={`session-stats-bar ${compact ? 'compact' : ''}`}>
          {/* Streak Counter */}
          <div className="stat-item streak-item">
            <Flame className={`stat-icon ${animatedStreak > 0 ? 'active' : ''}`} size={compact ? 16 : 20} />
            <div className="stat-content">
              <span className={`stat-value ${currentStreak > previousStreak ? 'animate-streak' : ''}`}>
                {currentStreak}
              </span>
              {!compact && <span className="stat-label">Streak</span>}
            </div>
          </div>

          {/* Timer */}
          {showTimer && (
            <div className="stat-item timer-item">
              <Timer className="stat-icon" size={compact ? 16 : 20} />
              <div className="stat-content">
                <span className="stat-value">{formatTime(displayTime)}</span>
                {!compact && <span className="stat-label">Time</span>}
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="stat-item progress-item">
            <BarChart className="stat-icon" size={compact ? 16 : 20} />
            <div className="stat-content">
              <span className="stat-value">{current}/{total}</span>
              {!compact && (
                <>
                  <span className="stat-label">Progress</span>
                  <div className="progress-bar-mini">
                    <div
                      className="progress-fill-mini"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Accuracy */}
          {showAccuracy && (
            <div className="stat-item accuracy-item">
              <Target className="stat-icon" size={compact ? 16 : 20} />
              <div className="stat-content">
                <span className={`stat-value ${accuracy >= 80 ? 'high' : accuracy >= 60 ? 'medium' : 'low'}`}>
                  {accuracy}%
                </span>
                {!compact && <span className="stat-label">Accuracy</span>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="counter-header">
        <h3 className="counter-title">{title}</h3>
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
          <span className="remaining-text">{subtitle}</span>
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

export default DailyProgress;