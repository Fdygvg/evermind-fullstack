export const timerConfig = {
  // Available durations in seconds
  durations: [
    { value: 5, label: '5 seconds', group: 'quick' },
    { value: 10, label: '10 seconds', group: 'quick' },
    { value: 15, label: '15 seconds', group: 'quick' },
    { value: 30, label: '30 seconds', group: 'standard' },
    { value: 60, label: '1 minute', group: 'standard' },
    { value: 120, label: '2 minutes', group: 'extended' },
    { value: 300, label: '5 minutes', group: 'extended' },
    { value: 600, label: '10 minutes', group: 'extended' },
  ],

  // Default settings (used when user doesn't specify)
  defaults: {
    duration: 30, // seconds
    autoScore: 1, // Score 1-5 (from your smart review system)
    autoReset: true, // Automatically reset after timeout?
    beepOnEnd: true, // Play sound when timer ends
    strictMode: false, // If true, auto-scores even if user is typing
    showProgress: true, // Show progress bar/percentage
    pauseOnHover: false, // Pause when hovering over timer?
  },

  // Auto-score options mapping (1-5 from EVERMIND's smart review)
  autoScoreOptions: [
    {
      value: 1,
      label: 'Again (Soon)',
      description: 'Review in same session',
      color: '#ef4444', // red
      icon: '🔄',
    },
    {
      value: 2,
      label: 'Hard',
      description: 'Review in 1 day',
      color: '#f97316', // orange
      icon: '💪',
    },
    {
      value: 3,
      label: 'Good',
      description: 'Review in 3 days',
      color: '#eab308', // yellow
      icon: '👍',
    },
    {
      value: 4,
      label: 'Easy',
      description: 'Review in 1 week',
      color: '#22c55e', // green
      icon: '😌',
    },
    {
      value: 5,
      label: 'Mastered',
      description: 'Review in 1 month',
      color: '#3b82f6', // blue
      icon: '🎯',
    },
  ],

  // Sound configuration
  sounds: {
    enabled: true,
    volume: 0.5,
    beepFile: '/sounds/beep.mp3',
    endFile: '/sounds/timer-end.mp3',
  },

  // Visual configuration
  display: {
    format: 'mm:ss', // or 'seconds', 'minutes'
    showMilliseconds: false,
    size: 'medium', // small, medium, large
    theme: 'dark', // dark, light, matrix
    animation: 'smooth', // smooth, discrete, none
  },

  // Behavior flags for different contexts
  behaviors: {
    // For sequential modes (TikTok, Flashcards)
    sequential: {
      autoStart: true,
      resetOnManualScore: true,
      continuous: true,
    },
    
    // For batch mode
    batch: {
      autoStart: false,
      resetOnManualScore: true,
      continuous: false,
      perQuestion: true,
    },
    
    // For elimination mode
    elimination: {
      autoStart: true,
      resetOnAnswer: true,
      continuous: true,
    },
  },

  // Validation rules
  validation: {
    minDuration: 1, // 1 second minimum
    maxDuration: 3600, // 1 hour maximum
    allowedAutoScores: [1, 2, 3, 4, 5],
  },
};

/**
 * Helper function to get duration label
 */
export function getDurationLabel(seconds) {
  const duration = timerConfig.durations.find(d => d.value === seconds);
  return duration ? duration.label : `${seconds} seconds`;
}

/**
 * Helper function to get auto-score option
 */
export function getAutoScoreOption(score) {
  return timerConfig.autoScoreOptions.find(opt => opt.value === score) || 
         timerConfig.autoScoreOptions[0];
}

/**
 * Validate timer configuration
 */
export function validateTimerConfig(config) {
  const errors = [];
  
  // Validate duration
  if (config.duration < timerConfig.validation.minDuration) {
    errors.push(`Duration must be at least ${timerConfig.validation.minDuration} second`);
  }
  
  if (config.duration > timerConfig.validation.maxDuration) {
    errors.push(`Duration cannot exceed ${timerConfig.validation.maxDuration} seconds (1 hour)`);
  }
  
  // Validate autoScore
  if (!timerConfig.validation.allowedAutoScores.includes(config.autoScore)) {
    errors.push(`Auto-score must be one of: ${timerConfig.validation.allowedAutoScores.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create a complete timer config by merging with defaults
 */
export function createTimerConfig(userConfig = {}) {
  const config = {
    ...timerConfig.defaults,
    ...userConfig,
  };
  
  // Validate
  const validation = validateTimerConfig(config);
  if (!validation.isValid) {
    console.warn('Invalid timer config:', validation.errors);
    
    // Fall back to defaults for invalid values
    if (!timerConfig.validation.allowedAutoScores.includes(config.autoScore)) {
      config.autoScore = timerConfig.defaults.autoScore;
    }
    
    if (config.duration < timerConfig.validation.minDuration || 
        config.duration > timerConfig.validation.maxDuration) {
      config.duration = timerConfig.defaults.duration;
    }
  }
  
  return config;
}

export default timerConfig;