
class TimerEngine {
  /**
   * @param {Object} config
   * @param {number} config.duration - Duration in seconds
   * @param {number} config.autoScore - Score (1-5) to apply on timeout
   * @param {Function} config.onTick - Called every second with timeLeft
   * @param {Function} config.onTimeout - Called when timer reaches 0
   * @param {Function} config.onStart - Called when timer starts
   * @param {Function} config.onPause - Called when timer pauses
   * @param {Function} config.onReset - Called when timer resets
   */
  constructor(config) {
    // Validate config
    if (!config || typeof config !== 'object') {
      throw new Error('TimerEngine: config object is required');
    }
    
    if (typeof config.duration !== 'number' || config.duration <= 0) {
      throw new Error('TimerEngine: duration must be a positive number');
    }
    
    // Store config
    this.config = {
      duration: config.duration,
      autoScore: config.autoScore || 1,
      onTick: config.onTick || (() => {}),
      onTimeout: config.onTimeout || (() => {}),
      onStart: config.onStart || (() => {}),
      onPause: config.onPause || (() => {}),
      onReset: config.onReset || (() => {}),
    };
    
    // Internal state
    this.timeLeft = this.config.duration;
    this.isRunning = false;
    this.startTime = null;
    this.timerId = null;
    this.remainingTimeOnPause = null;
    
    // Bind methods to preserve 'this' context
    this.tick = this.tick.bind(this);
  }

  /**
   * Start or resume the timer
   */
  start() {
    if (this.isRunning) {
      console.warn('TimerEngine: Timer is already running');
      return;
    }
    
    this.isRunning = true;
    
    // Calculate start time
    if (this.remainingTimeOnPause !== null) {
      // Resuming from pause
      this.startTime = Date.now() - 
        (this.config.duration - this.remainingTimeOnPause) * 1000;
      this.timeLeft = this.remainingTimeOnPause;
      this.remainingTimeOnPause = null;
    } else {
      // Fresh start
      this.startTime = Date.now();
      this.timeLeft = this.config.duration;
    }
    
    // Call onStart callback
    this.config.onStart({
      duration: this.config.duration,
      timeLeft: this.timeLeft
    });
    
    // Start the interval
    this.timerId = setInterval(this.tick, 1000);
    
    // Immediate first tick
    this.tick();
  }

  /**
   * Internal tick handler
   */
  tick() {
    if (!this.isRunning || !this.startTime) return;
    
    const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    this.timeLeft = Math.max(0, this.config.duration - elapsedSeconds);
    
    // Update via callback
    this.config.onTick(this.timeLeft);
    
    // Check for timeout
    if (this.timeLeft <= 0) {
      this.handleTimeout();
    }
  }

  /**
   * Handle timer reaching zero
   */
  handleTimeout() {
    this.stop(); // Clear interval
    
    // Call timeout callback
    this.config.onTimeout({
      autoScore: this.config.autoScore,
      duration: this.config.duration,
      timedOut: true
    });
  }

  /**
   * Pause the timer
   */
  pause() {
    if (!this.isRunning) {
      console.warn('TimerEngine: Timer is not running');
      return;
    }
    
    this.isRunning = false;
    this.remainingTimeOnPause = this.timeLeft;
    
    // Clear interval
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    
    // Call onPause callback
    this.config.onPause({
      timeLeft: this.timeLeft,
      duration: this.config.duration
    });
  }

  /**
   * Stop and reset the timer
   */
  stop() {
    this.isRunning = false;
    
    // Clear interval
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    
    // Reset state
    this.startTime = null;
    this.remainingTimeOnPause = null;
  }

  /**
   * Reset timer to initial state
   */
  reset() {
    this.stop();
    this.timeLeft = this.config.duration;
    
    // Call onReset callback
    this.config.onReset({
      duration: this.config.duration,
      timeLeft: this.timeLeft
    });
    
    // Update via callback
    this.config.onTick(this.timeLeft);
  }

  /**
   * Update timer configuration
   */
  updateConfig(newConfig) {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.pause();
    }
    
    // Merge configs
    this.config = {
      ...this.config,
      ...newConfig
    };
    
    // Reset to new duration
    this.timeLeft = this.config.duration;
    this.remainingTimeOnPause = null;
    
    if (wasRunning) {
      this.start();
    } else {
      this.config.onTick(this.timeLeft);
    }
  }

  /**
   * Get current timer state
   */
  getState() {
    return {
      timeLeft: this.timeLeft,
      isRunning: this.isRunning,
      duration: this.config.duration,
      autoScore: this.config.autoScore,
      progress: (this.config.duration - this.timeLeft) / this.config.duration
    };
  }

  /**
   * Manually trigger timeout (for testing)
   */
  forceTimeout() {
    this.timeLeft = 0;
    this.handleTimeout();
  }
}

export default TimerEngine;