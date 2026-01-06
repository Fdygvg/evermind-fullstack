import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSmartReview } from '../../hooks/useSmartReview';
import { sessionService } from '../../services/sessions';
import DailyProgress from './DailyProgress';
import SessionControls from './SessionControls';
import { FabSpeedDial, TimerProvider, TimerDisplay, useTimer } from '../action-button';
import '../css/smartReviewWrapper.css';
import SwipeZoneContainer from './SwipeZoneContainer';


// Command Center Configuration map per mode
const COMMAND_CENTER_MODES = {
  default: {
    isOpen: false,
    autoLaunchWidgets: [],
  },
  elimination: {
    isOpen: true,
    autoLaunchWidgets: ['timer'],
  },
  flashcard: {
    isOpen: false,
    autoLaunchWidgets: [],
  },
  normal: {
    isOpen: false,
    autoLaunchWidgets: [],
  }
};

/**
 * Inner component that has access to timer context
 */
const SmartReviewContent = ({
  children,
  smartReview,
  showDailyCounter,
  mode,
  cardMode,
  SwipeZoneContainer, // Received prop
  onSwipeRate         // Received prop
}) => {


  const timer = useTimer();
  const navigate = useNavigate();

  // Keep track of latest smartReview state for auto-save
  const smartReviewRef = useRef(smartReview);
  useEffect(() => {
    smartReviewRef.current = smartReview;
  }, [smartReview]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      const current = smartReviewRef.current;

      // Don't save if session complete or empty
      if (current.isSessionComplete || !current.todaysQuestions?.length) return;

      // Only save if initialized
      if (current.initialQuestionCount > 0) {
        try {
          await sessionService.updateProgress({
            currentIndex: current.currentIndex,
            reviewedToday: current.reviewedToday,
            smartReviewState: {
              ...current, // Spreads current context state
              mode: mode || 'normal',
              cardMode: cardMode || 'normal'
            },
            status: 'active'
          });
          console.log('[SmartReviewWrapper] Auto-saved progress');
        } catch (error) {
          console.error('[SmartReviewWrapper] Auto-save failed:', error);
        }
      }
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [mode, cardMode]);

  // Update timer with current question when it changes (for single-question modes)
  useEffect(() => {
    if (smartReview.currentQuestion?._id) {
      timer.setCurrentQuestion(smartReview.currentQuestion._id);
    }
  }, [smartReview.currentQuestion?._id, timer]);

  // Calculate derived stats
  const stats = useMemo(() => {
    const history = smartReview.ratingHistory || [];
    const correctCount = history.filter(r => r.rating > 1).length;
    const wrongCount = history.filter(r => r.rating === 1).length;

    let currentStreak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].rating > 1) currentStreak++;
      else break;
    }

    return { correctCount, wrongCount, currentStreak };
  }, [smartReview.ratingHistory]);

  // Wrap rateQuestion to notify timer of manual ratings
  const handleRateQuestion = useCallback(async (rating, questionId) => {
    const qId = questionId || smartReview.currentQuestion?._id;

    // Notify timer of manual rating (this resets/advances timer)
    if (timer.isTimerActive) {
      timer.notifyManualRating(qId, rating);
    }

    // Call the actual rate function
    return smartReview.rateQuestion(rating, questionId);
  }, [smartReview, timer]);

  // Handle pause: save progress and navigate to dashboard
  const handlePause = useCallback(async () => {
    try {
      await smartReview.pauseSession(mode, cardMode);

      // Stop timer if running
      if (timer.isTimerActive) {
        timer.stopTimer();
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('[SmartReviewWrapper] Failed to pause session:', error);
    }
  }, [smartReview, mode, cardMode, timer, navigate]);

  // Handle end session: confirm, end, navigate to results
  const handleEndSession = useCallback(async () => {
    if (!window.confirm('Are you sure you want to end this session?')) {
      return;
    }

    try {
      // Stop timer if running
      if (timer.isTimerActive) {
        timer.stopTimer();
      }

      // Calculate stats from rating history for results page
      const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      (smartReview.ratingHistory || []).forEach(r => {
        if (ratingBreakdown[r.rating] !== undefined) {
          ratingBreakdown[r.rating]++;
        }
      });

      await smartReview.endSession();

      navigate('/session/results', {
        state: {
          mode: 'smart-review',
          ratingBreakdown,
          totalQuestions: smartReview.initialQuestionCount || smartReview.reviewedToday,
          reviewedCount: smartReview.reviewedToday,
          cardMode: cardMode,
          fromSession: true
        }
      });
    } catch (error) {
      console.error('[SmartReviewWrapper] Failed to end session:', error);
    }
  }, [smartReview, timer, navigate, cardMode]);

  // Handle undo
  const handleUndo = useCallback(async () => {
    try {
      await smartReview.undoLastRating();
    } catch (error) {
      console.error('[SmartReviewWrapper] Failed to undo rating:', error);
    }
  }, [smartReview]);

  return (
    <div className="smart-review-wrapper">


      {/* Timer Display - shown when timer is active */}
      {timer.showTimerDisplay && timer.isTimerActive && (
        <TimerDisplay
          duration={timer.timerConfig?.duration || 30}
          timeLeft={timer.timeLeft}
          isRunning={timer.isTimerRunning}
          onToggle={() => timer.isTimerRunning ? timer.pauseTimer() : timer.resumeTimer()}
          onStop={() => timer.stopTimer()}
          position="top-right"
        />
      )}

      {/* Daily Progress Counter */}
      {showDailyCounter && smartReview.todaysQuestions.length > 0 && (
        <DailyProgress
          current={smartReview.reviewedToday}
          total={smartReview.initialQuestionCount || smartReview.todaysQuestions.length}
          showProgressBar={true}
          trackBreakdown={smartReview.trackBreakdown}
          currentStreak={stats.currentStreak}
          correctCount={stats.correctCount}
          wrongCount={stats.wrongCount}
        />
      )}

      {/* Session Controls - Undo, Pause, End */}
      <SessionControls
        canUndo={smartReview.canUndo}
        onUndo={handleUndo}
        onPause={handlePause}
        onEnd={handleEndSession}
        isLoading={smartReview.isLoading}
      />

      {/* Render children with Smart Review props */}
      {children({
        // Current state
        currentQuestion: smartReview.currentQuestion,
        todaysQuestions: smartReview.todaysQuestions,
        isSessionComplete: smartReview.isSessionComplete,
        progress: smartReview.progress,
        isLoading: smartReview.isLoading,
        error: smartReview.error,

        // Actions - using wrapped rateQuestion that notifies timer
        rateQuestion: handleRateQuestion,
        undoLastRating: smartReview.undoLastRating,
        canUndo: smartReview.canUndo,

        // Statistics
        reviewedToday: smartReview.reviewedToday,
        dailyLimit: smartReview.dailyLimit,
        rolledOverCount: smartReview.rolledOverCount,
        sectionProgress: smartReview.sectionProgress,
        ratingHistory: smartReview.ratingHistory,
        initialQuestionCount: smartReview.initialQuestionCount,

        // Helpers
        getPriorityInfo: smartReview.getPriorityInfo,
        getRatingInfo: smartReview.getRatingInfo,

        // Components & Handlers for external wrapping
        SwipeZoneContainer: SwipeZoneContainer,
        onSwipeRate: onSwipeRate
      })}

  
      {/* Action Button (FAB) */}
      <FabSpeedDial
        mode={mode}
        currentQuestionId={smartReview.currentQuestion?._id}
        questionText={smartReview.currentQuestion?.question}
      />

      {/* Error Display */}
      {smartReview.error && (
        <div className="smart-review-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{smartReview.error}</span>
        </div>
      )}
    </div>
  );
};


