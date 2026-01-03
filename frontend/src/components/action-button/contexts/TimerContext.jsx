// src/components/action-button/contexts/TimerContext.jsx
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { getTimerStrategy } from '../services/timerStrategies';

const TimerContext = createContext();

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
};

/**
 * TimerProvider - Manages timer state and strategies for all review modes
 * 
 * @param {Function} onRateQuestion - Callback to rate a question: (rating, questionId) => Promise
 * @param {Function} getCurrentQuestionId - Returns current question ID (for single-question modes)
 * @param {Function} getQuestionList - Returns array of {_id, isRated} (for elimination mode)
 * @param {Function} onQuestionAutoMarked - Callback when question is auto-marked
 * @param {string} mode - Review mode: 'normal', 'flashcard', 'tiktok', 'elimination'
 */
export const TimerProvider = ({
  children,
  mode = 'normal',
  onRateQuestion,
  getCurrentQuestionId,
  getQuestionList,
  onQuestionAutoMarked,
}) => {
  const [timerConfig, setTimerConfig] = useState(() => {
    const saved = localStorage.getItem('timerConfig');
    return saved ? JSON.parse(saved) : null;
  });

  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentTargetQuestionId, setCurrentTargetQuestionId] = useState(null);
  const [showTimerDisplay, setShowTimerDisplay] = useState(false);

  const strategyRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const callbacksRef = useRef({ onRateQuestion, getCurrentQuestionId, getQuestionList, onQuestionAutoMarked });

  // Keep callbacks ref updated
  useEffect(() => {
    callbacksRef.current = { onRateQuestion, getCurrentQuestionId, getQuestionList, onQuestionAutoMarked };
  }, [onRateQuestion, getCurrentQuestionId, getQuestionList, onQuestionAutoMarked]);

  // Initialize strategy
  const initializeStrategy = useCallback((config) => {
    if (!config) {
      strategyRef.current = null;
      return;
    }

    const strategyOptions = {
      duration: config.duration,
      defaultMark: config.defaultMark,
      autoRestart: true,

      // For Normal/Flashcard/TikTok modes
      getCurrentQuestionId: () => {
        if (callbacksRef.current.getCurrentQuestionId) {
          return callbacksRef.current.getCurrentQuestionId();
        }
        return null;
      },

      onRateQuestion: async (questionId, rating) => {
        console.log(`[TimerContext] Auto-rating question ${questionId} with ${rating}`);
        if (callbacksRef.current.onRateQuestion) {
          try {
            await callbacksRef.current.onRateQuestion(rating, questionId);
            console.log(`[TimerContext] Auto-rate successful`);
          } catch (error) {
            console.error('[TimerContext] Auto-rate failed:', error);
          }
        }
      },

      onAdvanceToNextQuestion: () => {
        console.log('[TimerContext] Question advanced (handled by rateQuestion callback)');
        // The rateQuestion callback typically handles advancement
      },

      // For Elimination mode
      getQuestionList: () => {
        if (callbacksRef.current.getQuestionList) {
          const questions = callbacksRef.current.getQuestionList();
          // Map to expected format: { id, isRated }
          return questions.map(q => ({
            id: q._id,
            isRated: q.isRated || false
          }));
        }
        return [];
      },

      onQuestionAutoMarked: (questionId, rating) => {
        console.log(`[TimerContext] Question ${questionId} auto-marked with ${rating}`);
        if (callbacksRef.current.onQuestionAutoMarked) {
          callbacksRef.current.onQuestionAutoMarked(questionId, rating);
        }
      },

      onTimerTargetChanged: (index) => {
        console.log(`[TimerContext] Timer target changed to index ${index}`);
        const questions = callbacksRef.current.getQuestionList?.() || [];
        if (questions[index]) {
          setCurrentTargetQuestionId(questions[index]._id);
        }
      },

      onTimerWarning: (seconds, level) => {
        console.log(`[TimerContext] Timer warning: ${seconds}s left (${level})`);
        // Could trigger sound/vibration here
      },
    };

    strategyRef.current = getTimerStrategy(mode, strategyOptions);
    console.log(`[TimerContext] Strategy initialized for mode: ${mode}`);
  }, [mode]);

  // Start timer with config
  const startTimer = useCallback((config) => {
    console.log('[TimerContext] Starting timer with config:', config);

    setTimerConfig(config);
    setIsTimerActive(true);
    setIsTimerRunning(true);
    setShowTimerDisplay(true);
    setTimeLeft(config.duration);
    localStorage.setItem('timerConfig', JSON.stringify(config));

    // Initialize strategy with new config
    initializeStrategy(config);

    // Start the strategy timer after a short delay to ensure state is set
    setTimeout(() => {
      if (strategyRef.current) {
        strategyRef.current.startTimer(config.duration, config.defaultMark);

        // Start updating time left display
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
        }
        updateIntervalRef.current = setInterval(() => {
          if (strategyRef.current) {
            const remaining = strategyRef.current.getTimeLeft();
            setTimeLeft(remaining);

            // Check if timer finished
            if (remaining <= 0 && isTimerRunning) {
              // Timer will auto-restart via strategy if autoRestart is true
            }
          }
        }, 100);
      }
    }, 50);
  }, [initializeStrategy]);

  // Stop timer completely
  const stopTimer = useCallback(() => {
    console.log('[TimerContext] Stopping timer');

    if (strategyRef.current) {
      strategyRef.current.stopTimer();
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    setIsTimerActive(false);
    setIsTimerRunning(false);
    setShowTimerDisplay(false);
    setTimeLeft(0);
    setCurrentTargetQuestionId(null);
  }, []);

  // Pause timer
  const pauseTimer = useCallback(() => {
    console.log('[TimerContext] Pausing timer');
    if (strategyRef.current?.pauseTimer) {
      strategyRef.current.pauseTimer();
    }
    setIsTimerRunning(false);
  }, []);

  // Resume timer
  const resumeTimer = useCallback(() => {
    console.log('[TimerContext] Resuming timer');
    if (strategyRef.current?.resumeTimer) {
      strategyRef.current.resumeTimer();
    }
    setIsTimerRunning(true);
  }, []);

  // Notify when user manually rates a question (resets timer for that question)
  const notifyManualRating = useCallback((questionId, rating) => {
    console.log(`[TimerContext] Manual rating ${rating} for question ${questionId}`);
    if (strategyRef.current) {
      strategyRef.current.onManualRate(questionId, rating);
    }
  }, []);

  // Update current question (for Normal/Flashcard/TikTok modes)
  const setCurrentQuestion = useCallback((questionId) => {
    console.log(`[TimerContext] Current question set to: ${questionId}`);
    setCurrentTargetQuestionId(questionId);

    // Notify strategy of question change so it can restart timer if needed
    // Only do this if timer is globally active
    if (isTimerActive && strategyRef.current?.onQuestionChanged) {
      strategyRef.current.onQuestionChanged(questionId);
    }
  }, [isTimerActive]);

  // Update question list (for Elimination mode - call when questions change)
  const updateQuestionList = useCallback(() => {
    console.log('[TimerContext] Updating question list');
    if (strategyRef.current?.updateQuestionList) {
      strategyRef.current.updateQuestionList();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (strategyRef.current) {
        strategyRef.current.stopTimer();
      }
    };
  }, []);

  const value = {
    // Config
    timerConfig,

    // State
    isTimerActive,
    isTimerRunning,
    timeLeft,
    showTimerDisplay,
    currentTargetQuestionId,

    // Actions
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    notifyManualRating,
    setCurrentQuestion,
    updateQuestionList,

    // Strategy access (for advanced use)
    getStrategy: () => strategyRef.current,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export default TimerContext;