// src/components/action-button/components/FabSpeedDial.jsx (final update for Phase 2)
import React, { useState, useRef, useEffect } from 'react';
import FabItem from './FabItem';
import TimerSetupModal from './TimerSetupModal';
import TimerDisplay from './TimerDisplay';
import { TimerIcon } from './shared/icons';
import useClickOutside from '../hooks/useClickOutside';
import useFabAnimation from '../hooks/useFabAnimation';
import '../styles/FabSpeedDial.css';

const FabSpeedDial = ({ mode = 'normal' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerConfig, setTimerConfig] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const fabRef = useRef(null);

  // Load saved timer config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('timerConfig');
    if (savedConfig) {
      try {
        setTimerConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Failed to parse saved timer config:', e);
      }
    }
  }, []);

  useClickOutside(fabRef, () => setIsOpen(false));
  const { getItemAnimationStyle } = useFabAnimation(isOpen);

  const menuItems = [
    {
      id: 'timer',
      label: timerConfig ? 'Timer' : 'Set Timer',
      icon: TimerIcon,
      onClick: () => setShowTimerModal(true),
    },
  ];

  const handleTimerSave = (config) => {
    setTimerConfig(config);
    setIsTimerActive(true);

    // Save to localStorage
    localStorage.setItem('timerConfig', JSON.stringify(config));
  };

  const handleTimerEnd = () => {
    console.log('Timer ended! Auto-marking question...');
    setIsTimerActive(false);
    // TODO: Trigger auto-mark logic
  };

  const handleFabClick = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item) => {
    item.onClick();
    setIsOpen(false);
  };

  return (
    <>
      {/* Timer Display (only shown when timer is active) */}
      {timerConfig && isTimerActive && (
        <TimerDisplay
          duration={timerConfig.duration}
          isActive={isTimerActive}
          onTimerEnd={handleTimerEnd}
          position="top-right"
        />
      )}

      {/* FAB Menu */}
      <div className="fab-container" ref={fabRef}>
        {menuItems.map((item, index) => (
          <div
            key={item.id}
            className="fab-item-wrapper"
            style={getItemAnimationStyle(index)}
          >
            <FabItem
              icon={item.icon}
              label={item.label}
              onClick={() => handleItemClick(item)}
              isVisible={isOpen}
            />
          </div>
        ))}

        <button
          className={`fab-main ${isOpen ? 'fab-main--open' : ''}`}
          onClick={handleFabClick}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close action menu' : 'Open action menu'}
        >
          <span className="fab-main-icon">
            {isOpen ? '×' : '+'}
          </span>
        </button>
      </div>

      {/* Timer Setup Modal */}
      <TimerSetupModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        onSave={handleTimerSave}
        initialConfig={timerConfig}
      />
    </>
  );
};

export default FabSpeedDial;