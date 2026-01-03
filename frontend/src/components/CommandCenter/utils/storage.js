/**
 * storage.js - LocalStorage utilities with expiration and encryption support
 */

/**
 * Safe localStorage getter with error handling
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key doesn't exist or error
 * @returns {any} Stored value or defaultValue
 */
export function getLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    
    // Check if it's a JSON string or plain string
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch (error) {
    console.warn(`Failed to read from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Safe localStorage setter with error handling
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be JSON.stringified)
 * @returns {boolean} Success status
 */
export function setLocalStorage(key, value) {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn(`Failed to write to localStorage (${key}):`, error);
    
    // If storage is full, try to clear some space
    if (error.name === 'QuotaExceededError') {
      clearOldStorage();
      return setLocalStorage(key, value); // Retry
    }
    
    return false;
  }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export function removeLocalStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove from localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Clear all Command Center related storage
 * @param {boolean} preserveSettings - Whether to preserve user settings
 */
export function clearCommandCenterStorage(preserveSettings = true) {
  try {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key.startsWith('evermind-') || key.startsWith('command-center-')) {
        // Preserve settings if requested
        if (preserveSettings && (
          key.includes('settings') || 
          key.includes('theme') || 
          key.includes('config')
        )) {
          continue;
        }
        
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    return keysToRemove.length;
  } catch (error) {
    console.warn('Failed to clear Command Center storage:', error);
    return 0;
  }
}

/**
 * Storage with expiration
 */
export class ExpiringStorage {
  /**
   * Set item with expiration
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {number} ttl - Time to live in milliseconds
   * @returns {boolean} Success status
   */
  static set(key, value, ttl = 24 * 60 * 60 * 1000) { // Default 24 hours
    const item = {
      value,
      expires: Date.now() + ttl,
    };
    
    return setLocalStorage(key, item);
  }
  
  /**
   * Get item, returns null if expired
   * @param {string} key - Storage key
   * @returns {any|null} Stored value or null
   */
  static get(key) {
    const item = getLocalStorage(key);
    
    if (!item || typeof item !== 'object') {
      return null;
    }
    
    if (item.expires && Date.now() > item.expires) {
      removeLocalStorage(key);
      return null;
    }
    
    return item.value;
  }
  
  /**
   * Clean up expired items
   * @returns {number} Number of items removed
   */
  static cleanup() {
    let removedCount = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Only check items that might be expiring storage
        if (key.startsWith('expiring-') || key.includes('-expires-')) {
          const item = getLocalStorage(key);
          
          if (item && item.expires && Date.now() > item.expires) {
            localStorage.removeItem(key);
            removedCount++;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup expired storage:', error);
    }
    
    return removedCount;
  }
}

/**
 * Widget positions storage with versioning
 */
export class WidgetPositionStorage {
  static VERSION = '1.0';
  static KEY = 'evermind-widget-positions-v2';
  
  /**
   * Save widget positions
   * @param {Array} widgets - Array of widget position data
   * @returns {boolean} Success status
   */
  static save(widgets) {
    const data = {
      version: this.VERSION,
      timestamp: Date.now(),
      widgets: widgets.map(widget => ({
        id: widget.id,
        type: widget.type,
        position: widget.position,
        size: widget.size,
        isMinimized: widget.isMinimized,
        isPinned: widget.isPinned,
      })),
    };
    
    return setLocalStorage(this.KEY, data);
  }
  
  /**
   * Load widget positions
   * @returns {Array|null} Widget positions or null
   */
  static load() {
    const data = getLocalStorage(this.KEY);
    
    if (!data || data.version !== this.VERSION) {
      // Try to migrate from old version
      if (data && data.version === '1.0') {
        // Already correct version
        return data.widgets;
      }
      
      // Try old key
      const oldData = getLocalStorage('evermind-widget-positions');
      if (oldData) {
        // Migrate to new format
        const migrated = this.migrateFromV1(oldData);
        this.save(migrated);
        return migrated;
      }
      
      return null;
    }
    
    // Check if data is too old (more than 30 days)
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > THIRTY_DAYS) {
      removeLocalStorage(this.KEY);
      return null;
    }
    
    return data.widgets;
  }
  
  /**
   * Migrate from v1 format
   */
  static migrateFromV1(oldData) {
    if (Array.isArray(oldData)) {
      return oldData;
    }
    
    // Convert object format to array
    if (typeof oldData === 'object') {
      return Object.entries(oldData).map(([id, widgetData]) => ({
        id,
        type: 'unknown',
        position: widgetData.position || { x: 100, y: 100 },
        size: widgetData.size || { width: 200, height: 150 },
        isMinimized: widgetData.isMinimized || false,
        isPinned: false,
      }));
    }
    
    return [];
  }
  
  /**
   * Clear all widget positions
   */
  static clear() {
    return removeLocalStorage(this.KEY);
  }
}

/**
 * Command Center settings storage
 */
export class SettingsStorage {
  static KEY = 'evermind-command-center-settings';
  
  static defaults = {
    theme: 'dark',
    buttonPosition: { x: 20, y: 20 },
    buttonVariant: 'default',
    autoOpenDropdown: false,
    enableSounds: true,
    enableAnimations: true,
    widgetSnapToGrid: false,
    widgetGridSize: 10,
    enableMagnetism: true,
    magnetismThreshold: 20,
  };
  
  /**
   * Get all settings
   */
  static getAll() {
    const saved = getLocalStorage(this.KEY, {});
    return { ...this.defaults, ...saved };
  }
  
  /**
   * Get a specific setting
   */
  static get(key) {
    const settings = this.getAll();
    return settings[key];
  }
  
  /**
   * Update settings
   */
  static update(updates) {
    const current = this.getAll();
    const updated = { ...current, ...updates };
    
    return setLocalStorage(this.KEY, updated);
  }
  
  /**
   * Reset to defaults
   */
  static reset() {
    return setLocalStorage(this.KEY, this.defaults);
  }
}

/**
 * Timer configurations storage
 */
export class TimerConfigStorage {
  static KEY = 'evermind-timer-configs';
  
  /**
   * Save timer configuration
   */
  static save(configId, config) {
    const allConfigs = this.getAll();
    allConfigs[configId] = {
      ...config,
      lastUsed: Date.now(),
    };
    
    return setLocalStorage(this.KEY, allConfigs);
  }
  
  /**
   * Get all timer configurations
   */
  static getAll() {
    return getLocalStorage(this.KEY, {});
  }
  
  /**
   * Get a specific timer configuration
   */
  static get(configId) {
    const allConfigs = this.getAll();
    return allConfigs[configId] || null;
  }
  
  /**
   * Get most recently used configuration
   */
  static getMostRecent() {
    const allConfigs = this.getAll();
    const configs = Object.entries(allConfigs);
    
    if (configs.length === 0) {
      return null;
    }
    
    // Sort by lastUsed, most recent first
    configs.sort((a, b) => b[1].lastUsed - a[1].lastUsed);
    
    return {
      id: configs[0][0],
      config: configs[0][1],
    };
  }
  
  /**
   * Clear old timer configurations (older than 90 days)
   */
  static cleanupOld() {
    const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
    const allConfigs = this.getAll();
    const now = Date.now();
    
    let cleanedCount = 0;
    
    Object.keys(allConfigs).forEach(key => {
      if (now - allConfigs[key].lastUsed > NINETY_DAYS) {
        delete allConfigs[key];
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      setLocalStorage(this.KEY, allConfigs);
    }
    
    return cleanedCount;
  }
}

/**
 * Session storage for temporary data (cleared on browser close)
 */
export class SessionStorage {
  /**
   * Set session data
   */
  static set(key, value) {
    try {
      sessionStorage.setItem(`evermind-${key}`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Failed to set session storage:', error);
      return false;
    }
  }
  
  /**
   * Get session data
   */
  static get(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(`evermind-${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Failed to get session storage:', error);
      return defaultValue;
    }
  }
  
  /**
   * Remove session data
   */
  static remove(key) {
    try {
      sessionStorage.removeItem(`evermind-${key}`);
      return true;
    } catch (error) {
      console.warn('Failed to remove session storage:', error);
      return false;
    }
  }
  
  /**
   * Clear all session data
   */
  static clear() {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key.startsWith('evermind-')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      return keysToRemove.length;
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
      return 0;
    }
  }
}

