// frontend/src/context/SmartReviewContext.jsx
import React, { useState, useCallback } from 'react';
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

      // Use parameter directly, not state (fixes infinite loop risk)
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
      // Assume it IS hard if rating is 1 (Optimistic assumption)
      if (rating === 1) {
        const currentPos = questionId ? questionIndex : prev.currentIndex;

        // Remove any existing future duplicates of this question (from previous hard ratings)
        // to prevent multiple copies accumulating in the array
        const ratedId = ratedQuestion._id;
        for (let i = updatedQuestions.length - 1; i > currentPos; i--) {
          if (updatedQuestions[i]._id === ratedId) {
            updatedQuestions.splice(i, 1);
          }
        }

        // Reinsert after 5 questions
        const insertPosition = currentPos + 5;

        // Log for debugging
        console.log(`[SmartReview] Optimistic Hard: Reinserting at ${insertPosition}`);

        // Insert copy of question
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
          // Do NOT set isLoading=true, we want instant update
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
          // currentIndex stays same as array shifts
        };
      } else {
        // Normal mode: remove ALL future duplicates of this question (from past hard ratings), then advance
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
    // Use functional setState to read latest state for the snapshot
    setState(prev => {
      sessionPersistence.saveToLocal({
        sessionId: prev.sessionId,
        sectionIds: prev.sectionIds,
        currentIndex: prev.currentIndex,
        reviewedToday: prev.reviewedToday,
        initialQuestionCount: prev.initialQuestionCount,
        todaysQuestions: prev.todaysQuestions,
        ratingHistory: ratingHistory,
        mode: prev.mode,
        cardMode: prev.cardMode
      });
      return prev; // Don't change state, just read it
    });

    // 2b. BACKGROUND API CALL
    // We don't await this for the UI update
    smartReviewService.recordRating(ratedQuestionId, rating)
      .then(response => {
        const result = response.data || response;
        console.log('[SmartReview] Background rating synced:', result);

        // If actual result contradicts our optimistic assumption (unlikely for hard/not-hard logic if consistent)
        // For 'hard' logic: Service returns isHard=true for rating 1. Our optimistic logic assumed true.
        // If business logic changes on backend, we might drift. For now, it matches.

        // Trigger background save of progress
        // using the LATEST state to ensure valid checkpoint
        // We need to access state again, or just fire-and-forget
        // Since we're inside the promise chain, 'state' variable is stale. 
        // We'll rely on the user's next action or auto-save interval to save exact progress,
        // OR we can trigger a save here if critical.
        // For performance, let's delay the save slightly or skip heavy saving on every click if auto-save exists.
        // The service logic had auto-save.

        // We'll replicate the save logic from before but non-blocking
      })
      .catch(error => {
        console.error('[SmartReview] Background rating failed:', error);
        // Ideally show a toast here: "Failed to save rating"
        // Reverting state is complex (popping history, moving index back). 
        // For now, we assume reliability.
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
          // No question to restore, just update counters
          return {
            ...prev,
            reviewedToday: Math.max(0, prev.reviewedToday - 1),
            currentIndex: Math.max(0, prev.currentIndex - 1)
          };
        }

        // Check if question already exists in array (normal mode case)
        const existingIndex = updatedQuestions.findIndex(q => q._id === questionToRestore._id);

        if (existingIndex !== -1) {
          // Question exists (normal mode) - just set currentIndex to point to it
          return {
            ...prev,
            reviewedToday: Math.max(0, prev.reviewedToday - 1),
            currentIndex: existingIndex
          };
        } else {
          // Question doesn't exist (elimination mode or was removed) - insert it back
          // Insert at currentIndex position so it becomes the current question
          const insertPosition = Math.max(0, prev.currentIndex);
          updatedQuestions.splice(insertPosition, 0, questionToRestore);

          return {
            ...prev,
            todaysQuestions: updatedQuestions,
            reviewedToday: Math.max(0, prev.reviewedToday - 1),
            // Keep currentIndex the same - the question was inserted at this position
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

      // If no IDs provided, fetch rolled-over question IDs first
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

      // Reload today's questions to include the new ones
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
      let currentSectionIds = null;
      let ratedIds = [];

      setState(prev => {
        currentSectionIds = prev.sectionIds;
        return { ...prev, isLoading: true };
      });

      // Get rated question IDs from history
      ratedIds = ratingHistory.map(r => r.questionId);

      // Mark unrated questions as pending for next session
      if (currentSectionIds && currentSectionIds.length > 0) {
        await smartReviewService.markUnratedAsPending(
          currentSectionIds,
          ratedIds
        );
      }

      // Clear localStorage progress
      sessionPersistence.clearLocal();

      // Reset state
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
  }, [ratingHistory]);

  /**
   * Pause the current session - saves progress & marks as paused for later resume
   * @param {string} mode - The current review mode (normal, flashcard, elimination, tiktok)
   * @param {string} cardMode - The card display mode (normal, flashcard)
   */
  const pauseSession = useCallback(async (mode = 'normal', cardMode = 'normal') => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Build Smart Review state for resume
      // Deduplicate rating history to prevent inflated currentIndex on resume
      const dedupedHistory = deduplicateRatingHistory(ratingHistory);

      const smartReviewState = {
        currentIndex: state.currentIndex,
        reviewedToday: state.reviewedToday,
        todaysQuestions: state.todaysQuestions.map(q => q._id),
        ratingHistory: dedupedHistory,
        sectionIds: state.sectionIds,
        initialQuestionCount: state.initialQuestionCount,
        mode: mode,
        cardMode: cardMode
      };

      console.log('[SmartReview PAUSE] Saving state:', {
        currentIndex: state.currentIndex,
        reviewedToday: state.reviewedToday,
        todaysQuestionsCount: state.todaysQuestions.length,
        todaysQuestionIds: state.todaysQuestions.map(q => q._id),
        rawRatingHistoryCount: ratingHistory.length,
        dedupedHistoryCount: dedupedHistory.length,
        initialQuestionCount: state.initialQuestionCount,
        rawHistory: ratingHistory.map(r => ({ qId: r.questionId, rating: r.rating })),
        dedupedHistory: dedupedHistory
      });

      // Save progress to session
      await sessionService.updateProgress({
        sectionIds: state.sectionIds,
        currentIndex: state.currentIndex,
        answeredQuestionIds: ratingHistory.map(r => r.questionId),
        status: 'paused',
        smartReviewState: smartReviewState,
        useSmartReview: true,
        cardMode: cardMode,
        currentMode: mode,
        sessionId: state.sessionId || undefined
      });

      console.log('[SmartReview] Session paused successfully');

      setState(prev => ({ ...prev, isLoading: false }));

      return { success: true };
    } catch (error) {
      console.error('[SmartReview] Error pausing session:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [state, ratingHistory]);

  const currentQuestion = state.todaysQuestions[state.currentIndex];
  // Session is complete if:
  // 1. Normal mode: currentIndex >= todaysQuestions.length (and there are questions)
  // 2. Elimination mode: all questions reviewed (todaysQuestions.length === 0 and reviewedToday > 0)
  // Update a question's data in the in-memory session array (for inline edits)
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
      ? (state.reviewedToday / state.initialQuestionCount) * 100  // Use reviewed count for accuracy (works for Elimination Mode)
      : (state.currentIndex / state.todaysQuestions.length) * 100  // Fallback to current calculation
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

      // Restore basic state
      setState(prev => ({
        ...prev,
        sectionIds: smartReviewState.sectionIds || [],
        // Map question IDs back to objects if needed, but usually we just need IDs for API
        // For now assuming we refetch or trust the passed data structure
        // Actually, smartReviewState.todaysQuestions might be IDs (from session object)?
        // If they are just IDs, we might need to fetch full objects?
        // Wait: The session object stored `todaysQuestions: map(q => q._id)` in pauseSession.
        // So we strictly have IDs. We need to re-fetch full question objects OR if the context can handle IDs.
        // But UI needs question text. 
        // Thus, we likely need to fetch questions by IDs.
        // Let's implement a re-hydration logic.
        isLoading: true
      }));

      // We need to re-fetch the full question objects for the IDs we have.
      // Or simply: Load Today's Questions again for the sections, then filter/restore?
      // Better: Use `resumeSessionState` to restore counters, but re-fetch questions to ensure freshness?
      // NO: If we re-fetch "today's questions", we might get a different set if logic changed or random.
      // We must fetch THESE specific questions.

      // Assume "todaysQuestions" in state is a list of IDs.
      const questionIdsToFetch = smartReviewState.todaysQuestions || [];

      // We need a service method to fetch specific questions by IDs
      // Assuming smartReviewService.getQuestionsByIds exists or we create it?
      // Or we just re-load today's questions for the section and hope it's same?
      // Smart Review is usually deterministic per day unless "add more" was used.

      // Let's try re-loading by section first, as that's safer for now without new API.
      // But we must correct the INDEX and HISTORY.

      const sectionIds = smartReviewState.sectionIds || [];
      if (sectionIds.length > 0) {
        loadTodaysQuestions(sectionIds).then(data => {
          // After loading, we forcibly restore the progress
          setState(prev => {
            // We might need to handle "hard" questions that were optimistic...
            // But for mvp resume:
            return {
              ...prev,
              currentIndex: smartReviewState.currentIndex || 0,
              reviewedToday: smartReviewState.reviewedToday || 0,
              initialQuestionCount: smartReviewState.initialQuestionCount || prev.todaysQuestions.length,
              // If rating history was saved as simple objects
              // We need to restore it too
            };
          });

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

      // If we have saved smartReviewState (from a paused session), use it to restore
      // the exact session state including hard-question duplicates and correct counters
      if (savedState && savedState.todaysQuestions && savedState.todaysQuestions.length > 0) {
        console.log('[SmartReviewContext] Restoring from saved smartReviewState');

        // Build a lookup map from the populated questions
        const questionMap = {};
        questions.forEach(q => {
          if (q && q._id) {
            questionMap[q._id.toString ? q._id.toString() : q._id] = q;
          }
        });

        // Reconstruct the question array from saved IDs (includes hard-duplicates)
        const reconstructedQuestions = savedState.todaysQuestions
          .map(id => {
            const idStr = id.toString ? id.toString() : id;
            return questionMap[idStr] || null;
          })
          .filter(Boolean);

        console.log('[SmartReviewContext] Reconstructed questions:', {
          savedIds: savedState.todaysQuestions.length,
          reconstructed: reconstructedQuestions.length,
          currentIndex: savedState.currentIndex,
          reviewedToday: savedState.reviewedToday
        });

        // Recompute reviewedToday and currentIndex from saved history
        // to fix inflation caused by hard-duplicate re-ratings
        const adjustedReviewedToday = computeReviewedCount(savedState.ratingHistory);
        const adjustedIndex = computeAdjustedIndex(
          savedState.currentIndex || 0,
          savedState.ratingHistory
        );

        console.log('[SmartReviewContext] RESUME diagnosis:', {
          // Saved state values
          savedCurrentIndex: savedState.currentIndex,
          savedReviewedToday: savedState.reviewedToday,
          savedTodaysQuestionsCount: savedState.todaysQuestions?.length,
          savedTodaysQuestionIds: savedState.todaysQuestions,
          savedRatingHistory: savedState.ratingHistory,
          savedInitialQuestionCount: savedState.initialQuestionCount,
          // Reconstructed values
          reconstructedQuestionsCount: reconstructedQuestions.length,
          // Adjusted values
          adjustedIndex,
          adjustedReviewedToday,
          // Populated questions from backend
          populatedQuestionsCount: questions.length,
          populatedQuestionIds: questions.map(q => q._id),
        });

        setState(prev => ({
          ...prev,
          sectionIds: sessionData.sectionIds || savedState.sectionIds || [],
          todaysQuestions: reconstructedQuestions,
          currentIndex: savedState.currentIndex || 0,
          reviewedToday: savedState.reviewedToday || 0,
          initialQuestionCount: savedState.initialQuestionCount || sessionData.totalQuestions || questions.length,
          dailyLimit: 0,
          rolledOverCount: 0,
          trackBreakdown: null,
          isLoading: false,
          error: null,
          sessionId: sessionData._id || sessionData.id || null
        }));

        // Restore rating history if saved
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