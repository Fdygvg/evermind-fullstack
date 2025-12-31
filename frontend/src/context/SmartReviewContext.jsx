// frontend/src/context/SmartReviewContext.jsx
import React, { createContext, useState, useCallback } from 'react';
import { smartReviewService } from '../services/smartReviewService';

export const SmartReviewContext = createContext();

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
    error: null
  });

  const [ratingHistory, setRatingHistory] = useState([]);
  const [sectionProgress, setSectionProgress] = useState({});
  const [hardQuestions, setHardQuestions] = useState([]); // Track hard questions for reinsertion


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

      const response = await smartReviewService.getTodaysQuestions(sectionIds);
      const data = response.data || response;

      console.log('[SmartReview] Loaded questions:', data);

      await loadSectionProgress(sectionIds);
      setState(prev => ({
        ...prev,
        sectionIds: sectionIds,
        todaysQuestions: data.todaysQuestions || data.data?.todaysQuestions || [],
        currentIndex: 0,
        dailyLimit: data.stats?.dailyLimit || data.data?.stats?.dailyLimit || 0,
        rolledOverCount: data.stats?.rolledOverCount || data.data?.stats?.rolledOverCount || 0,
        reviewedToday: 0,
        trackBreakdown: data.stats?.trackBreakdown || null,
        isLoading: false
      }));

      // Reset hard questions when loading new session
      setHardQuestions([]);

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

  const rateQuestion = useCallback(async (rating) => {
    // Fix stale closure: use functional setState to access current values
    let ratedQuestionId = null;
    let ratedQuestion = null;
    
    // Get current question from state
    setState(prev => {
      const currentQuestion = prev.todaysQuestions[prev.currentIndex];
      if (!currentQuestion) {
        console.error('[SmartReview] No current question to rate');
        return { ...prev, isLoading: false };
      }
      
      ratedQuestionId = currentQuestion._id;
      ratedQuestion = currentQuestion;
      return { ...prev, isLoading: true };
    });

    if (!ratedQuestionId) {
      return;
    }

    try {
      console.log('[SmartReview] Rating question:', ratedQuestionId, 'with rating:', rating);

      // Make API call
      const response = await smartReviewService.recordRating(
        ratedQuestionId,
        rating
      );

      const result = response.data || response;
      console.log('[SmartReview] Rating result:', result);

      // Update history
      setRatingHistory(prev => [...prev, {
        questionId: ratedQuestionId,
        rating,
        question: ratedQuestion,
        timestamp: new Date()
      }]);

      // SPECIAL HANDLING FOR HARD RATING (1):
      // Don't remove from session, reinsert after 5 questions
      if (rating === 1 && result.isHard) {
        // Calculate where to reinsert (after 5 more questions from current position)
        setState(prev => {
          const insertPosition = prev.currentIndex + 5;
          
          // Reinsert hard question into the questions array at the calculated position
          const updatedQuestions = [...prev.todaysQuestions];
          // Only insert if position is within bounds
          if (insertPosition <= updatedQuestions.length) {
            updatedQuestions.splice(insertPosition, 0, ratedQuestion);
          } else {
            // If beyond array, just append
            updatedQuestions.push(ratedQuestion);
          }

          return {
            ...prev,
            todaysQuestions: updatedQuestions,
            reviewedToday: prev.reviewedToday + 1,
            currentIndex: prev.currentIndex + 1,
            isLoading: false
          };
        });

        // Track hard question for future reinsertions if rated hard again
        setHardQuestions(prev => [...prev, {
          question: ratedQuestion,
          questionId: ratedQuestionId,
          insertAfter: 5, // Will reinsert after 5 questions each time
          timesShown: 0
        }]);

        console.log('[SmartReview] Hard question will reappear after 5 questions.');
        return result;
      }

      // For ratings 2-5: Normal flow - remove from session
      // Also remove from hard questions if it was there
      if (rating >= 2) {
        setHardQuestions(prev => prev.filter(h => h.questionId !== ratedQuestionId));
      }

      setState(prev => ({
        ...prev,
        reviewedToday: prev.reviewedToday + 1,
        currentIndex: prev.currentIndex + 1,
        isLoading: false
      }));

      console.log('[SmartReview] Advanced to next question.');

      return result;
    } catch (error) {
      console.error('[SmartReview] Error rating question:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []); // No dependencies - uses functional setState

  const undoLastRating = useCallback(async () => {
    if (ratingHistory.length === 0) return;

    const lastAction = ratingHistory[ratingHistory.length - 1];

    try {
      await smartReviewService.resetQuestionPriority(lastAction.questionId);

      setRatingHistory(prev => prev.slice(0, -1));

      setState(prev => ({
        ...prev,
        reviewedToday: Math.max(0, prev.reviewedToday - 1),
        currentIndex: Math.max(0, prev.currentIndex - 1)
      }));

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
        error: null
      });

      setRatingHistory([]);
      setSectionProgress({});
      setHardQuestions([]); // Clear hard questions on session end

      console.log('[SmartReview] Session ended, unrated questions marked as pending');
      
      return { success: true };
    } catch (error) {
      console.error('[SmartReview] Error ending session:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [ratingHistory]);

  const currentQuestion = state.todaysQuestions[state.currentIndex];
  const isSessionComplete = state.todaysQuestions.length > 0 && state.currentIndex >= state.todaysQuestions.length;
  const progress = state.todaysQuestions.length > 0
    ? (state.currentIndex / state.todaysQuestions.length) * 100
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

    // Service helpers (optional)
    getPriorityInfo: smartReviewService.getPriorityInfo,
    getRatingInfo: smartReviewService.getRatingInfo,
    calculateProgress: smartReviewService.calculateProgress
  };

  return (
    <SmartReviewContext.Provider value={value}>
      {children}
    </SmartReviewContext.Provider>
  );
};