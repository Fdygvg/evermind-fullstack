// C:\Users\USER\Desktop\EVERMIND FULLSTACK\frontend\src\components\SmartReview\RatingButtons.jsx
import React, { useState } from 'react';
import '../css/ratingButtons.css';
import CompactRatingBar from './CompactRatingBar';

const RatingButtons = ({ onRate, disabled = false, compact = false, useCompactBar = true, showLabels = false, isSimplified = false }) => {
  const [selectedRating, setSelectedRating] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Use new compact rating bar by default
  if (useCompactBar) {
    return <CompactRatingBar onRate={onRate} disabled={disabled} showLabels={showLabels} isSimplified={isSimplified} />;
  }

  const allRatings = [
    { value: 1, label: 'Hard', emoji: '😫', color: '#dc2626', interval: 'Today' },
    { value: 2, label: 'Medium', emoji: '😕', color: '#f59e0b', interval: '1 day' },
    { value: 3, label: 'Good', emoji: '😐', color: '#3b82f6', interval: '3 days' },
    { value: 4, label: 'Easy', emoji: '🙂', color: '#10b981', interval: '7 days' },
    { value: 5, label: 'Perfect', emoji: '😄', color: '#06b6d4', interval: '14 days' }
  ];

  const ratings = isSimplified
    ? allRatings.filter(r => r.value === 1 || r.value === 4)
    : allRatings;

  const handleRatingClick = async (rating) => {
    if (disabled || isAnimating) return;

    setSelectedRating(rating);
    setIsAnimating(true);

    try {
      // PROMISE will resolve immediately now, but we still handle it
      await onRate(rating);

      // Reset animation after completion
      // reduce this delay to make it feel snappier? 
      // Actually 300ms is just for the click animation, validation.
      setTimeout(() => {
        setSelectedRating(null);
        setIsAnimating(false);
      }, 300);
    } catch (error) {
      // Reset on error
      console.error('Error rating question:', error);
      setSelectedRating(null);
      setIsAnimating(false);
    }
  };

  if (compact) {
    return (
      <div className="rating-buttons-compact">
        {ratings.map((rating) => (
          <button
            key={rating.value}
            className={`rating-btn rating-${rating.value} ${selectedRating === rating.value ? 'selected' : ''
              } ${isAnimating ? 'animating' : ''}`}
            onClick={() => handleRatingClick(rating.value)}
            disabled={disabled || isAnimating}
            style={{ backgroundColor: rating.color }}
            title={`${rating.label} (${rating.interval})`}
          >
            <span className="rating-emoji">{rating.emoji}</span>
            <span className="rating-value">{rating.value}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="rating-buttons">
      <div className="rating-instruction">
        How well did you know this?
      </div>

      <div className="rating-grid">
        {ratings.map((rating) => (
          <button
            key={rating.value}
            className={`rating-card rating-${rating.value} ${selectedRating === rating.value ? 'selected' : ''
              } ${isAnimating ? 'animating' : ''}`}
            onClick={() => handleRatingClick(rating.value)}
            disabled={disabled || isAnimating}
            style={{
              '--rating-color': rating.color,
              borderColor: rating.color
            }}
          >
            <div className="rating-header">
              <span className="rating-emoji">{rating.emoji}</span>
              <span className="rating-value">{rating.value}</span>
            </div>

            <div className="rating-label">{rating.label}</div>
            <div className="rating-interval">{rating.interval}</div>

            {selectedRating === rating.value && (
              <div className="rating-selected-indicator">
                ✓
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="rating-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
          <span>Hard - Review today</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
          <span>Perfect - Review in 2 weeks</span>
        </div>
      </div>
    </div>
  );
};

export default RatingButtons;