/**
 * useTimer - React hook for TimerEngine integration
 * Provides a clean React interface to the timer business logic
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import TimerEngine from '../core/TimerEngine';
import eventBus, { CommandCenterEvents } from '../core/event-bus';
import { createTimerConfig } from '../config/timer.config';

/**
 * Main timer hook
 * 
 * @param {Object} options
 * @param {number} options.duration - Duration in seconds
 * @param {number} options.autoScore - Score (1-5) on timeout
 * @param {Function} options.onTimeout - Called when timer reaches 0
 * @param {Function} options.onTick - Called every second (optional)
 * @param {Function} options.onStart - Called when timer starts (optional)
 * @param {Function} options.onPause - Called when timer pauses (optional)
 * @param {Function} options.onReset - Called when timer resets (optional)
 * @param {boolean} options.autoStart - Start immediately (default: false)
 * @param {boolean} options.emitEvents - Emit to event bus (default: true)
 * @param {string} options.mode - 'sequential' or 'batch' (affects auto-reset)
 * 
 * @returns {Object} Timer controls and state
 */
export function useTimer(options = {}) {
  // Merge with defaults and validate
  const config = createTimerConfig(options);
  
  // Refs for timer instance and callbacks
  const timerRef = useRef(null);
  const callbacksRef = useRef({
    onTimeout: config.onTimeout,
    onTick: config.onTick,
    onStart: config.onStart,
    onPause: config.onPause,
    onReset: config.onReset,
  });
  
  // React state
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Update callbacks when they change
  useEffect(() => {
    callbacksRef.current = {
      onTimeout: config.onTimeout,
      onTick: config.onTick,
      onStart: config.onStart,
      onPause: config.onPause,
      onReset: config.onReset,
    };
  }, [config.onTimeout, config.onTick, config.onStart, config.onPause, config.onReset]);
  
  // Timer event handlers with event bus integration
  const handleTick = useCallback((seconds) => {
    setTimeLeft(seconds);
    setProgress(((config.duration - seconds) / config.duration) * 100);
    
    // Call user callback if provided
    if (callbacksRef.current.onTick) {
      callbacksRef.current.onTick(seconds);
    }
    
    // Emit event if enabled
    if (config.emitEvents !== false) {
      eventBus.emit(CommandCenterEvents.TIMER_TICK, {
        timeLeft: seconds,
        duration: config.duration,
        progress: ((config.duration - seconds) / config.duration) * 100,
      });
    }
  }, [config.duration, config.emitEvents]);
  
  const handleTimeout = useCallback(() => {
    // Call user callback
    if (callbacksRef.current.onTimeout) {
      callbacksRef.current.onTimeout({
        autoScore: config.autoScore,
        duration: config.duration,
        timedOut: true,
      });
    }
    
    // Emit event if enabled
    if (config.emitEvents !== false) {
      eventBus.emit(CommandCenterEvents.TIMER_TIMEOUT, {
        autoScore: config.autoScore,
        duration: config.duration,
      });
    }
    
    // Auto-reset for sequential mode
    if (config.mode === 'sequential' && config.autoReset !== false) {
      setTimeout(() => {
        reset();
      }, 100);
    }
  }, [config.autoScore, config.duration, config.emitEvents, config.mode, config.autoReset]);
  
  const handleStart = useCallback(() => {
    setIsRunning(true);
    
    if (callbacksRef.current.onStart) {
      callbacksRef.current.onStart({
        duration: config.duration,
        timeLeft: timeLeft,
      });
    }
    
    if (config.emitEvents !== false) {
      eventBus.emit(CommandCenterEvents.TIMER_STARTED, {
        duration: config.duration,
        timeLeft: timeLeft,
      });
    }
  }, [config.duration, config.emitEvents, timeLeft]);
  
  const handlePause = useCallback(() => {
    setIsRunning(false);
    
    if (callbacksRef.current.onPause) {
      callbacksRef.current.onPause({
        timeLeft: timeLeft,
        duration: config.duration,
      });
    }
    
    if (config.emitEvents !== false) {
      eventBus.emit(CommandCenterEvents.TIMER_PAUSED, {
        timeLeft: timeLeft,
        duration: config.duration,
      });
    }
  }, [config.duration, config.emitEvents, timeLeft]);
  
  const handleReset = useCallback(() => {
    setTimeLeft(config.duration);
    setProgress(0);
    setIsRunning(false);
    
    if (callbacksRef.current.onReset) {
      callbacksRef.current.onReset({
        duration: config.duration,
        timeLeft: config.duration,
      });
    }
    
    if (config.emitEvents !== false) {
      eventBus.emit(CommandCenterEvents.TIMER_RESET, {
        duration: config.duration,
        timeLeft: config.duration,
      });
    }
  }, [config.duration, config.emitEvents]);
  
  // Initialize timer instance
  const initializeTimer = useCallback(() => {
    if (timerRef.current) {
      timerRef.current.stop();
    }
    
    timerRef.current = new TimerEngine({
      duration: config.duration,
      autoScore: config.autoScore,
      onTick: handleTick,
      onTimeout: handleTimeout,
      onStart: handleStart,
      onPause: handlePause,
      onReset: handleReset,
    });
    
    // Update React state to match timer state
    setTimeLeft(config.duration);
    setProgress(0);
    setIsRunning(false);
    
    return timerRef.current;
  }, [config.duration, config.autoScore, handleTick, handleTimeout, handleStart, handlePause, handleReset]);
  
  // Initialize on mount and when config changes
  useEffect(() => {
    const timer = initializeTimer();
    
    // Auto-start if requested
    if (config.autoStart) {
      timer.start();
    }
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        timerRef.current.stop();
        timerRef.current = null;
      }
    };
  }, [initializeTimer, config.autoStart]);
  
  // Timer control methods
  const start = useCallback(() => {
    if (!timerRef.current) {
      initializeTimer();
    }
    
    if (timerRef.current) {
      timerRef.current.start();
    }
  }, [initializeTimer]);
  
  const pause = useCallback(() => {
    if (timerRef.current) {
      timerRef.current.pause();
    }
  }, []);
  
  const stop = useCallback(() => {
    if (timerRef.current) {
      timerRef.current.stop();
      setIsRunning(false);
    }
  }, []);
  
  const reset = useCallback(() => {
    if (timerRef.current) {
      timerRef.current.reset();
    } else {
      initializeTimer();
    }
  }, [initializeTimer]);
  
  // Update timer configuration dynamically
  const updateConfig = useCallback((newConfig) => {
    if (timerRef.current) {
      const mergedConfig = createTimerConfig({
        ...config,
        ...newConfig,
      });
      
      timerRef.current.updateConfig({
        duration: mergedConfig.duration,
        autoScore: mergedConfig.autoScore,
      });
      
      // Update React state
      setTimeLeft(mergedConfig.duration);
      setProgress(0);
      
      // Emit config change event
      if (config.emitEvents !== false) {
        eventBus.emit(CommandCenterEvents.TIMER_CONFIG_CHANGED, {
          oldDuration: config.duration,
          newDuration: mergedConfig.duration,
          oldAutoScore: config.autoScore,
          newAutoScore: mergedConfig.autoScore,
        });
      }
      
      return mergedConfig;
    }
    
    return config;
  }, [config]);
  
  // Get current timer state
  const getState = useCallback(() => {
    if (timerRef.current) {
      return timerRef.current.getState();
    }
    
    return {
      timeLeft,
      isRunning,
      duration: config.duration,
      autoScore: config.autoScore,
      progress,
    };
  }, [timeLeft, isRunning, config.duration, config.autoScore, progress]);
  
  // Format time for display
  const formatTime = useCallback((format = 'mm:ss') => {
    const totalSeconds = timeLeft;
    
    if (format === 'seconds') {
      return `${totalSeconds}s`;
    }
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (format === 'mm:ss') {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    if (format === 'm:ss') {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${totalSeconds}s`;
  }, [timeLeft]);
  
  // Hook return value
  return {
    // State
    timeLeft,
    isRunning,
    progress,
    duration: config.duration,
    autoScore: config.autoScore,
    
    // Controls
    start,
    pause,
    stop,
    reset,
    
    // Configuration
    updateConfig,
    getState,
    
    // Utilities
    formatTime,
    
    // Timer instance (advanced use)
    timerInstance: timerRef.current,
  };
}

/**
 * Specialized hook for sequential modes (TikTok, Flashcards)
 */
export function useSequentialTimer(options = {}) {
  const timer = useTimer({
    ...options,
    mode: 'sequential',
    autoReset: options.autoReset !== false, // Default true for sequential
    autoStart: options.autoStart !== false, // Default true for sequential
  });
  
  return timer;
}

/**
 * Specialized hook for batch mode
 */
export function useBatchTimer(options = {}) {
  const timer = useTimer({
    ...options,
    mode: 'batch',
    autoReset: options.autoReset !== false,
    autoStart: false, // Don't auto-start in batch mode
  });
  
  // Additional batch mode functionality
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  
  // Start timer for a specific question
  const startForQuestion = useCallback((questionId) => {
    setActiveQuestionId(questionId);
    timer.start();
  }, [timer]);
  
  // Stop timer when question is answered or hidden
  const stopForQuestion = useCallback((questionId) => {
    if (activeQuestionId === questionId) {
      timer.pause();
      setActiveQuestionId(null);
    }
  }, [activeQuestionId, timer]);
  
  // Listen for batch mode events
  useEffect(() => {
    const handleQuestionRevealed = (data) => {
      if (options.autoStart !== false) {
        startForQuestion(data.questionId);
      }
    };
    
    const handleQuestionScored = (data) => {
      stopForQuestion(data.questionId);
    };
    
    // Subscribe to batch mode events
    const unsubscribeRevealed = eventBus.on(
      CommandCenterEvents.BATCH_MODE_QUESTION_REVEALED,
      handleQuestionRevealed
    );
    
    const unsubscribeScored = eventBus.on(
      CommandCenterEvents.QUESTION_SCORED,
      handleQuestionScored
    );
    
    return () => {
      unsubscribeRevealed();
      unsubscribeScored();
    };
  }, [options.autoStart, startForQuestion, stopForQuestion]);
  
  return {
    ...timer,
    activeQuestionId,
    startForQuestion,
    stopForQuestion,
  };
}

/**
 * Hook to listen to timer events from anywhere in the app
 */
export function useTimerListener(eventName, callback, dependencies = []) {
  useEffect(() => {
    const unsubscribe = eventBus.on(eventName, callback);
    return unsubscribe;
  }, [eventName, callback, ...dependencies]);
}

/**
 * Hook to get global timer state (for widgets, displays, etc.)
 */
export function useGlobalTimer() {
  const [globalTimerState, setGlobalTimerState] = useState(null);
  
  useEffect(() => {
    const handleTimerTick = (data) => {
      setGlobalTimerState(data);
    };
    
    const handleTimerTimeout = () => {
      setGlobalTimerState(null);
    };
    
    const unsubscribeTick = eventBus.on(
      CommandCenterEvents.TIMER_TICK,
      handleTimerTick
    );
    
    const unsubscribeTimeout = eventBus.on(
      CommandCenterEvents.TIMER_TIMEOUT,
      handleTimerTimeout
    );
    
    return () => {
      unsubscribeTick();
      unsubscribeTimeout();
    };
  }, []);
  
  return globalTimerState;
}

export default useTimer;