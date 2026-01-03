// src/components/action-button/services/timerStrategies.js

/**
 * Normal/Flashcard/TikTok Mode Strategy
 * - One question at a time
 * - Timer resets on any rating
 */
// src/components/action-button/services/timerStrategies.js

/**
 * Normal/Flashcard/TikTok Mode Strategy
 * - One question at a time
 * - Timer resets on any rating
 */
export const createSingleQuestionStrategy = (options) => {
  const {
    getCurrentQuestionId,
    onRateQuestion,           // Function to rate question: (questionId, rating) => Promise
    onAdvanceToNextQuestion,  // Function to move to next question
    onTimerWarning,
    mode = 'normal',
    autoRestart = true,
  } = options;

  let currentTimer = null;
  let isPaused = false;

  const startTimerInternal = (duration, defaultMark, questionId) => {
    // Fallback if no question ID is available (e.g. loading or error state)
    // This ensures the timer visual still works for the user
    if (!questionId) {
      console.warn(`[TIMER ${mode}] No question ID provided, waiting for question...`);
      return;
    }

    // Don't start if already running for this question
    if (currentTimer && currentTimer.questionId === questionId) {
      return;
    }

    // Clear any existing timer
    if (currentTimer) {
      clearInterval(currentTimer.interval);
    }

    console.log(`[TIMER ${mode}] Starting ${duration}s timer for question:`, questionId);

    let timeLeft = duration;

    currentTimer = {
      questionId,
      timeLeft, // Store initial time left
      startTime: Date.now(),
      duration,
      interval: setInterval(() => {
        if (isPaused) return;

        currentTimer.timeLeft--; // Decrement stored time left
        const currentTimeLeft = currentTimer.timeLeft;

        // Emit warnings
        if (currentTimeLeft === 30) onTimerWarning?.(30, 'low');
        if (currentTimeLeft === 10) onTimerWarning?.(10, 'critical');
        if (currentTimeLeft === 5) onTimerWarning?.(5, 'critical');

        // Timer ended
        if (currentTimeLeft <= 0) {
          clearInterval(currentTimer.interval);
          currentTimer = null;

          console.log(`[TIMER ${mode}] Auto-marking question ${questionId} with rating ${defaultMark}`);

          // Auto-rate the current question
          onRateQuestion(questionId, defaultMark)
            .then(() => {
              console.log(`[TIMER ${mode}] Auto-mark successful, advancing`);
              onAdvanceToNextQuestion?.();

              // Note: onQuestionChanged will handle restarting the timer
              // when the new question is loaded
            })
            .catch(err => {
              console.error(`[TIMER ${mode}] Auto-mark failed:`, err);
            });
        }
      }, 1000),
    };
  };

  return {
    startTimer: (duration, defaultMark) => {
      const questionId = getCurrentQuestionId();
      startTimerInternal(duration, defaultMark, questionId);
    },

    onManualRate: (questionId, rating) => {
      console.log(`[TIMER ${mode}] Manual rating ${rating} for ${questionId}`);

      // Clear current timer as we're done with this question
      if (currentTimer) {
        clearInterval(currentTimer.interval);
        currentTimer = null;
      }

      // We don't auto-restart here anymore.
      // We wait for onQuestionChanged to be called when the new question arrives.
    },

    // New method: called when the active question ID changes
    onQuestionChanged: (newQuestionId) => {
      console.log(`[TIMER ${mode}] Question changed to: ${newQuestionId}`);

      // If auto-restart is enabled, start timer for new question
      if (autoRestart && newQuestionId) {
        startTimerInternal(options.duration, options.defaultMark, newQuestionId);
      }
    },

    pauseTimer: () => {
      isPaused = true;
    },

    resumeTimer: () => {
      isPaused = false;
    },

    stopTimer: () => {
      if (currentTimer) {
        clearInterval(currentTimer.interval);
        currentTimer = null;
      }
      isPaused = false;
    },

    getCurrentQuestionId: () => currentTimer?.questionId,
    getTimeLeft: () => {
      if (!currentTimer) return 0;
      return Math.max(0, currentTimer.timeLeft);
    },
  };
};

/**
 * Elimination Mode Strategy
 * - All questions visible
 * - Timer applies to first unrated question
 * - Moves down list as questions are rated
 */
