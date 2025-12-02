import React, { useState, useEffect, useRef } from 'react';
import { FaArrowsSpin, FaPlay, FaPause } from 'react-icons/fa6';
import './css/progressBar.css';

const ProgressBar = ({ current, total, correct, wrong, height = 12 }) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef(null);

  const progress = total > 0 ? (current / total) * 100 : 0;
  const correctPercentage = total > 0 ? (correct / total) * 100 : 0;
  const wrongPercentage = total > 0 ? (wrong / total) * 100 : 0;

  // Format time as MM:SS
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Toggle timer
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Reset timer
  const resetTimer = () => {
    setSeconds(0);
    if (!isRunning) {
      setIsRunning(true);
    }
  };

  return (
    <div className="progress-bar-container">
      {/* Stats Display - Added Timer */}
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
        {/* Timer Stat */}
        <div className="stat-item timer-stat">
          <div className="timer-display">
            <span className="stat-number">{formatTime(seconds)}</span>
            <div className="timer-controls">
              <button 
                className="timer-btn" 
                onClick={toggleTimer}
                title={isRunning ? 'Pause timer' : 'Resume timer'}
              >
                {isRunning ? <FaPause /> : <FaPlay/>}
              </button>
              <button 
                className="timer-btn reset-btn"
                onClick={resetTimer}
                title="Reset timer"
              >
                < FaArrowsSpin/>
              </button>
            </div>
          </div>
          <span className="stat-label">Time</span>
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