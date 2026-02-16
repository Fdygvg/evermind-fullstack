import React, { useState, useEffect, useRef } from 'react';
import '../css/compactRatingBar.css';

const CompactRatingBar = ({ onRate, disabled = false, showLabels = false, isSimplified = false }) => {
  const [selectedRating, setSelectedRating] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const allRatings = [
    {
      value: 1,
      label: 'Hard',
      color: '#dc2626',
      ariaLabel: 'Rate: Hard (1) - Review today'
    },
    {
      value: 2,
      label: 'Medium',
      color: '#f59e0b',
      ariaLabel: 'Rate: Medium (2) - Review in 1 day'
    },
    {
      value: 3,
      label: 'Good',
      color: '#3b82f6',
      ariaLabel: 'Rate: Good (3) - Review in 3 days'
    },
    {
      value: 4,
      label: 'Easy',
      color: '#10b981',
      ariaLabel: 'Rate: Easy (4) - Review in 7 days'
    },
    {
      value: 5,
      label: 'Very Easy',
      color: '#06b6d4',
      ariaLabel: 'Rate: Very Easy (5) - Review in 14 days'
    }
  ];

  const ratings = isSimplified
    ? allRatings.filter(r => r.value === 1 || r.value === 4)
    : allRatings;

  const handleRatingClick = async (rating) => {
    if (disabled || isAnimating) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setSelectedRating(rating);
    setIsAnimating(true);

    try {
      await onRate(rating);

      // Reset animation after completion, only if component is still mounted
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setSelectedRating(null);
          setIsAnimating(false);
        }
        timeoutRef.current = null;
      }, 300);
    } catch (error) {
      console.error('Error rating question:', error);
      // Reset immediately on error
      if (isMountedRef.current) {
        setSelectedRating(null);
        setIsAnimating(false);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  return (
    <div className="compact-rating-bar-container">
      {showLabels && (
        <div className="rating-bar-instruction">
          How well did you know this?
        </div>
      )}

      <div
        className="compact-rating-bar"
        role="radiogroup"
        aria-label="Question difficulty rating"
      >
        {ratings.map((rating) => (
          <button
            key={rating.value}
            className={`rating-number-btn rating-${rating.value} ${selectedRating === rating.value ? 'selected' : ''
              } ${isAnimating && selectedRating === rating.value ? 'animating' : ''}`}
            onClick={() => handleRatingClick(rating.value)}
            disabled={disabled || isAnimating}
            style={{
              '--rating-color': rating.color,
              backgroundColor: rating.color
            }}
            aria-label={rating.ariaLabel}
            role="radio"
            aria-checked={selectedRating === rating.value}
            tabIndex={disabled ? -1 : 0}
            title={rating.ariaLabel}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleRatingClick(rating.value);
              }
            }}
          >
            <span className="rating-number">{rating.value}</span>
            {selectedRating === rating.value && (
              <span className="rating-checkmark">✓</span>
            )}
          </button>
        ))}
      </div>

      {showLabels && (
        <div className="rating-bar-hints">
          <span className="hint-text">1 = Hard</span>
          <span className="hint-separator">•</span>
          <span className="hint-text">5 = Very Easy</span>
        </div>
      )}
    </div>
  );
};

export default CompactRatingBar;

