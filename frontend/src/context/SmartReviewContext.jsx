// frontend/src/context/SmartReviewContext.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import SmartReviewContextInstance from './SmartReviewContextInstance';
import { smartReviewService } from '../services/smartReviewService';
import { sessionService } from '../services/sessions';
import { sessionPersistence } from '../services/sessionPersistence';

export const SmartReviewContext = SmartReviewContextInstance;

// === Helper functions for pause/resume correctness ===

// Keep only the LAST (most recent) rating per question
function deduplicateRatingHistory(history) {
  const lastRatingMap = new Map();
  history.forEach(r => {
    lastRatingMap.set(r.questionId, { questionId: r.questionId, rating: r.rating });
  });
  return Array.from(lastRatingMap.values());
}

// Count unique questions whose last rating was NOT hard (1)
function computeReviewedCount(ratingHistory) {
  if (!ratingHistory || ratingHistory.length === 0) return 0;
  const lastRatingMap = new Map();
  ratingHistory.forEach(r => lastRatingMap.set(r.questionId, r.rating));
  let count = 0;
  lastRatingMap.forEach(rating => {
    if (rating !== 1) count++;
  });
  return count;
}

// Adjust currentIndex by subtracting consumed hard-duplicate positions
function computeAdjustedIndex(savedIndex, ratingHistory) {
  if (!ratingHistory || ratingHistory.length === 0) return savedIndex;
  const counts = {};
  ratingHistory.forEach(r => {
    counts[r.questionId] = (counts[r.questionId] || 0) + 1;
  });
  // Each duplicate entry beyond the first represents a consumed hard-duplicate position
  let duplicateCount = 0;
  Object.values(counts).forEach(c => { duplicateCount += (c - 1); });
  return Math.max(0, savedIndex - duplicateCount);
}

