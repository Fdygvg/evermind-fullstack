import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import '../../css/VerticalRatingButtons.css';

/**
 * VerticalRatingButtons - TikTok-style vertical rating buttons
 * Uses the same rating logic as CompactRatingBar but with vertical TikTok-style UI
 */
const VerticalRatingButtons = ({ onRate, disabled, isDesktop = false }) => {
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

  // Rating definitions matching CompactRatingBar exactly
  const ratings = [
    {
      value: 1,
      icon: '😰',
      label: 'Hard',
      color: '#dc2626',
      ariaLabel: 'Rate: Hard (1) - Review today'
    },
    {
      value: 2,
      icon: '😕',
      label: 'Medium',
      color: '#f59e0b',
      ariaLabel: 'Rate: Medium (2) - Review in 1 day'
    },
    {
      value: 3,
      icon: '😊',
      label: 'Good',
      color: '#3b82f6',
      ariaLabel: 'Rate: Good (3) - Review in 3 days'
    },
    {
      value: 4,
      icon: '😄',
      label: 'Easy',
      color: '#10b981',
      ariaLabel: 'Rate: Easy (4) - Review in 7 days'
    },
    {
      value: 5,
      icon: '🤩',
      label: 'Perfect',
      color: '#06b6d4',
      ariaLabel: 'Rate: Very Easy (5) - Review in 14 days'
    }
  ];

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

      // Reset animation after completion
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setSelectedRating(null);
          setIsAnimating(false);
        }
        timeoutRef.current = null;
      }, 300);
    } catch (error) {
      console.error('Error rating question:', error);
      if (isMountedRef.current) {
        setSelectedRating(null);
        setIsAnimating(false);
      }
    }
  };

  return (
    <div
      className={`vertical-rating-buttons ${isDesktop ? 'desktop' : ''}`}
      role="radiogroup"
      aria-label="Question difficulty rating"
    >
      {ratings.map((rating) => (
        <motion.button
          key={rating.value}
          className={`rating-icon rating-${rating.value} ${selectedRating === rating.value ? 'selected' : ''
            }`}
          onClick={() => handleRatingClick(rating.value)}
          disabled={disabled || isAnimating}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          style={{ '--btn-color': rating.color }}
          aria-label={rating.ariaLabel}
          role="radio"
          aria-checked={selectedRating === rating.value}
          tabIndex={disabled ? -1 : 0}
          title={rating.ariaLabel}
        >
          <span className="icon">{rating.icon}</span>
          {selectedRating === rating.value && (
            <motion.span
              className="label"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {rating.label}
            </motion.span>
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default VerticalRatingButtons;