/**
 * Clear old storage to free up space
 */
function clearOldStorage() {
  try {
    const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key.startsWith('evermind-')) {
        try {
          const item = localStorage.getItem(key);
          const parsed = JSON.parse(item);
          
          // Check if item has a timestamp and is old
          if (parsed && parsed.timestamp && (now - parsed.timestamp) > ONE_MONTH) {
            localStorage.removeItem(key);
          }
        } catch {
          // If we can't parse it, leave it alone
        }
      }
    }
  } catch (error) {
    console.warn('Failed to clear old storage:', error);
  }
}

/**
 * Get storage usage statistics
 */
export function getStorageStats() {
  try {
    let evermindBytes = 0;
    let totalBytes = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      const itemBytes = (key.length + value.length) * 2; // Approximate bytes
      
      totalBytes += itemBytes;
      
      if (key.startsWith('evermind-') || key.startsWith('command-center-')) {
        evermindBytes += itemBytes;
      }
    }
    
    return {
      evermindBytes,
      totalBytes,
      evermindPercentage: totalBytes > 0 ? (evermindBytes / totalBytes) * 100 : 0,
      evermindKB: (evermindBytes / 1024).toFixed(2),
      totalKB: (totalBytes / 1024).toFixed(2),
    };
  } catch (error) {
    console.warn('Failed to get storage stats:', error);
    return null;
  }
}

export default {
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
  clearCommandCenterStorage,
  ExpiringStorage,
  WidgetPositionStorage,
  SettingsStorage,
  TimerConfigStorage,
  SessionStorage,
  getStorageStats,
};