export const SmartReviewProvider = ({ children }) => {
  const [state, setState] = useState({
    sectionIds: [],
    todaysQuestions: [],
    currentIndex: 0,
    reviewedToday: 0,
    dailyLimit: 0,
    rolledOverCount: 0,
    trackBreakdown: null,
    isLoading: false,
    error: null,
    initialQuestionCount: 0,
    sessionId: null
  });

  const [ratingHistory, setRatingHistory] = useState([]);
  const [sectionProgress, setSectionProgress] = useState({});

  // --- FIX #1: Keep a ref to ratingHistory so pauseSession and rateQuestion
  //     always read the CURRENT value, not a stale closure snapshot ---
  const ratingHistoryRef = useRef([]);
  useEffect(() => {
    ratingHistoryRef.current = ratingHistory;
  }, [ratingHistory]);

  // --- FIX: Keep a ref to state so pauseSession/endSession can read it reliably
  //     (React 18 batches setState, so updater callbacks may not run synchronously) ---
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const loadSectionProgress = async (sectionIds) => {
    try {
      const response = await smartReviewService.getSectionProgress(sectionIds);
      setSectionProgress(response.progresses || {});
    } catch (error) {
      console.error('Error loading section progress:', error);
    }
  };

  const loadTodaysQuestions = useCallback(async (sectionIds) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (!sectionIds || sectionIds.length === 0) {
        throw new Error('Please select at least one section');
      }

      // RESET STATE IMMEDIATELY to prevent "Session Complete" flash/redirect loop
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        todaysQuestions: [],
        currentIndex: 0,
        reviewedToday: 0,
        dailyLimit: 0,
        rolledOverCount: 0,
        initialQuestionCount: 0
      }));
      setRatingHistory([]); // Ensure history is cleared

      const response = await smartReviewService.getTodaysQuestions(sectionIds);
      const data = response.data || response;

      console.log('[SmartReview] Loaded questions:', data);

      await loadSectionProgress(sectionIds);
      const questions = data.todaysQuestions || data.data?.todaysQuestions || [];

      console.log('[SmartReview Context] Setting questions:', {
        questionsCount: questions.length,
        questions: questions.map(q => ({ id: q._id, question: q.question?.substring(0, 50) }))
      });

      setState(prev => ({
        ...prev,
        sectionIds: sectionIds,
        todaysQuestions: questions,
        currentIndex: 0,
        dailyLimit: data.stats?.dailyLimit || data.data?.stats?.dailyLimit || 0,
        rolledOverCount: data.stats?.rolledOverCount || data.data?.stats?.rolledOverCount || 0,
        reviewedToday: 0,
        trackBreakdown: data.stats?.trackBreakdown || null,
        isLoading: false,
        initialQuestionCount: questions.length
      }));

      return data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      throw error;
    }
  }, []); // Empty deps - no dependency on state

  const rateQuestion = useCallback(async (rating, questionId = null) => {
    // Fix stale closure: use functional setState to access current values
    let ratedQuestionId = null;
    let ratedQuestion = null;
    let questionIndex = -1;

    // Get question info to rate
    let currentState = null;
    setState(prev => {
      currentState = prev;
      return prev;
    });

    if (questionId) {
      questionIndex = currentState.todaysQuestions.findIndex(q => q._id === questionId);
      ratedQuestion = currentState.todaysQuestions[questionIndex];
    } else {
      questionIndex = currentState.currentIndex;
      ratedQuestion = currentState.todaysQuestions[currentState.currentIndex];
    }

    if (!ratedQuestion) {
      console.error('[SmartReview] No question to rate');
      return;
    }

    ratedQuestionId = ratedQuestion._id;
    console.log('[SmartReview] Optimistically rating question:', ratedQuestionId, 'with rating:', rating);

    // 1. OPTIMISTIC UPDATE
    setState(prev => {
      // Create fresh copies
      const updatedQuestions = [...prev.todaysQuestions];
      const historyEntry = {
        questionId: ratedQuestionId,
        rating,
        question: ratedQuestion,
        timestamp: new Date()
      };

      // Update history immediately
      setRatingHistory(h => [...h, historyEntry]);

      // HANDLING FOR HARD RATING (1):
      if (rating === 1) {
        const currentPos = questionId ? questionIndex : prev.currentIndex;

        // Remove any existing future duplicates of this question
        const ratedId = ratedQuestion._id;
        for (let i = updatedQuestions.length - 1; i > currentPos; i--) {
          if (updatedQuestions[i]._id === ratedId) {
            updatedQuestions.splice(i, 1);
          }
        }

        // Reinsert after 5 questions
        const insertPosition = currentPos + 5;
        console.log(`[SmartReview] Optimistic Hard: Reinserting at ${insertPosition}`);

        const questionClone = { ...ratedQuestion };

        if (insertPosition <= updatedQuestions.length) {
          updatedQuestions.splice(insertPosition, 0, questionClone);
        } else {
          updatedQuestions.push(questionClone);
        }

        // If elimination mode (specific ID), remove original instance
        if (questionId) {
          updatedQuestions.splice(questionIndex, 1);
        }

        return {
          ...prev,
          todaysQuestions: updatedQuestions,
          reviewedToday: prev.reviewedToday, // Don't increment for Hard (it's re-queued)
          currentIndex: questionId ? prev.currentIndex : prev.currentIndex + 1,
        };
      }

      // HANDLING FOR RATINGS 2-5:
      if (questionId) {
        // Elimination mode: remove from array
        updatedQuestions.splice(questionIndex, 1);
        return {
          ...prev,
          todaysQuestions: updatedQuestions,
          reviewedToday: prev.reviewedToday + 1,
        };
      } else {
        // Normal mode: remove ALL future duplicates of this question, then advance
        const ratedId = ratedQuestion._id;
        for (let i = updatedQuestions.length - 1; i > prev.currentIndex; i--) {
          if (updatedQuestions[i]._id === ratedId) {
            updatedQuestions.splice(i, 1);
          }
        }
        return {
          ...prev,
          todaysQuestions: updatedQuestions,
          reviewedToday: prev.reviewedToday + 1,
          currentIndex: prev.currentIndex + 1,
        };
      }
    });

    // 2a. SAVE TO LOCALSTORAGE immediately (instant, no network needed)
    // --- FIX #3: Use ratingHistoryRef to get the actual current history,
    //     not the stale closure value. We read it AFTER setRatingHistory queues
    //     the new entry (it may not be committed yet, so we build the expected new history) ---
    setState(prev => {
      const currentHistory = ratingHistoryRef.current;
      sessionPersistence.saveToLocal({
        sessionId: prev.sessionId,
        sectionIds: prev.sectionIds,
        currentIndex: prev.currentIndex,
        reviewedToday: prev.reviewedToday,
        initialQuestionCount: prev.initialQuestionCount,
        todaysQuestions: prev.todaysQuestions,
        ratingHistory: currentHistory,
        mode: prev.mode,
        cardMode: prev.cardMode
      });
      return prev; // Don't change state, just read it
    });

    // 2b. BACKGROUND API CALL
    smartReviewService.recordRating(ratedQuestionId, rating)
      .then(response => {
        const result = response.data || response;
        console.log('[SmartReview] Background rating synced:', result);
      })
      .catch(error => {
        console.error('[SmartReview] Background rating failed:', error);
      });

  }, []); // Remove dependencies to keep it stable

  const undoLastRating = useCallback(async () => {
    if (ratingHistory.length === 0) return;

    const lastAction = ratingHistory[ratingHistory.length - 1];

    try {
      await smartReviewService.resetQuestionPriority(lastAction.questionId);

      setRatingHistory(prev => prev.slice(0, -1));

      setState(prev => {
        const updatedQuestions = [...prev.todaysQuestions];
        const questionToRestore = lastAction.question;

        if (!questionToRestore) {
          return {
            ...prev,
            reviewedToday: Math.max(0, prev.reviewedToday - 1),
            currentIndex: Math.max(0, prev.currentIndex - 1)
          };
        }

        const existingIndex = updatedQuestions.findIndex(q => q._id === questionToRestore._id);

        if (existingIndex !== -1) {
          return {
            ...prev,
            reviewedToday: Math.max(0, prev.reviewedToday - 1),
            currentIndex: existingIndex
          };
        } else {
          const insertPosition = Math.max(0, prev.currentIndex);
          updatedQuestions.splice(insertPosition, 0, questionToRestore);

          return {
            ...prev,
            todaysQuestions: updatedQuestions,
            reviewedToday: Math.max(0, prev.reviewedToday - 1),
            currentIndex: prev.currentIndex
          };
        }
      });

      return true;
    } catch (error) {
      console.error('Error undoing rating:', error);
      throw error;
    }
  }, [ratingHistory]);

  const addMoreQuestions = useCallback(async (questionIds) => {
    try {
      let currentSectionIds = null;

      setState(prev => {
        currentSectionIds = prev.sectionIds;
        return { ...prev, isLoading: true };
      });

      let idsToAdd = questionIds;

      if (!idsToAdd || idsToAdd.length === 0) {
        console.log('[SmartReview] Fetching rolled-over question IDs...');
        const rolledOverResponse = await smartReviewService.getRolledOverQuestions(currentSectionIds);
        const rolledOverData = rolledOverResponse.data || rolledOverResponse;
        const rolledOverQuestions = rolledOverData.rolledOverQuestions || rolledOverData.data?.rolledOverQuestions || [];
        idsToAdd = rolledOverQuestions.map(q => q._id);
        console.log('[SmartReview] Found rolled-over IDs:', idsToAdd);
      }

      if (!idsToAdd || idsToAdd.length === 0) {
        console.log('[SmartReview] No rolled-over questions to add');
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, message: 'No questions to add' };
      }

      const result = await smartReviewService.addMoreQuestions(idsToAdd);
      console.log('[SmartReview] Added questions result:', result);

      await loadTodaysQuestions(currentSectionIds);

      return result;
    } catch (error) {
      console.error('[SmartReview] Error adding more questions:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [loadTodaysQuestions]);

  const endSession = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Read from stateRef (reliable in React 18)
      const currentSectionIds = stateRef.current.sectionIds;

      // Use ref to get current rating history
      const ratedIds = ratingHistoryRef.current.map(r => r.questionId);

      if (currentSectionIds && currentSectionIds.length > 0) {
        await smartReviewService.markUnratedAsPending(currentSectionIds, ratedIds);
      }

      // Clear all generated AI interactive checkboxes tied to this session
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('session_checkboxes_')) {
          localStorage.removeItem(key);
        }
      });

      sessionPersistence.clearLocal();

      setState({
        sectionIds: [],
        todaysQuestions: [],
        currentIndex: 0,
        reviewedToday: 0,
        dailyLimit: 0,
        rolledOverCount: 0,
        trackBreakdown: null,
        isLoading: false,
        error: null,
        initialQuestionCount: 0
      });

      setRatingHistory([]);
      setSectionProgress({});

      console.log('[SmartReview] Session ended, unrated questions marked as pending');

      return { success: true };
    } catch (error) {
      console.error('[SmartReview] Error ending session:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []); // FIX: removed ratingHistory dependency; uses ref instead

  /**
   * Pause the current session - saves progress & marks as paused for later resume
   */
  const pauseSession = useCallback(async (mode = 'normal', cardMode = 'normal') => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // --- FIX: Read ratingHistory from ref (always current) ---
      const currentHistory = ratingHistoryRef.current;
      const dedupedHistory = deduplicateRatingHistory(currentHistory);

      // --- FIX: Read state from ref (React 18 batches setState, so the
      //     setState-callback trick to read state is unreliable) ---
      const currentState = stateRef.current;

      const smartReviewState = {
        currentIndex: currentState.currentIndex,
        reviewedToday: currentState.reviewedToday,
        todaysQuestions: currentState.todaysQuestions.map(q => q._id),
        ratingHistory: dedupedHistory,
        sectionIds: currentState.sectionIds,
        initialQuestionCount: currentState.initialQuestionCount,
        mode: mode,
        cardMode: cardMode
      };

      console.log('[SmartReview PAUSE] Saving state:', {
        currentIndex: currentState.currentIndex,
        reviewedToday: currentState.reviewedToday,
        todaysQuestionsCount: currentState.todaysQuestions.length,
        rawRatingHistoryCount: currentHistory.length,
        dedupedHistoryCount: dedupedHistory.length,
        dedupedHistory: dedupedHistory
      });

      await sessionService.updateProgress({
        sectionIds: currentState.sectionIds,
        currentIndex: currentState.currentIndex,
        answeredQuestionIds: currentHistory.map(r => r.questionId),
        status: 'paused',
        smartReviewState: smartReviewState,
        useSmartReview: true,
        cardMode: cardMode,
        currentMode: mode,
        sessionId: currentState.sessionId || undefined
      });

      console.log('[SmartReview] Session paused successfully');

      setState(prev => ({ ...prev, isLoading: false }));

      return { success: true };
    } catch (error) {
      console.error('[SmartReview] Error pausing session:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []); // no dependencies needed — reads everything via refs

  const currentQuestion = state.todaysQuestions[state.currentIndex];

  const updateQuestionInSession = useCallback((questionId, updates) => {
    setState(prev => ({
      ...prev,
      todaysQuestions: prev.todaysQuestions.map(q =>
        (q._id === questionId || q.id === questionId)
          ? { ...q, ...updates }
          : q
      )
    }));
  }, []);

  const isSessionComplete = (state.todaysQuestions.length > 0 && state.currentIndex >= state.todaysQuestions.length) ||
    (state.todaysQuestions.length === 0 && state.reviewedToday > 0 && state.initialQuestionCount > 0);

  const progress = state.todaysQuestions.length > 0
    ? state.initialQuestionCount > 0
      ? (state.reviewedToday / state.initialQuestionCount) * 100
      : (state.currentIndex / state.todaysQuestions.length) * 100
    : 0;

  const value = {
    // State
    ...state,
    currentQuestion,
    isSessionComplete,
    progress,
    ratingHistory,
    sectionProgress,
    canUndo: ratingHistory.length > 0,

    // Actions
    loadTodaysQuestions,
    rateQuestion,
    undoLastRating,
    addMoreQuestions,
    loadSectionProgress,
    endSession,
    pauseSession,
    updateQuestionInSession,

    // Service helpers (optional)
    getPriorityInfo: smartReviewService.getPriorityInfo,
    getRatingInfo: smartReviewService.getRatingInfo,
    calculateProgress: smartReviewService.calculateProgress,

    // Resume session state
    resumeSessionState: useCallback((smartReviewState) => {
      console.log('[SmartReviewContext] Resuming session with state:', smartReviewState);

      if (!smartReviewState) {
        console.error('[SmartReviewContext] No state to resume');
        return;
      }

      setState(prev => ({
        ...prev,
        sectionIds: smartReviewState.sectionIds || [],
        isLoading: true
      }));

      const sectionIds = smartReviewState.sectionIds || [];
      if (sectionIds.length > 0) {
        loadTodaysQuestions(sectionIds).then(() => {
          setState(prev => ({
            ...prev,
            currentIndex: smartReviewState.currentIndex || 0,
            reviewedToday: smartReviewState.reviewedToday || 0,
            initialQuestionCount: smartReviewState.initialQuestionCount || prev.todaysQuestions.length,
          }));

          if (smartReviewState.ratingHistory) {
            setRatingHistory(smartReviewState.ratingHistory);
          }

          console.log('[SmartReviewContext] Resume complete');
        }).catch(err => {
          console.error('[SmartReviewContext] Resume failed to load questions:', err);
        });
      }
    }, [loadTodaysQuestions]),

    // Initialize session directly from data (for Quick Play / Simplified Mode)
    initializeFromSession: useCallback((sessionData) => {
      console.log('[SmartReviewContext] Initializing from session data:', sessionData);

      const questions = sessionData.remainingQuestions || sessionData.questions || [];
      const savedState = sessionData.smartReviewState;

      if (savedState && savedState.todaysQuestions && savedState.todaysQuestions.length > 0) {
        console.log('[SmartReviewContext] Restoring from saved smartReviewState');

        const questionMap = {};
        questions.forEach(q => {
          if (q && q._id) {
            questionMap[q._id.toString ? q._id.toString() : q._id] = q;
          }
        });

        let reconstructedQuestions = savedState.todaysQuestions
          .map(id => {
            const idStr = id.toString ? id.toString() : id;
            return questionMap[idStr] || null;
          })
          .filter(Boolean);

        // --- FIX #2: Apply the ADJUSTED index and reviewed count ---
        // These are computed correctly but were previously ignored.
        let adjustedReviewedToday = computeReviewedCount(savedState.ratingHistory);
        let adjustedIndex = computeAdjustedIndex(
          savedState.currentIndex || 0,
          savedState.ratingHistory
        );

        // --- FIX: FALLBACK when reconstruction fails (ID mismatch) ---
        // If no questions could be reconstructed from saved IDs but we have
        // the full remainingQuestions array from the backend, use those instead.
        if (reconstructedQuestions.length === 0 && questions.length > 0) {
          console.warn('[SmartReviewContext] Reconstruction failed! Falling back to remainingQuestions directly.');
          console.warn('[SmartReviewContext] Debug:', {
            savedIdsCount: savedState.todaysQuestions.length,
            savedIdsSample: savedState.todaysQuestions.slice(0, 3),
            questionMapKeysCount: Object.keys(questionMap).length,
            questionMapKeysSample: Object.keys(questionMap).slice(0, 3),
          });

          // Use the full remaining questions, offset by currentIndex
          const savedIndex = savedState.currentIndex || 0;
          // The remaining questions from the backend represent the FULL session queue.
          // Slice from the saved index position to get what's left to review.
          reconstructedQuestions = questions.slice(Math.min(savedIndex, questions.length));
          adjustedIndex = 0; // We already sliced, so start from 0
          adjustedReviewedToday = savedState.reviewedToday || 0;
        }

        console.log('[SmartReviewContext] RESUME diagnosis:', {
          savedCurrentIndex: savedState.currentIndex,
          savedReviewedToday: savedState.reviewedToday,
          reconstructedQuestionsCount: reconstructedQuestions.length,
          adjustedIndex,
          adjustedReviewedToday,
        });

        setState(prev => ({
          ...prev,
          sectionIds: sessionData.sectionIds || savedState.sectionIds || [],
          todaysQuestions: reconstructedQuestions,
          // FIX #2: Use adjusted values, not raw saved values
          currentIndex: adjustedIndex,
          reviewedToday: adjustedReviewedToday,
          initialQuestionCount: savedState.initialQuestionCount || sessionData.totalQuestions || questions.length,
          dailyLimit: 0,
          rolledOverCount: 0,
          trackBreakdown: null,
          isLoading: false,
          error: null,
          sessionId: sessionData._id || sessionData.id || null
        }));

        if (savedState.ratingHistory && savedState.ratingHistory.length > 0) {
          setRatingHistory(savedState.ratingHistory);
        } else {
          setRatingHistory([]);
        }
      } else {
        // Fresh session (no saved state) — original logic
        console.log('[SmartReviewContext] Fresh session initialization');

        setState(prev => ({
          ...prev,
          sectionIds: sessionData.sectionIds || [],
          todaysQuestions: questions,
          currentIndex: sessionData.currentIndex || 0,
          reviewedToday: sessionData.currentIndex || (sessionData.totalQuestions ? (sessionData.totalQuestions - questions.length) : 0),
          initialQuestionCount: sessionData.totalQuestions || questions.length,
          dailyLimit: 0,
          rolledOverCount: 0,
          trackBreakdown: null,
          isLoading: false,
          error: null,
          sessionId: sessionData._id || sessionData.id || null
        }));

        setRatingHistory([]);
      }
    }, [])
  };

  return (
    <SmartReviewContext.Provider value={value}>
      {children}
    </SmartReviewContext.Provider>
  );
};