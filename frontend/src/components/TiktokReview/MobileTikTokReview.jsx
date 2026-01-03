import React, { useState, useEffect } from 'react';
import MobileTikTokCard from './MobileTikTokCard';
import VerticalRatingButtons from './VerticalRatingButtons';
import '../../css/TikTokReview.css';

const MobileTikTokReview = ({ question, onRate, isLoading }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [doubleTapPosition, setDoubleTapPosition] = useState(null);

  // Reset answer when question changes
  useEffect(() => {
    setShowAnswer(false);
  }, [question?._id]);

  const handleDoubleTap = (position) => {
    setShowAnswer(true);
    setDoubleTapPosition(position);
    // Reset position after animation
    setTimeout(() => setDoubleTapPosition(null), 1000);
  };

  const handleRating = async (rating) => {
    if (!question || !showAnswer) return;

    await onRate(rating);

    // Auto-scroll mode: Move to next question
    const autoScroll = localStorage.getItem('tiktokAutoScroll') !== 'false';
    if (autoScroll) {
      setShowAnswer(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        Loading next...
      </div>
    );
  }

  if (!question) {
    return null; // Handled by parent wrapper
  }

  return (
    <div className="mobile-tiktok-review">
      <MobileTikTokCard
        question={question}
        showAnswer={showAnswer}
        onDoubleTap={handleDoubleTap}
        doubleTapPosition={doubleTapPosition}
      />

      <VerticalRatingButtons
        onRate={handleRating}
        disabled={!showAnswer || isLoading}
      />
    </div>
  );
};

export default MobileTikTokReview;