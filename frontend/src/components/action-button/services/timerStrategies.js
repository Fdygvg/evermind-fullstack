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
  } = options;

  let currentTimer = null;
  let isPaused = false;

  const startTimerInternal = (duration, defaultMark, questionId) => {
    if (!questionId) return;

    console.log(`[TIMER ${mode}] Starting ${duration}s timer for question:`, questionId);

    let timeLeft = duration;

    currentTimer = {
      questionId,
      startTime: Date.now(),
      duration,
      interval: setInterval(() => {
        if (isPaused) return;

        timeLeft--;

        // Emit warnings
        if (timeLeft === 30) onTimerWarning?.(30, 'low');
        if (timeLeft === 10) onTimerWarning?.(10, 'critical');
        if (timeLeft === 5) onTimerWarning?.(5, 'critical');

        // Timer ended
        if (timeLeft <= 0) {
          clearInterval(currentTimer.interval);
          currentTimer = null;

          console.log(`[TIMER ${mode}] Auto-marking question ${questionId} with rating ${defaultMark}`);

          // Auto-rate the current question
          onRateQuestion(questionId, defaultMark)
            .then(() => {
              console.log(`[TIMER ${mode}] Auto-mark successful, advancing to next question`);
              onAdvanceToNextQuestion?.();

              // Restart timer for new question if autoRestart enabled
              if (options.autoRestart) {
                setTimeout(() => {
                  const newQuestionId = getCurrentQuestionId();
                  if (newQuestionId) {
                    startTimerInternal(duration, defaultMark, newQuestionId);
                  }
                }, 500);
              }
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

      // Clear current timer
      if (currentTimer) {
        clearInterval(currentTimer.interval);
        currentTimer = null;
      }

      // In these modes, rating automatically advances to next question
      // The parent component handles advancement
      // We just need to restart timer for the new question

      setTimeout(() => {
        if (options.autoRestart) {
          const newQuestionId = getCurrentQuestionId();
          if (newQuestionId && newQuestionId !== questionId) {
            // Only restart if we're on a new question
            startTimerInternal(options.duration, options.defaultMark, newQuestionId);
          }
        }
      }, 100);
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
      // Calculate based on start time and duration
      const elapsed = Math.floor((Date.now() - currentTimer.startTime) / 1000);
      return Math.max(0, currentTimer.duration - elapsed);
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
      startTime: Date.now(),
      duration,
      interval: setInterval(() => {
        if (isPaused) return;

        timeLeft--;

        if (timeLeft === 30) onTimerWarning?.(30, 'low');
        if (timeLeft === 10) onTimerWarning?.(10, 'critical');
        if (timeLeft === 5) onTimerWarning?.(5, 'critical');

        if (timeLeft <= 0) {
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
      const elapsed = Math.floor((Date.now() - currentTimer.startTime) / 1000);
      return Math.max(0, currentTimer.duration - elapsed);
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