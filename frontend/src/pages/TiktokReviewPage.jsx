import React, { useState, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import MobileTikTokReview from '../components/TiktokReview/MobileTikTokReview';
import DesktopTikTokReview from '../components/TiktokReview/DesktopTikTokReview';
import SmartReviewWrapper from '../components/SmartReview/SmartReviewWrapper';
import '../css/tiktokReviewPage.css';

const TikTokReviewContent = ({
  smartReviewData,
  navigate
}) => {
  const {
    currentQuestion,
    rateQuestion,
    isLoading,
    isSessionComplete,
    canUndo,
    undoLastRating,
    ratingHistory,
    reviewedToday,
    initialQuestionCount
  } = smartReviewData;

  useEffect(() => {
    if (isSessionComplete) {
      // Calculate stats from rating history
      const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      (ratingHistory || []).forEach(r => {
        if (ratingBreakdown[r.rating] !== undefined) {
          ratingBreakdown[r.rating]++;
        }
      });

      // Navigate to results page with stats
      navigate("/session/results", {
        state: {
          mode: 'tiktok-review',
          ratingBreakdown,
          totalQuestions: initialQuestionCount || reviewedToday,
          reviewedCount: reviewedToday,
          cardMode: 'tiktok',
          fromSession: true
        }
      });
    }
  }, [isSessionComplete, navigate, ratingHistory, initialQuestionCount, reviewedToday]);

  if (isSessionComplete) {
    return null;
  }

  if (!currentQuestion && !isLoading) {
    return (
      <div className="no-questions">
        <p>No questions available for review.</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="tiktok-review-page">
      <header className="page-header tiktok-header">
        <div className="header-left">
          <button
            className="nav-btn"
            onClick={() => navigate("/dashboard")}
            title="Back to Dashboard"
          >
            <Home size={20} />
          </button>
          <h1>TikTok Review</h1>
        </div>
        <div className="header-right">
          {canUndo && (
            <button className="undo-btn" onClick={undoLastRating}>
              ↶ Undo
            </button>
          )}
        </div>
      </header>

      {isMobile ? (
        <MobileTikTokReview
          question={currentQuestion}
          onRate={rateQuestion}
          isLoading={isLoading}
        />
      ) : (
        <DesktopTikTokReview
          question={currentQuestion}
          onRate={rateQuestion}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

const TikTokReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sectionIds, setSectionIds] = useState(location.state?.sectionIds || []);

  useEffect(() => {
    // If no sections in state, try local storage (fallback) or defined default
    if (sectionIds.length === 0) {
      const stored = JSON.parse(localStorage.getItem('selectedSections') || '[]');
      if (stored.length > 0) {
        setSectionIds(stored);
      }
    }
  }, []);

  return (
    <SmartReviewWrapper
      sectionIds={sectionIds}
      enableSmartReview={true}
      showDailyCounter={true}
      showAddMore={true}
      mode="default" // Use default for now, can be 'tiktok' if we add specific config
    >
      {(smartReviewData) => (
        <TikTokReviewContent
          smartReviewData={smartReviewData}
          navigate={navigate}
        />
      )}
    </SmartReviewWrapper>
  );
};

export default TikTokReviewPage;