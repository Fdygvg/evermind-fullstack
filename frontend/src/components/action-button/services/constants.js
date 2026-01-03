// src/components/action-button/services/constants.js

export const DEFAULT_DURATIONS = [15, 30, 45, 60, 90, 120]; // seconds

export const MARK_LABELS = {
  1: { label: 'Again', color: '#ef4444', emoji: '😣' },
  2: { label: 'Hard', color: '#f97316', emoji: '😓' },
  3: { label: 'Good', color: '#22c55e', emoji: '😊' },
  4: { label: 'Easy', color: '#3b82f6', emoji: '😎' },
  5: { label: 'Master', color: '#8b5cf6', emoji: '🚀' },
};

export const LOCAL_STORAGE_KEYS = {
  TIMER_CONFIG: 'spaced_rep_timer_config',
  TIMER_ACTIVE: 'spaced_rep_timer_active',
};

export const ANIMATION_DELAYS = {
  FAB_ITEM_STAGGER: 0.05, // seconds between items
  MODAL_ENTER: 300, // ms
  TIMER_WARNING: 1000, // ms before auto-mark
};

export const TIMER_WARNING_THRESHOLDS = {
  LOW_TIME: 0.3, // 30% of time left
  CRITICAL_TIME: 0.1, // 10% of time left
  WARN_SECONDS: [30, 15, 10, 5], // Absolute seconds to warn at
};