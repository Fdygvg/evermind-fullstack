// src/components/action-button/components/FabSpeedDial.jsx
import React, { useState, useRef } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import FabItem from './FabItem';
import TimerSetupModal from './TimerSetupModal';
import { TimerIcon } from './shared/icons';
import useClickOutside from '../hooks/useClickOutside';
import useFabAnimation from '../hooks/useFabAnimation';
import { useTimer } from '../contexts/TimerContext';
import '../styles/FabSpeedDial.css';

const FabSpeedDial = ({ mode = 'normal' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const fabRef = useRef(null);

  // Get timer context
  const timer = useTimer();

  useClickOutside(fabRef, () => setIsOpen(false));
  const { getItemAnimationStyle } = useFabAnimation(isOpen);

  // Build menu items based on timer state
  const menuItems = [
    {
      id: 'timer',
      label: timer.isTimerActive ? 'Timer' : 'Set Timer',
      icon: TimerIcon,
      onClick: () => setShowTimerModal(true),
      active: timer.isTimerActive,
    },
  ];

  // Handle timer modal save - starts the timer via context
  const handleTimerSave = (config) => {
    console.log('[FabSpeedDial] Starting timer with config:', config);
    timer.startTimer(config);
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
              active={item.active}
            />
          </div>
        ))}

        <button
          className={`fab-main ${isOpen ? 'fab-main--open' : ''} ${timer.isTimerActive ? 'fab-main--timer-active' : ''}`}
          onClick={handleFabClick}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close action menu' : 'Open action menu'}
        >
          <span className="fab-main-icon">
            {isOpen ? <FaTimes /> : <FaPlus />}
          </span>
          {/* Timer indicator badge */}
          {timer.isTimerActive && !isOpen && (
            <span className="fab-timer-badge" title="Timer active">
              ⏱️
            </span>
          )}
        </button>
      </div>

      {/* Timer Setup Modal */}
      <TimerSetupModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        onSave={handleTimerSave}
        initialConfig={timer.timerConfig}
        isTimerActive={timer.isTimerActive}
        onStopTimer={() => timer.stopTimer()}
      />
    </>
  );
};

export default FabSpeedDial;