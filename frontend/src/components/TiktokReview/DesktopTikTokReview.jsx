import React, { useState, useEffect } from 'react';
import DesktopTikTokCard from './DesktopTikTokCard';
import VerticalRatingButtons from './VerticalRatingButtons';
import '../../css/TikTokReview.css';

const DesktopTikTokReview = ({ question, onRate, isLoading }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [doubleTapPosition, setDoubleTapPosition] = useState(null);

  // Reset answer visibility when question changes
  useEffect(() => {
    setShowAnswer(false);
  }, [question?._id]);

  const handleDoubleTap = (position) => {
    setShowAnswer(true);
    setDoubleTapPosition(position);
    setTimeout(() => setDoubleTapPosition(null), 1000);
  };

  const handleRating = async (rating) => {
    if (!question || !showAnswer) return;

    await onRate(rating);

    // Desktop: Manual scroll or auto based on setting
    const autoScroll = localStorage.getItem('tiktokAutoScroll') !== 'false';
    if (autoScroll) {
      setShowAnswer(false);
    }
  };

  // Desktop keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!showAnswer) return;

      if (e.key >= '1' && e.key <= '5') {
        handleRating(parseInt(e.key));
      }
      if (e.key === ' ') {
        setShowAnswer(!showAnswer);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showAnswer, question]);

  if (isLoading) {
    return (
      <div className="desktop-loading">
        <div className="spinner"></div>
        Loading next...
      </div>
    );
  }

  if (!question) {
    return null; // Handled by parent
  }

  return (
    <div className="desktop-tiktok-review">
      <div className="desktop-sidebar">
        {/* Optional: Section list, stats, controls */}
      </div>

      <div className="desktop-main">
        <div className="desktop-card-container">
          <DesktopTikTokCard
            question={question}
            showAnswer={showAnswer}
            onDoubleTap={handleDoubleTap}
            doubleTapPosition={doubleTapPosition}
          />
        </div>
      </div>

      <VerticalRatingButtons
        onRate={handleRating}
        disabled={!showAnswer || isLoading}
        isDesktop={true}
      />
    </div>
  );
};

export default DesktopTikTokReview;