const SmartReviewWrapper = ({
  children,
  sectionIds,
  enableSmartReview = true,
  showDailyCounter = true,
  showAddMore = true,
  mode = 'default',
  cardMode = 'normal',
  resumeData = null // New prop for resuming session
}) => {
  const smartReview = useSmartReview();

  // Load questions when sectionIds change
  // Load questions when sectionIds change OR resume if data present
  useEffect(() => {
    if (!enableSmartReview) return;

    if (resumeData) {
      console.log('[SmartReviewWrapper] RESUMING SESSION with data:', resumeData);
      smartReview.resumeSessionState(resumeData);
    } else if (sectionIds?.length > 0) {
      console.log('[SmartReviewWrapper] STARTING NEW SESSION for sections:', sectionIds);
      smartReview.loadTodaysQuestions(sectionIds);
    }
  }, [sectionIds, enableSmartReview, resumeData]); // Added resumeData dependency

  // If Smart Review is disabled, just render children without wrapper
  if (!enableSmartReview) {
    return <>{children({})}</>;
  }

  // Callbacks for TimerProvider
  const getCurrentQuestionId = useCallback(() => {
    return smartReview.currentQuestion?._id || null;
  }, [smartReview.currentQuestion]);

  const getQuestionList = useCallback(() => {
    // For elimination mode: return list with isRated status
    return (smartReview.todaysQuestions || []).map(q => ({
      _id: q._id,
      isRated: false // SmartReview removes rated questions, so all visible ones are unrated
    }));
  }, [smartReview.todaysQuestions]);

  const handleAutoRate = useCallback(async (rating, questionId) => {
    console.log(`[SmartReviewWrapper] Auto-rating question ${questionId} with ${rating}`);
    return smartReview.rateQuestion(rating, questionId);
  }, [smartReview]);

  // Handle rating from SwipeZone
  const handleSwipeRate = useCallback(async (rating) => {
    console.log(`[SmartReviewWrapper] Swipe Rate triggered: ${rating}`);
    return smartReview.rateQuestion(rating);
  }, [smartReview]);

  // Determine if swipe should be enabled
  const enableSwipe = cardMode !== 'tiktok';

  return (
    <TimerProvider
      mode={mode}
      onRateQuestion={handleAutoRate}
      getCurrentQuestionId={getCurrentQuestionId}
      getQuestionList={getQuestionList}
    >
      <SmartReviewContent
        children={children}
        smartReview={smartReview}
        showDailyCounter={showDailyCounter}
        showAddMore={showAddMore}
        mode={mode}
        cardMode={cardMode}
        SwipeZoneContainer={enableSwipe ? SwipeZoneContainer : null}
        onSwipeRate={handleSwipeRate}
      />
    </TimerProvider>
  );
};

export default SmartReviewWrapper;
