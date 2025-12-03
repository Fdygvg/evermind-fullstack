// components/Common/SessionStatsBar.jsx
import React, { useState, useEffect } from 'react';
import { Flame, Timer, Target, BarChart } from 'lucide-react';

const ProgressBar = ({
  currentStreak = 0,
  sessionTime = 0, // in seconds
  currentCount = 0,
  totalCount = 0,
  correctCount = 0,
  wrongCount = 0,
  showAccuracy = true,
  showTimer = true,
  compact = false
}) => {
  const [animatedStreak, setAnimatedStreak] = useState(currentStreak);
  const [previousStreak, setPreviousStreak] = useState(currentStreak);

  // Animate streak increase
  useEffect(() => {
    if (currentStreak > previousStreak) {
      setAnimatedStreak(currentStreak);
      // Trigger animation
      const timer = setTimeout(() => {
        setPreviousStreak(currentStreak);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentStreak, previousStreak]);

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

  // Progress percentage
  const progress = totalCount > 0 
    ? Math.round((currentCount / totalCount) * 100)
    : 0;

  return (
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
            <span className="stat-value">{formatTime(sessionTime)}</span>
            {!compact && <span className="stat-label">Time</span>}
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="stat-item progress-item">
        <BarChart className="stat-icon" size={compact ? 16 : 20} />
        <div className="stat-content">
          <span className="stat-value">{currentCount}/{totalCount}</span>
          {!compact && (
            <>
              <span className="stat-label">Progress</span>
              <div className="progress-bar-mini">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
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
  );
};

export default ProgressBar;