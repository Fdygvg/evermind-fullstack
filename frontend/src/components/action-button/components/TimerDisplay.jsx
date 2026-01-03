// src/components/action-button/components/TimerDisplay.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FaPlay, FaPause, FaRedo } from 'react-icons/fa';
import '../styles/timerDisplay.css';

const TimerDisplay = ({
  duration = 30,
  isActive = false,
  onTimerEnd,
  position = 'top-right'
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(isActive);
  const [isLowTime, setIsLowTime] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  // Format seconds to MM:SS
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle timer end
  useEffect(() => {
    if (timeLeft <= 0 && isRunning) {
      setIsRunning(false);
      if (onTimerEnd) onTimerEnd();
    }
  }, [timeLeft, isRunning, onTimerEnd]);

  // Update warning states
  useEffect(() => {
    const totalTime = duration;
    const percentageLeft = timeLeft / totalTime;

    setIsCritical(percentageLeft <= 0.1); // Last 10%
    setIsLowTime(percentageLeft <= 0.3); // Last 30%
  }, [timeLeft, duration]);

  // Timer countdown logic
  useEffect(() => {
    let intervalId;

    if (isRunning && timeLeft > 0) {
      const startTime = Date.now();
      const expectedEndTime = startTime + timeLeft * 1000;

      intervalId = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((expectedEndTime - now) / 1000));

        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(intervalId);
        }
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, timeLeft]);

  // Reset timer when duration changes
  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  // Start/stop timer
  const handleToggle = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTimeLeft(duration);
    setIsRunning(false);
  };

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

  // Get progress percentage for CSS variable
  const progressPercentage = (timeLeft / duration) * 100;

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
          <button
            className="timer-btn timer-btn--toggle"
            onClick={handleToggle}
            aria-label={isRunning ? 'Pause timer' : 'Start timer'}
            title={isRunning ? 'Pause timer' : 'Start timer'}
          >
            {isRunning ? <FaPause /> : <FaPlay />}
          </button>

          <button
            className="timer-btn timer-btn--reset"
            onClick={handleReset}
            aria-label="Reset timer"
            title="Reset timer"
          >
            <FaRedo />
          </button>
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