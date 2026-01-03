import timerConfig from '../config/timer.config.js';

/**
 * Feature Types:
 * - 'widget': Spawns a draggable widget (Timer, Pomodoro, Notes)
 * - 'modal': Opens a configuration modal (Settings, Stats)
 * - 'instant': Executes immediately (Shuffle, Change Mode)
 * - 'toggle': Toggle state (Dark Mode, Sound On/Off)
 */
const FeatureTypes = {
  WIDGET: 'widget',
  MODAL: 'modal',
  INSTANT: 'instant',
  TOGGLE: 'toggle',
};

/**
 * Feature Categories for organization
 */
const FeatureCategories = {
  PRODUCTIVITY: 'productivity',
  SESSION_CONTROL: 'session-control',
  APPEARANCE: 'appearance',
  TOOLS: 'tools',
  INTEGRATIONS: 'integrations',
};

/**
 * MAIN FEATURE REGISTRY
 * 
 * Structure for each feature:
 * {
 *   id: string,           // Unique identifier
 *   label: string,        // Display name
 *   icon: string,         // Emoji or icon name
 *   type: FeatureTypes,   // widget, modal, instant, toggle
 *   category: string,     // For grouping in UI
 *   description: string,  // Tooltip or help text
 *   component?: string,   // Component to render (for widgets/modals)
 *   action?: Function,    // Function to execute (for instant features)
 *   config?: Object,      // Default configuration
 *   permissions?: Array,  // When this feature is available
 *   hotkey?: string,      // Keyboard shortcut
 *   disabled?: boolean,   // Temporarily disabled
 * }
 */

