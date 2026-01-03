class EventBus {
  constructor() {
    this.events = new Map();
    this.maxListeners = 20;
  }

  /**
   * Subscribe to an event
   * @param {string} eventName
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback) {
    if (typeof callback !== 'function') {
      throw new Error('EventBus: callback must be a function');
    }

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const listeners = this.events.get(eventName);
    
    // Check max listeners
    if (listeners.length >= this.maxListeners) {
      console.warn(`EventBus: Event "${eventName}" has ${listeners.length} listeners, consider reducing`);
    }

    listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.off(eventName, callback);
    };
  }

  /**
   * Subscribe to an event once
   */
  once(eventName, callback) {
    const onceCallback = (...args) => {
      this.off(eventName, onceCallback);
      callback(...args);
    };

    return this.on(eventName, onceCallback);
  }

  /**
   * Unsubscribe from an event
   */
  off(eventName, callback) {
    if (!this.events.has(eventName)) {
      return;
    }

    const listeners = this.events.get(eventName);
    const index = listeners.indexOf(callback);

    if (index !== -1) {
      listeners.splice(index, 1);
    }

    // Clean up empty arrays
    if (listeners.length === 0) {
      this.events.delete(eventName);
    }
  }

  /**
   * Emit an event
   */
  emit(eventName, ...args) {
    if (!this.events.has(eventName)) {
      return false;
    }

    const listeners = this.events.get(eventName);
    
    // Copy array to avoid issues if listeners are removed during iteration
    const listenersCopy = [...listeners];
    
    let called = false;
    listenersCopy.forEach((callback) => {
      try {
        callback(...args);
        called = true;
      } catch (error) {
        console.error(`EventBus: Error in listener for "${eventName}":`, error);
      }
    });

    return called;
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(eventName) {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get number of listeners for an event
   */
  listenerCount(eventName) {
    if (!this.events.has(eventName)) {
      return 0;
    }
    return this.events.get(eventName).length;
  }

  /**
   * Get all event names
   */
  eventNames() {
    return Array.from(this.events.keys());
  }
}

// ==================== EVENT DEFINITIONS ====================

/**
 * Common event names used in Command Center
 * Centralized here for consistency
 */
export const CommandCenterEvents = {
  // Widget events
  WIDGET_CREATED: 'widget:created',
  WIDGET_CLOSED: 'widget:closed',
  WIDGET_MOVED: 'widget:moved',
  WIDGET_RESIZED: 'widget:resized',
  
  // Timer events
  TIMER_STARTED: 'timer:started',
  TIMER_PAUSED: 'timer:paused',
  TIMER_RESET: 'timer:reset',
  TIMER_TICK: 'timer:tick',
  TIMER_TIMEOUT: 'timer:timeout',
  TIMER_CONFIG_CHANGED: 'timer:config-changed',
  
  // Command Center UI events
  COMMAND_CENTER_OPENED: 'command-center:opened',
  COMMAND_CENTER_CLOSED: 'command-center:closed',
  FEATURE_SELECTED: 'feature:selected',
  
  // Review session events
  SESSION_STARTED: 'session:started',
  SESSION_ENDED: 'session:ended',
  QUESTION_CHANGED: 'question:changed',
  ANSWER_REVEALED: 'answer:revealed',
  QUESTION_SCORED: 'question:scored',
  
  // Mode-specific events
  BATCH_MODE_QUESTION_REVEALED: 'batch-mode:question-revealed',
  SEQUENTIAL_MODE_NEXT_QUESTION: 'sequential-mode:next-question',
  
  // System events
  THEME_CHANGED: 'theme:changed',
  SETTINGS_UPDATED: 'settings:updated',
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a namespaced event bus for specific components
 */
export function createNamespacedBus(namespace) {
  const bus = new EventBus();
  
  return {
    on: (eventName, callback) => 
      bus.on(`${namespace}:${eventName}`, callback),
    
    once: (eventName, callback) => 
      bus.once(`${namespace}:${eventName}`, callback),
    
    off: (eventName, callback) => 
      bus.off(`${namespace}:${eventName}`, callback),
    
    emit: (eventName, ...args) => 
      bus.emit(`${namespace}:${eventName}`, ...args),
    
    removeAllListeners: (eventName) => 
      bus.removeAllListeners(eventName ? `${namespace}:${eventName}` : null),
  };
}

/**
 * Create a typed event emitter for better TypeScript support
 */
export function createEventEmitter() {
  const bus = new EventBus();
  
  return {
    emit: bus.emit.bind(bus),
    subscribe: (eventName, callback) => ({
      unsubscribe: () => bus.off(eventName, callback),
    }),
  };
}

// Create a singleton instance for global use
const globalEventBus = new EventBus();

export default globalEventBus;