export const createEliminationStrategy = (options) => {
  const {
    getQuestionList,          // Returns array of {id, isRated}
    onRateQuestion,           // (questionId, rating) => Promise
    onQuestionAutoMarked,     // Callback when question auto-marked
    onTimerWarning,
    onTimerTargetChanged,     // When timer moves to new question
  } = options;

  let currentTimer = null;
  let currentQuestionIndex = 0;
  let isPaused = false;

  // Find first unrated question starting from index
  const findFirstUnratedIndex = (startFrom = 0) => {
    const questions = getQuestionList();
    for (let i = startFrom; i < questions.length; i++) {
      if (!questions[i].isRated) return i;
    }
    return -1;
  };

  const startTimerForIndex = (index, duration, defaultMark) => {
    const questions = getQuestionList();
    if (index < 0 || index >= questions.length || questions[index].isRated) {
      console.log('[TIMER elimination] No unrated questions found');
      return;
    }

    const questionId = questions[index].id;
    currentQuestionIndex = index;

    console.log(`[TIMER elimination] Starting timer for question #${index}:`, questionId);

    let timeLeft = duration;

    currentTimer = {
      questionId,
      questionIndex: index,
      timeLeft, // Store initial time left
      startTime: Date.now(),
      duration,
      interval: setInterval(() => {
        if (isPaused) return;

        currentTimer.timeLeft--; // Decrement stored time left
        const currentTimeLeft = currentTimer.timeLeft;

        if (currentTimeLeft === 30) onTimerWarning?.(30, 'low');
        if (currentTimeLeft === 10) onTimerWarning?.(10, 'critical');
        if (currentTimeLeft === 5) onTimerWarning?.(5, 'critical');

        if (currentTimeLeft <= 0) {
          clearInterval(currentTimer.interval);
          const expiredQuestionId = currentTimer.questionId;
          currentTimer = null;

          console.log(`[TIMER elimination] Auto-marking question ${expiredQuestionId} with ${defaultMark}`);

          // Auto-rate this question
          onRateQuestion(expiredQuestionId, defaultMark)
            .then(() => {
              onQuestionAutoMarked?.(expiredQuestionId, defaultMark);

              // Move to next unrated question
              const nextIndex = findFirstUnratedIndex(currentQuestionIndex + 1);

              if (nextIndex !== -1) {
                // Notify UI that timer target changed
                onTimerTargetChanged?.(nextIndex);

                // Restart timer for next question
                setTimeout(() => {
                  startTimerForIndex(nextIndex, duration, defaultMark);
                }, 500);
              } else {
                console.log('[TIMER elimination] All questions completed!');
              }
            })
            .catch(err => {
              console.error('[TIMER elimination] Auto-mark failed:', err);
            });
        }
      }, 1000),
    };

    // Notify UI of new target
    onTimerTargetChanged?.(index);
  };

  return {
    startTimer: (duration, defaultMark) => {
      const firstIndex = findFirstUnratedIndex(0);
      startTimerForIndex(firstIndex, duration, defaultMark);
    },

    onManualRate: (questionId, rating) => {
      console.log(`[TIMER elimination] Manual rating ${rating} for ${questionId}`);

      // Check if the rated question is our current target
      if (currentTimer && currentTimer.questionId === questionId) {
        // Clear timer for this question
        clearInterval(currentTimer.interval);
        currentTimer = null;

        // Move to next unrated question
        const nextIndex = findFirstUnratedIndex(currentQuestionIndex + 1);

        if (nextIndex !== -1 && options.autoRestart) {
          setTimeout(() => {
            startTimerForIndex(nextIndex, options.duration, options.defaultMark);
          }, 100);
        }
      }
      // If rating a different question, timer continues on current one
    },

    // Call when question list updates (questions added/removed)
    updateQuestionList: () => {
      if (!currentTimer) {
        // No timer running, start one if needed
        if (options.autoRestart) {
          const firstIndex = findFirstUnratedIndex(0);
          if (firstIndex !== -1) {
            startTimerForIndex(firstIndex, options.duration, options.defaultMark);
          }
        }
        return;
      }

      // Check if current question still exists and is unrated
      const questions = getQuestionList();
      const currentQuestion = questions.find(q => q.id === currentTimer.questionId);

      if (!currentQuestion || currentQuestion.isRated) {
        // Our target is gone or already rated
        clearInterval(currentTimer.interval);
        currentTimer = null;

        // Find new target
        const newIndex = findFirstUnratedIndex(0);
        if (newIndex !== -1 && options.autoRestart) {
          startTimerForIndex(newIndex, options.duration, options.defaultMark);
        }
      }
    },

    pauseTimer: () => {
      isPaused = true;
    },

    resumeTimer: () => {
      isPaused = false;
    },

    stopTimer: () => {
      if (currentTimer) {
        clearInterval(currentTimer.interval);
        currentTimer = null;
      }
      isPaused = false;
    },

    getCurrentQuestionId: () => currentTimer?.questionId,
    getCurrentQuestionIndex: () => currentQuestionIndex,
    getTimeLeft: () => {
      if (!currentTimer) return 0;
      return Math.max(0, currentTimer.timeLeft);
    },
  };
};

/**
 * Factory function to get appropriate strategy for each mode
 */
export const getTimerStrategy = (mode, options) => {
  const baseOptions = {
    autoRestart: true, // Automatically restart timer for next question
    ...options,
  };

  switch (mode) {
    case 'elimination':
      return createEliminationStrategy(baseOptions);
    case 'normal':
    case 'flashcard':
    case 'tiktok':
    default:
      return createSingleQuestionStrategy({ ...baseOptions, mode });
  }
};