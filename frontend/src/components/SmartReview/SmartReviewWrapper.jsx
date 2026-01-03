// frontend/src/components/SmartReview/SmartReviewWrapper.jsx
import React, { useEffect } from 'react';
import { useSmartReview } from '../../hooks/useSmartReview';
import DailyProgress from './DailyProgress';
import AddMoreButton from './AddMoreButton';
import { FabSpeedDial, TimerProvider } from '../action-button';
import '../css/smartReviewWrapper.css';

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
    autoLaunchWidgets: [], // Flashcard might have its own internal timer
  },
  normal: {
    isOpen: false,
    autoLaunchWidgets: [], // User can open manually if desired
  }
};

const SmartReviewWrapper = ({
  children,
  sectionIds,
  enableSmartReview = true,
  showDailyCounter = true,
  showAddMore = true,
  mode = 'default' // 'default', 'elimination', 'flashcard', 'normal'
}) => {
  const smartReview = useSmartReview();

  // Load questions when sectionIds change
  useEffect(() => {
    if (enableSmartReview && sectionIds?.length > 0) {
      smartReview.loadTodaysQuestions(sectionIds);
    }
  }, [sectionIds, enableSmartReview]);

  // If Smart Review is disabled, just render children without wrapper
  if (!enableSmartReview) {
    return <>{children({})}</>;
  }

  // Get command center config for current mode
  const commandCenterConfig = COMMAND_CENTER_MODES[mode] || COMMAND_CENTER_MODES.default;

  return (
    <TimerProvider mode={mode}>
      <div className="smart-review-wrapper">
        {/* Daily Progress Counter */}
        {showDailyCounter && smartReview.todaysQuestions.length > 0 && (() => {
          // Calculate derived stats from rating history
          const history = smartReview.ratingHistory || [];
          const correctCount = history.filter(r => r.rating > 1).length;
          const wrongCount = history.filter(r => r.rating === 1).length;

          // Calculate current streak (consecutive correct answers from end)
          let currentStreak = 0;
          for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].rating > 1) currentStreak++;
            else break;
          }

          return (
            <DailyProgress
              current={smartReview.reviewedToday}
              total={smartReview.initialQuestionCount || smartReview.todaysQuestions.length}
              showProgressBar={true}
              trackBreakdown={smartReview.trackBreakdown}
              // Stats
              currentStreak={currentStreak}
              correctCount={correctCount}
              wrongCount={wrongCount}
            // Timer handled internally by DailyProgress (for now)
            />
          );
        })()}

        {/* Render children with Smart Review props */}
        {children({
          // Current state
          currentQuestion: smartReview.currentQuestion,
          todaysQuestions: smartReview.todaysQuestions, // Added for Elimination Mode
          isSessionComplete: smartReview.isSessionComplete,
          progress: smartReview.progress,
          isLoading: smartReview.isLoading,
          error: smartReview.error,

          // Actions
          rateQuestion: smartReview.rateQuestion,
          undoLastRating: smartReview.undoLastRating,
          canUndo: smartReview.canUndo,

          // Statistics
          reviewedToday: smartReview.reviewedToday,
          dailyLimit: smartReview.dailyLimit,
          rolledOverCount: smartReview.rolledOverCount,
          sectionProgress: smartReview.sectionProgress,
          ratingHistory: smartReview.ratingHistory, // Added for session results
          initialQuestionCount: smartReview.initialQuestionCount, // Total questions count

          // Helpers
          getPriorityInfo: smartReview.getPriorityInfo,
          getRatingInfo: smartReview.getRatingInfo
        })}

        {/* Add More Questions Button */}
        {showAddMore && smartReview.rolledOverCount > 0 && (
          <AddMoreButton
            rolledOverCount={smartReview.rolledOverCount}
            onAddMore={smartReview.addMoreQuestions}
            disabled={smartReview.isLoading}
          />
        )}

        {/* Action Button (FAB) */}
        <FabSpeedDial mode={mode} />

        {/* Error Display */}
        {smartReview.error && (
          <div className="smart-review-error">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{smartReview.error}</span>
          </div>
        )}
      </div>
    </TimerProvider>
  );
};

export default SmartReviewWrapper;