const featureRegistry = {
  // ===== PRODUCTIVITY FEATURES =====
  timer: {
    id: 'timer',
    label: 'Timer',
    icon: '⏱️',
    type: FeatureTypes.WIDGET,
    category: FeatureCategories.PRODUCTIVITY,
    description: 'Set a timer to auto-score unanswered questions',
    component: 'TimerWidget', // Maps to TimerWidget.jsx
    
    // Default configuration (merged with user config)
    config: {
      ...timerConfig.defaults,
      widget: {
        title: 'Timer',
        width: 220,
        height: 140,
        defaultPosition: { x: 20, y: 100 },
        resizable: true,
        minimizable: false,
      },
    },
    
    // Permissions: when this feature should be visible
    permissions: ['has-active-session'],
    
    // Keyboard shortcut
    hotkey: 'Ctrl+Shift+T',
    
    // Feature-specific metadata
    metadata: {
      version: '1.0',
      author: 'EVERMIND Team',
      lastUpdated: '2026-01-03',
    },
  },

  // ===== SESSION CONTROL FEATURES =====
  shuffle: {
    id: 'shuffle',
    label: 'Shuffle Questions',
    icon: '🔀',
    type: FeatureTypes.INSTANT,
    category: FeatureCategories.SESSION_CONTROL,
    description: 'Randomize the order of questions in current session',
    
    // Action to execute immediately
    action: 'shuffleQuestions', // This maps to an action in the store
    
    // Permissions: only when questions exist
    permissions: ['has-questions', 'session-started'],
    
    hotkey: 'Ctrl+Shift+S',
  },

  // ===== APPEARANCE FEATURES =====
  theme: {
    id: 'theme',
    label: 'Change Theme',
    icon: '🎨',
    type: FeatureTypes.MODAL,
    category: FeatureCategories.APPEARANCE,
    description: 'Switch between dark, light, and custom themes',
    component: 'ThemePickerModal',
    
    config: {
      availableThemes: ['dark', 'light', 'matrix', 'terminal'],
      currentTheme: 'dark',
    },
    
    permissions: [], // Always available
    hotkey: 'Ctrl+Shift+M',
  },

  // ===== TOOLS FEATURES =====
  notes: {
    id: 'notes',
    label: 'Quick Notes',
    icon: '📝',
    type: FeatureTypes.WIDGET,
    category: FeatureCategories.TOOLS,
    description: 'Floating note pad for session notes',
    component: 'NotesWidget',
    
    config: {
      widget: {
        title: 'Notes',
        width: 300,
        height: 400,
        defaultPosition: { x: 100, y: 200 },
        resizable: true,
      },
    },
    
    permissions: ['has-active-session'],
    hotkey: 'Ctrl+Shift+N',
  },

  // ===== PLACEHOLDER FEATURES (for future implementation) =====

  focus_mode: {
    id: 'focus_mode',
    label: 'Focus Mode',
    icon: '🔍',
    type: FeatureTypes.TOGGLE,
    category: FeatureCategories.PRODUCTIVITY,
    description: 'Hide all distractions, full screen review',
    action: 'toggleFocusMode',
    disabled: true,
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get all features, optionally filtered
 */
export function getFeatures(filters = {}) {
  let features = Object.values(featureRegistry);
  
  // Apply filters
  if (filters.category) {
    features = features.filter(f => f.category === filters.category);
  }
  
  if (filters.type) {
    features = features.filter(f => f.type === filters.type);
  }
  
  if (filters.enabledOnly !== false) {
    features = features.filter(f => !f.disabled);
  }
  
  if (filters.permissions) {
    features = features.filter(f => {
      if (!f.permissions || f.permissions.length === 0) return true;
      
      // Check if user has ALL required permissions
      return f.permissions.every(perm => filters.permissions.includes(perm));
    });
  }
  
  return features;
}

/**
 * Get a single feature by ID
 */
export function getFeature(featureId) {
  const feature = featureRegistry[featureId];
  
  if (!feature) {
    console.warn(`Feature not found: ${featureId}`);
    return null;
  }
  
  return { ...feature }; // Return copy to prevent mutation
}

/**
 * Get features grouped by category for UI display
 */
export function getFeaturesByCategory() {
  const features = getFeatures({ enabledOnly: true });
  const grouped = {};
  
  features.forEach(feature => {
    if (!grouped[feature.category]) {
      grouped[feature.category] = [];
    }
    grouped[feature.category].push(feature);
  });
  
  // Sort categories by priority
  const categoryOrder = [
    FeatureCategories.PRODUCTIVITY,
    FeatureCategories.SESSION_CONTROL,
    FeatureCategories.APPEARANCE,
    FeatureCategories.TOOLS,
    FeatureCategories.INTEGRATIONS,
  ];
  
  const sorted = {};
  categoryOrder.forEach(category => {
    if (grouped[category]) {
      sorted[category] = grouped[category];
    }
  });
  
  // Add any remaining categories
  Object.keys(grouped).forEach(category => {
    if (!sorted[category]) {
      sorted[category] = grouped[category];
    }
  });
  
  return sorted;
}

/**
 * Get all feature IDs (for quick lookups)
 */
export function getFeatureIds() {
  return Object.keys(featureRegistry);
}

/**
 * Check if a feature is available given current permissions
 */
export function isFeatureAvailable(featureId, userPermissions = []) {
  const feature = getFeature(featureId);
  
  if (!feature || feature.disabled) {
    return false;
  }
  
  // If no permissions required, feature is always available
  if (!feature.permissions || feature.permissions.length === 0) {
    return true;
  }
  
  // Check if user has ALL required permissions
  return feature.permissions.every(perm => userPermissions.includes(perm));
}

/**
 * Execute an instant feature action
 * (In real app, this would dispatch to Redux/Zustand)
 */
export function executeFeatureAction(featureId, context = {}) {
  const feature = getFeature(featureId);
  
  if (!feature) {
    throw new Error(`Cannot execute: Feature ${featureId} not found`);
  }
  
  if (feature.type !== FeatureTypes.INSTANT && feature.type !== FeatureTypes.TOGGLE) {
    throw new Error(`Cannot execute: Feature ${featureId} is not an instant action`);
  }
  
  if (feature.disabled) {
    throw new Error(`Cannot execute: Feature ${featureId} is disabled`);
  }
  
  // In real implementation, this would dispatch to your state management
  console.log(`Executing feature: ${featureId}`, { feature, context });
  
  // Return mock action for now
  return {
    type: `FEATURE_${featureId.toUpperCase()}_EXECUTED`,
    payload: { featureId, context, timestamp: Date.now() },
  };
}

/**
 * Register a new feature at runtime (for plugins/extensions)
 */
export function registerFeature(featureDefinition) {
  if (!featureDefinition.id) {
    throw new Error('Feature must have an id');
  }
  
  if (featureRegistry[featureDefinition.id]) {
    console.warn(`Feature ${featureDefinition.id} already exists, overwriting`);
  }
  
  featureRegistry[featureDefinition.id] = {
    // Defaults
    type: FeatureTypes.WIDGET,
    category: FeatureCategories.TOOLS,
    disabled: false,
    
    // User definition (overrides defaults)
    ...featureDefinition,
  };
  
  console.log(`Registered feature: ${featureDefinition.id}`);
  return featureDefinition.id;
}

/**
 * Update an existing feature
 */
export function updateFeature(featureId, updates) {
  const feature = getFeature(featureId);
  
  if (!feature) {
    throw new Error(`Cannot update: Feature ${featureId} not found`);
  }
  
  featureRegistry[featureId] = {
    ...feature,
    ...updates,
  };
  
  return getFeature(featureId);
}

// Export everything
export {
  FeatureTypes,
  FeatureCategories,
  featureRegistry as default,
};