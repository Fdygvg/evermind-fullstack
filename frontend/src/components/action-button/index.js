// src/components/action-button/index.js
// Main entry point for the action-button component

// Main Components
export { default as FabSpeedDial } from './components/FabSpeedDial';
export { default as FabItem } from './components/FabItem';
export { default as TimerDisplay } from './components/TimerDisplay';
export { default as TimerSetupModal } from './components/TimerSetupModal';

// Shared Components
export { default as Button } from './components/shared/Button';
export { default as Modal } from './components/shared/Modal';

// Icons
export { TimerIcon } from './components/shared/icons';

// Context
export { TimerProvider, useTimer } from './contexts/TimerContext';

// Hooks
export { default as useClickOutside } from './hooks/useClickOutside';
export { default as useFabAnimation } from './hooks/useFabAnimation';

// Services
export { getTimerStrategy, createSingleQuestionStrategy, createEliminationStrategy } from './services/timerStrategies';
export { MENU_ITEMS } from './services/fabConfig';
export {
    DEFAULT_DURATIONS,
    MARK_LABELS,
    LOCAL_STORAGE_KEYS,
    ANIMATION_DELAYS,
    TIMER_WARNING_THRESHOLDS
} from './services/constants';

// Default export is the main FAB component
export { default } from './components/FabSpeedDial';
