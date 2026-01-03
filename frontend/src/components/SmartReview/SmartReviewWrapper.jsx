// frontend/src/components/SmartReview/SmartReviewWrapper.jsx
import React, { useEffect } from 'react';
import { useSmartReview } from '../../hooks/useSmartReview';
import DailyCounter from './DailyCounter';
import AddMoreButton from './AddMoreButton';
import '../css/smartReviewWrapper.css';

const SmartReviewWrapper = ({
  children,
  sectionIds,
  enableSmartReview = true,
  showDailyCounter = true,
  showAddMore = true
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

  return (
    <div className="smart-review-wrapper">
      {/* Daily Progress Counter */}
      {showDailyCounter && smartReview.todaysQuestions.length > 0 && (
        <DailyCounter
          current={smartReview.reviewedToday}
          total={smartReview.initialQuestionCount || smartReview.todaysQuestions.length}
          showProgressBar={true}
          trackBreakdown={smartReview.trackBreakdown}
        />
      )}

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

export default SmartReviewWrapper;
