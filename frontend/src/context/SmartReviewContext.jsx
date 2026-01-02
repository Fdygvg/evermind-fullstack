// frontend/src/context/SmartReviewContext.jsx
import React, { useState, useCallback, useRef } from 'react';
import SmartReviewContextInstance from './SmartReviewContextInstance';
import { smartReviewService } from '../services/smartReviewService';
import { sessionService } from '../services/sessions';

export const SmartReviewContext = SmartReviewContextInstance;

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
    initialQuestionCount: 0
  });

  const [ratingHistory, setRatingHistory] = useState([]);
  const [sectionProgress, setSectionProgress] = useState({});
  const isRatingInProgressRef = useRef(false);


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
      const questions = data.todaysQuestions || data.data?.todaysQuestions || [];
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
    // Prevent concurrent calls
    if (isRatingInProgressRef.current) {
      console.log('[SmartReview] Rating already in progress, ignoring duplicate call');
      return;
    }

    isRatingInProgressRef.current = true;

    // Fix stale closure: use functional setState to access current values
    let ratedQuestionId = null;
    let ratedQuestion = null;
    let questionIndex = -1;
    
    // Get question from state (either by ID for Elimination Mode, or by currentIndex)
    setState(prev => {
      if (questionId) {
        // Elimination Mode: Find question by ID
        questionIndex = prev.todaysQuestions.findIndex(q => q._id === questionId);
        if (questionIndex === -1) {
          console.error('[SmartReview] Question not found:', questionId);
          return { ...prev, isLoading: false };
        }
        ratedQuestion = prev.todaysQuestions[questionIndex];
      } else {
        // Normal Mode: Use current index
        questionIndex = prev.currentIndex;
        ratedQuestion = prev.todaysQuestions[prev.currentIndex];
        if (!ratedQuestion) {
          console.error('[SmartReview] No current question to rate');
          return { ...prev, isLoading: false };
        }
      }
      
      ratedQuestionId = ratedQuestion._id;
      return { ...prev, isLoading: true };
    });

    if (!ratedQuestionId) {
      isRatingInProgressRef.current = false;
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

      // Update history and capture updated value
      let updatedRatingHistory;
      setRatingHistory(prev => {
        updatedRatingHistory = [...prev, {
          questionId: ratedQuestionId,
          rating,
          question: ratedQuestion,
          timestamp: new Date()
        }];
        return updatedRatingHistory;
      });

      // SPECIAL HANDLING FOR HARD RATING (1):
      // Don't remove from session, reinsert after 5 questions
      if (rating === 1 && result.isHard) {
        // Calculate where to reinsert (after 5 more questions from current position)
        let hardQuestionState;
        setState(prev => {
          const currentPos = questionId ? questionIndex : prev.currentIndex;
          const insertPosition = currentPos + 5;
          
          // Reinsert hard question into the questions array at the calculated position
          const updatedQuestions = [...prev.todaysQuestions];
          // Only insert if position is within bounds
          if (insertPosition <= updatedQuestions.length) {
            updatedQuestions.splice(insertPosition, 0, ratedQuestion);
          } else {
            // If beyond array, just append
            updatedQuestions.push(ratedQuestion);
          }

          // For elimination mode (questionId provided), remove the question from its current position
          if (questionId) {
            updatedQuestions.splice(questionIndex, 1);
          }

          hardQuestionState = {
            ...prev,
            todaysQuestions: updatedQuestions,
            reviewedToday: prev.reviewedToday + 1,
            currentIndex: questionId ? prev.currentIndex : prev.currentIndex + 1,
            isLoading: false
          };
          return hardQuestionState;
        });

        // Auto-save progress for hard question
        if (hardQuestionState && updatedRatingHistory) {
          try {
            const smartReviewState = {
              currentIndex: hardQuestionState.currentIndex,
              reviewedToday: hardQuestionState.reviewedToday,
              todaysQuestions: hardQuestionState.todaysQuestions.map(q => q._id),
              ratingHistory: updatedRatingHistory.map(r => ({ questionId: r.questionId, rating: r.rating })),
              sectionIds: hardQuestionState.sectionIds,
              initialQuestionCount: hardQuestionState.initialQuestionCount
            };
            
            sessionService.updateProgress({
              sectionIds: hardQuestionState.sectionIds,
              currentIndex: hardQuestionState.currentIndex,
              answeredQuestionIds: updatedRatingHistory.map(r => r.questionId),
              status: 'active',
              smartReviewState: smartReviewState
            }).catch(err => {
              console.error('[SmartReview] Failed to save progress:', err);
            });
          } catch (saveError) {
            console.error('[SmartReview] Error saving progress:', saveError);
          }
        }

        console.log('[SmartReview] Hard question will reappear after 5 questions.');
        return result;
      }

      // For ratings 2-5: Normal flow - remove from session
      let updatedState;
      setState(prev => {
        // For elimination mode (questionId provided), remove the question from array
        if (questionId) {
          const updatedQuestions = [...prev.todaysQuestions];
          updatedQuestions.splice(questionIndex, 1);
          
          updatedState = {
            ...prev,
            todaysQuestions: updatedQuestions,
            reviewedToday: prev.reviewedToday + 1,
            // Keep currentIndex same in elimination mode (questions removed from array)
            isLoading: false
          };
          return updatedState;
        }
        
        // Normal mode: just increment index
        updatedState = {
          ...prev,
          reviewedToday: prev.reviewedToday + 1,
          currentIndex: prev.currentIndex + 1,
          isLoading: false
        };
        return updatedState;
      });

      console.log('[SmartReview] Advanced to next question.');

      // Auto-save Smart Review progress to session (using captured values, not stale closures)
      if (updatedState && updatedRatingHistory) {
        try {
          const smartReviewState = {
            currentIndex: updatedState.currentIndex,
            reviewedToday: updatedState.reviewedToday,
            todaysQuestions: updatedState.todaysQuestions.map(q => q._id),
            ratingHistory: updatedRatingHistory.map(r => ({ questionId: r.questionId, rating: r.rating })),
            sectionIds: updatedState.sectionIds,
            initialQuestionCount: updatedState.initialQuestionCount
          };
          
          sessionService.updateProgress({
            sectionIds: updatedState.sectionIds,
            currentIndex: updatedState.currentIndex,
            answeredQuestionIds: updatedRatingHistory.map(r => r.questionId),
            status: 'active',
            smartReviewState: smartReviewState
          }).catch(err => {
            console.error('[SmartReview] Failed to save progress:', err);
          });
        } catch (saveError) {
          console.error('[SmartReview] Error saving progress:', saveError);
        }
      }

      return result;
    } catch (error) {
      console.error('[SmartReview] Error rating question:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    } finally {
      // Always reset the flag, even if there's an error
      isRatingInProgressRef.current = false;
    }
  }, []); // Removed ratingHistory dependency to avoid stale closures - using captured values instead

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

  const currentQuestion = state.todaysQuestions[state.currentIndex];
  const isSessionComplete = state.todaysQuestions.length > 0 && state.currentIndex >= state.todaysQuestions.length;
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