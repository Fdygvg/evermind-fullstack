// src/components/action-button/components/TimerDisplay.jsx
import React, { useMemo } from 'react';
import { FaPause, FaPlay, FaStop } from 'react-icons/fa';
import '../styles/timerDisplay.css';

/**
 * TimerDisplay - Shows countdown timer with controls
 * Can work in two modes:
 * 1. Controlled: Parent provides timeLeft and callbacks
 * 2. Uncontrolled: Manages its own timer state (legacy)
 */
const TimerDisplay = ({
  duration = 30,
  timeLeft: externalTimeLeft,
  isRunning = true,
  onToggle,
  onReset,
  onStop,
  position = 'top-right'
}) => {
  // Use external timeLeft if provided, otherwise duration
  const timeLeft = externalTimeLeft !== undefined ? externalTimeLeft : duration;

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate warning states
  const { isLowTime, isCritical, progressPercentage } = useMemo(() => {
    const percentageLeft = duration > 0 ? timeLeft / duration : 0;
    return {
      isLowTime: percentageLeft <= 0.3 && percentageLeft > 0.1,
      isCritical: percentageLeft <= 0.1,
      progressPercentage: percentageLeft * 100
    };
  }, [timeLeft, duration]);

  // Get appropriate class based on state
  const getTimerClass = () => {
    let className = 'timer-display';

    if (position === 'top-right') className += ' timer-display--top-right';
    if (position === 'top-left') className += ' timer-display--top-left';
    if (position === 'top-center') className += ' timer-display--top-center';

    if (isCritical) className += ' timer-display--critical';
    else if (isLowTime) className += ' timer-display--low';

    if (!isRunning) className += ' timer-display--paused';

    return className;
  };

  return (
    <div
      className={getTimerClass()}
      style={{ '--timer-progress': `${progressPercentage}%` }}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="timer-content">
        <div className="timer-time">
          {formatTime(timeLeft)}
        </div>

        <div className="timer-controls">
          {onToggle && (
            <button
              className="timer-btn timer-btn--toggle"
              onClick={onToggle}
              aria-label={isRunning ? 'Pause timer' : 'Resume timer'}
              title={isRunning ? 'Pause timer' : 'Resume timer'}
            >
              {isRunning ? <FaPause /> : <FaPlay />}
            </button>
          )}

          {onStop && (
            <button
              className="timer-btn timer-btn--reset"
              onClick={onStop}
              aria-label="Stop timer"
              title="Stop timer"
            >
              <FaStop />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="timer-progress-bar">
        <div className="timer-progress-fill" />
      </div>
    </div>
  );
};

export default TimerDisplay;