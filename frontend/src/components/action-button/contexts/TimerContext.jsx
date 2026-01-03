// src/components/action-button/contexts/TimerContext.jsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { getTimerStrategy } from '../services/timerStrategies';

const TimerContext = createContext();

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children, mode }) => {
  const [timerConfig, setTimerConfig] = useState(() => {
    const saved = localStorage.getItem('timerConfig');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const strategyRef = useRef(null);
  const updateIntervalRef = useRef(null);

  // Initialize strategy when mode or config changes
  const initializeStrategy = useCallback(() => {
    if (!timerConfig) {
      strategyRef.current = null;
      return;
    }

    // These functions need to be provided by the parent components
    const strategyOptions = {
      duration: timerConfig.duration,
      defaultMark: timerConfig.defaultMark,
      autoRestart: true,
      
      // Normal/Flashcard/TikTok modes need these:
      getCurrentQuestionId: () => currentQuestionId,
      onRateQuestion: async (questionId, rating) => {
        console.log(`[TimerContext] Rating question ${questionId} with ${rating}`);
        // This should call your existing rating API
        // For now, we'll just log it
        return Promise.resolve();
      },
      onAdvanceToNextQuestion: () => {
        console.log('[TimerContext] Advancing to next question');
        // Parent component should handle this
      },
      
      // Elimination mode needs these:
      getQuestionList: () => {
        console.log('[TimerContext] Getting question list');
        // Return array of {id, isRated}
        return [];
      },
      onQuestionAutoMarked: (questionId, rating) => {
        console.log(`[TimerContext] Question ${questionId} auto-marked with ${rating}`);
      },
      onTimerTargetChanged: (index) => {
        console.log(`[TimerContext] Timer target changed to index ${index}`);
      },
      
      onTimerWarning: (seconds, level) => {
        console.log(`[TimerContext] Timer warning: ${seconds}s left (${level})`);
        // Could trigger sound/notification
      },
    };

    strategyRef.current = getTimerStrategy(mode, strategyOptions);
  }, [timerConfig, mode, currentQuestionId]);

  // Start timer
  const startTimer = useCallback((config) => {
    setTimerConfig(config);
    setIsTimerActive(true);
    localStorage.setItem('timerConfig', JSON.stringify(config));
    
    // Initialize and start strategy
    setTimeout(() => {
      initializeStrategy();
      if (strategyRef.current) {
        strategyRef.current.startTimer(config.duration, config.defaultMark);
        
        // Start updating time left display
        updateIntervalRef.current = setInterval(() => {
          if (strategyRef.current) {
            setTimeLeft(strategyRef.current.getTimeLeft());
          }
        }, 250);
      }
    }, 0);
  }, [initializeStrategy]);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (strategyRef.current) {
      strategyRef.current.stopTimer();
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    setIsTimerActive(false);
    setTimeLeft(0);
  }, []);

  // Notify when user manually rates a question
  const notifyManualRating = useCallback((questionId, rating) => {
    if (strategyRef.current) {
      strategyRef.current.onManualRate(questionId, rating);
    }
  }, []);

  // Update current question (for Normal/Flashcard/TikTok modes)
  const setCurrentQuestion = useCallback((questionId) => {
    setCurrentQuestionId(questionId);
  }, []);

  // Update question list (for Elimination mode)
  const updateQuestionList = useCallback(() => {
    if (strategyRef.current?.updateQuestionList) {
      strategyRef.current.updateQuestionList();
    }
  }, []);

  // Cleanup
  React.useEffect(() => {
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
    timerConfig,
    isTimerActive,
    timeLeft,
    currentQuestionId,
    
    // Actions
    startTimer,
    stopTimer,
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