// src/components/action-button/components/TimerSetupModal.jsx
import React, { useState } from 'react';
import Modal from './shared/Modal';
import Button from './shared/Button';
import '../styles/timerSetupModal.css';

const TimerSetupModal = ({ isOpen, onClose, onSave, initialConfig }) => {
  const [duration, setDuration] = useState(initialConfig?.duration || 30);
  const [defaultMark, setDefaultMark] = useState(initialConfig?.defaultMark || 3);

  const durations = [15, 30, 45, 60, 90, 120];
  const marks = [1, 2, 3, 4, 5];

  const handleSave = () => {
    onSave({
      duration,
      defaultMark,
    });
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Timer Settings">
      <div className="timer-modal">
        <h2 className="timer-modal-title">Set Timer</h2>

        {/* Duration Section */}
        <div className="timer-section">
          <h3 className="timer-section-title">Duration</h3>
          <div className="duration-display">
            <span className="duration-value">{formatTime(duration)}</span>
            <span className="duration-label">minutes</span>
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
            If you don't mark a question before time runs out, it will automatically be marked as:
          </p>

          <div className="mark-selector">
            {marks.map((mark) => (
              <button
                key={mark}
                className={`mark-option ${defaultMark === mark ? 'mark-option--selected' : ''}`}
                onClick={() => setDefaultMark(mark)}
                aria-label={`Mark ${mark}`}
                aria-pressed={defaultMark === mark}
              >
                <span className="mark-number">{mark}</span>
                <span className="mark-label">
                  {mark === 1 ? 'Again' :
                    mark === 2 ? 'Hard' :
                      mark === 3 ? 'Good' :
                        mark === 4 ? 'Easy' :
                          'Master'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="timer-modal-actions">
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
            Start Timer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TimerSetupModal;

