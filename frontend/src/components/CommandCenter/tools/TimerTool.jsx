// components/CommandCenter/tools/TimerTool.jsx
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import ToolTemplate from './ToolTemplate';

const TimerTool = ({ compact }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(1500); // 25 minutes in seconds
  const [selectedPreset, setSelectedPreset] = useState('pomodoro');
  
  const presets = {
    pomodoro: 1500, // 25 min
    short: 300,     // 5 min
    long: 600,      // 10 min
    focus: 3600     // 60 min
  };
  
  useEffect(() => {
    let interval;
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime(prev => prev - 1);
      }, 1000);
    } else if (time === 0) {
      setIsRunning(false);
      // Play sound notification
    }
    return () => clearInterval(interval);
  }, [isRunning, time]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handlePreset = (presetKey) => {
    setSelectedPreset(presetKey);
    setTime(presets[presetKey]);
    setIsRunning(false);
  };
  
  return (
    <ToolTemplate
      icon="🕒"
      title="Timer"
      description="Pomodoro timer for focused sessions"
      compact={compact}
    >
      {!compact && (
        <div className="preset-buttons">
          {Object.keys(presets).map(key => (
            <button
              key={key}
              className={`preset-btn ${selectedPreset === key ? 'active' : ''}`}
              onClick={() => handlePreset(key)}
            >
              {key}
            </button>
          ))}
        </div>
      )}
      
      <div className="timer-display">
        <span className="time">{formatTime(time)}</span>
        <div className="timer-controls">
          <button 
            className="timer-btn"
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button 
            className="timer-btn"
            onClick={() => {
              setTime(presets[selectedPreset]);
              setIsRunning(false);
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </ToolTemplate>
  );
};

TimerTool.toolId = 'timer';
TimerTool.toolName = 'Timer';
TimerTool.toolIcon = '🕒';
TimerTool.toolDescription = 'Pomodoro timer for focused study sessions';

export default TimerTool;