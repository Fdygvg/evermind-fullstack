// src/components/action-button/components/TimerSetupModal.jsx
import React, { useState, useEffect } from 'react';
import {
  FaClock,
  FaDizzy,
  FaFrown,
  FaMeh,
  FaSmile,
  FaFire,
  FaQuestionCircle
} from 'react-icons/fa';
import Modal from './shared/Modal';
import Button from './shared/Button';
import '../styles/timerSetupModal.css';

const TimerSetupModal = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
  isTimerActive = false,
  onStopTimer
}) => {
  const [duration, setDuration] = useState(initialConfig?.duration || 30);
  const [defaultMark, setDefaultMark] = useState(initialConfig?.defaultMark || 3);

  // Update local state when initialConfig changes
  useEffect(() => {
    if (initialConfig) {
      setDuration(initialConfig.duration || 30);
      setDefaultMark(initialConfig.defaultMark || 3);
    }
  }, [initialConfig]);

  const durations = [15, 30, 45, 60, 90, 120, 180, 300];
  const marks = [1, 2, 3, 4, 5];

  const handleSave = () => {
    onSave({
      duration,
      defaultMark,
    });
    onClose();
  };

  const handleStop = () => {
    if (onStopTimer) {
      onStopTimer();
    }
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) {
      return `${mins} min`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMarkInfo = (mark) => {
    const info = {
      1: { label: 'Again', icon: <FaDizzy />, color: '#ef4444' },
      2: { label: 'Hard', icon: <FaFrown />, color: '#f97316' },
      3: { label: 'Good', icon: <FaMeh />, color: '#22c55e' },
      4: { label: 'Easy', icon: <FaSmile />, color: '#3b82f6' },
      5: { label: 'Master', icon: <FaFire />, color: '#8b5cf6' },
    };
    return info[mark] || { label: 'Unknown', icon: <FaQuestionCircle />, color: '#999' };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Timer Settings">
      <div className="timer-modal">
        <h2 className="timer-modal-title">
          <FaClock className="timer-title-icon" />
          {isTimerActive ? 'Timer Active' : 'Set Timer'}
        </h2>

        {/* Active Timer Status */}
        {isTimerActive && (
          <div className="timer-active-notice">
            <span className="timer-active-badge">Timer is running</span>
            <p>You can update settings or stop the timer.</p>
          </div>
        )}

        {/* Duration Section */}
        <div className="timer-section">
          <h3 className="timer-section-title">Duration per Question</h3>
          <div className="duration-display">
            <span className="duration-value">{formatTime(duration)}</span>
          </div>

          <div className="duration-slider">
            <input
              type="range"
              min="15"
              max="300"
              step="15"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="slider"
              aria-label="Timer duration in seconds"
            />
          </div>

          <div className="duration-presets">
            {durations.map((time) => (
              <Button
                key={time}
                variant={duration === time ? 'primary' : 'outline'}
                size="small"
                onClick={() => setDuration(time)}
                className="duration-preset-btn"
              >
                {formatTime(time)}
              </Button>
            ))}
          </div>
        </div>

        {/* Default Mark Section */}
        <div className="timer-section">
          <h3 className="timer-section-title">Auto-Mark When Timer Ends</h3>
          <p className="timer-section-description">
            If you don't rate before time runs out, it will automatically be rated as:
          </p>

          <div className="mark-selector">
            {marks.map((mark) => {
              const info = getMarkInfo(mark);
              return (
                <button
                  key={mark}
                  className={`mark-option ${defaultMark === mark ? 'mark-option--selected' : ''}`}
                  onClick={() => setDefaultMark(mark)}
                  aria-label={`Mark ${mark} - ${info.label}`}
                  aria-pressed={defaultMark === mark}
                  style={defaultMark === mark ? { borderColor: info.color } : {}}
                >
                  <span className="mark-icon" style={{ color: info.color }}>{info.icon}</span>
                  <span className="mark-number">{mark}</span>
                  <span className="mark-label">{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="timer-modal-actions">
          {isTimerActive && onStopTimer && (
            <Button
              variant="danger"
              onClick={handleStop}
              className="timer-modal-btn"
            >
              Stop Timer
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="timer-modal-btn"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="timer-modal-btn"
          >
            {isTimerActive ? 'Update Timer' : 'Start Timer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TimerSetupModal;
