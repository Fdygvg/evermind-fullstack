import React, { useState, useEffect, useRef } from "react";
import { FaPlay, FaPause, FaClock } from "react-icons/fa";
// import "./Timer.css"; // Your styling here

const MultiTimer = () => {
  // Main Timer
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Secondary Timer
  const [showSecondary, setShowSecondary] = useState(false);
  const [secondaryStart, setSecondaryStart] = useState(10); // default 10 sec
  const [secondaryTime, setSecondaryTime] = useState(0);
  const [secondaryRunning, setSecondaryRunning] = useState(false);

  const mainTimerRef = useRef(null);
  const secondaryTimerRef = useRef(null);

  // Formatting time
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Main timer logic
  useEffect(() => {
    if (isRunning) {
      mainTimerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else clearInterval(mainTimerRef.current);
    return () => clearInterval(mainTimerRef.current);
  }, [isRunning]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => setSeconds(0);

  // Secondary timer logic
  useEffect(() => {
    if (secondaryRunning) {
      secondaryTimerRef.current = setInterval(() => {
        setSecondaryTime((prev) => {
          if (prev <= 1) return secondaryStart; // restart
          return prev - 1;
        });
      }, 1000);
    } else clearInterval(secondaryTimerRef.current);
    return () => clearInterval(secondaryTimerRef.current);
  }, [secondaryRunning, secondaryStart]);

  const handleSecondaryClick = () => setSecondaryRunning(false);

  return (
    <div className="timer-container">
      {/* Main Timer */}
      <div className="timer-display">
        <span className="stat-number">{formatTime(seconds)}</span>
        <div className="timer-controls">
          <button className="timer-btn" onClick={toggleTimer} title={isRunning ? 'Pause timer' : 'Resume timer'}>
            {isRunning ? <FaPause /> : <FaPlay />}
          </button>
          <button className="timer-btn reset-btn" onClick={resetTimer} title="Reset timer">
          💫
          </button>
          <button className="timer-btn" onClick={() => setShowSecondary(!showSecondary)} title="Toggle secondary timer">
            <FaClock />
          </button>
        </div>
        <span className="stat-label">Time</span>
      </div>

      {/* Secondary Timer */}
      {showSecondary && (
        <div className="secondary-timer">
          <input
            type="range"
            min="1"
            max="60"
            value={secondaryStart}
            onChange={(e) => setSecondaryStart(Number(e.target.value))}
          />
          <button onClick={() => { setSecondaryTime(secondaryStart); setSecondaryRunning(true); }}>Start</button>
          {secondaryRunning && (
            <div
              className="countdown-display"
              style={{ color: secondaryTime <= 5 ? "red" : "green" }}
              onClick={handleSecondaryClick}
            >
              {secondaryTime}s
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiTimer;
