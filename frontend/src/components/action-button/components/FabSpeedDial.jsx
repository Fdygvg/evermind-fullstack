// src/components/action-button/components/FabSpeedDial.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FaPlus, FaTimes, FaRobot, FaCompass } from 'react-icons/fa';
import FabItem from './FabItem';
import TimerSetupModal from './TimerSetupModal';
import NotesModal from './NotesModal';
import { TimerIcon, NotesIcon, FocusIcon } from './shared/icons';
import useClickOutside from '../hooks/useClickOutside';
import useFabAnimation from '../hooks/useFabAnimation';
import { useTimer } from '../contexts/TimerContext';
import '../styles/FabSpeedDial.css';

const FabSpeedDial = ({ mode = 'normal', onToggleAI, showAIPanel = false, isNavigating = false, canNavigate = false, onToggleNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
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
    {
      id: 'notes',
      label: 'Notes',
      icon: NotesIcon,
      onClick: () => setShowNotesModal(true),
      active: false,
    },
    {
      id: 'focus',
      label: isFocusMode ? 'Exit Full View' : 'Full View',
      icon: FocusIcon,
      onClick: () => toggleFocusMode(),
      active: isFocusMode,
    },
    ...(onToggleAI ? [{
      id: 'ai',
      label: showAIPanel ? 'Close Code Sage' : 'Ask Code Sage',
      icon: () => <FaRobot style={{ color: showAIPanel ? '#a855f7' : undefined }} />,
      onClick: () => onToggleAI(),
      active: showAIPanel,
    }] : []),
    ...(onToggleNavigate ? [{
      id: 'navigate',
      label: isNavigating ? 'Exit Navigate' : 'Navigate',
      icon: () => <FaCompass style={{ color: isNavigating ? '#06b6d4' : undefined }} />,
      onClick: () => onToggleNavigate(),
      active: isNavigating,
      disabled: !isNavigating && !canNavigate,
    }] : []),
  ];

  // Manage Focus Mode Effect and Cleanup
  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add('focus-mode');
    } else {
      document.body.classList.remove('focus-mode');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('focus-mode');
    };
  }, [isFocusMode]);

  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
  };

  // Handle timer modal save - starts the timer via context
  const handleTimerSave = (config) => {
    console.log('[FabSpeedDial] Starting timer with config:', config);
    timer.startTimer(config);
  };

  const handleFabClick = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item) => {
    if (item.disabled) return;
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
              disabled={item.disabled}
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

      {/* Notes Modal */}
      <NotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
      />
    </>
  );
};

export default FabSpeedDial;