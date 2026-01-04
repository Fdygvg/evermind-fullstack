// Enhanced FlashCard with Smart Review Rating Buttons
import React, { useState, useRef, useEffect } from 'react';
import { FaSync } from 'react-icons/fa';
import RatingButtons from '../SmartReview/RatingButtons';
import BookmarkButton from './BookmarkButton';
import '../css/flashCard.css';

const Flashcard = ({
  question,
  answer,
  questionId, // New prop
  isBookmarked, // New prop
  questionNumber,
  totalQuestions,
  onAnswer,
  isCode = false,
  CodeBlock,
  disabled = false,
  autoFlipDelay = null,
  showHint = true,
  compact = false,
  // Smart Review props
  useSmartReview = false,
  onRate,
  smartReviewMode = false
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAnswerButtons, setShowAnswerButtons] = useState(false);
  const flipTimeoutRef = useRef(null);
  const cardRef = useRef(null);

  // Reset card when new question comes
  useEffect(() => {
    setIsFlipped(false);
    setShowAnswerButtons(false);
    setIsAnimating(false);
  }, [question]);

  const handleFlip = () => {
    if (disabled || isAnimating) return;

    setIsAnimating(true);
    setIsFlipped(prev => !prev);

    // Show answer buttons after flip animation completes
    if (!isFlipped) {
      setTimeout(() => {
        setShowAnswerButtons(true);
        setIsAnimating(false);
      }, 300);
    } else {
      setShowAnswerButtons(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleAnswer = (isCorrect) => {
    if (disabled) return;
    onAnswer(isCorrect);
  };

  const handleSmartReviewRating = async (rating) => {
    if (disabled) return;
    if (onRate) {
      await onRate(rating);
    }
  };

  // Auto-flip feature (optional)
  useEffect(() => {
    if (autoFlipDelay && !isFlipped) {
      flipTimeoutRef.current = setTimeout(() => {
        handleFlip();
      }, autoFlipDelay);

      return () => {
        if (flipTimeoutRef.current) {
          clearTimeout(flipTimeoutRef.current);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFlipDelay, isFlipped]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (disabled) return;

      // Smart Review mode uses different keyboard shortcuts (1-5 for ratings)
      if (useSmartReview && showAnswerButtons) {
        if (e.key >= '1' && e.key <= '5') {
          e.preventDefault();
          handleSmartReviewRating(parseInt(e.key));
          return;
        }
      }

      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          handleFlip();
          break;
        case 'Escape':
          setIsFlipped(false);
          setShowAnswerButtons(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, showAnswerButtons, isFlipped, useSmartReview]);

  return (
    <div className={`flashcard-container ${compact ? 'compact' : ''}`} style={{ position: 'relative' }}>

      {/* The Card */}
      <div
        ref={cardRef}
        className={`flashcard ${isFlipped ? 'flipped' : ''} ${isAnimating ? 'animating' : ''}`}
        onClick={handleFlip}
        role="button"
        aria-label={isFlipped ? "Hide answer" : "Reveal answer"}
        tabIndex={0}
      >
        <div className="card-inner">
          {/* Front side (Question) */}
          <div className="card-front">
            {/* Bookmark Button (Front) */}
            {questionId && (
              <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
                <BookmarkButton
                  questionId={questionId}
                  initialIsBookmarked={isBookmarked}
                />
              </div>
            )}
            <div className="card-content">
              {isCode && CodeBlock ? (
                <CodeBlock text={question} forceCode={true} />
              ) : (
                <>
                  <h3 className="card-label">Question</h3>
                  <div className="question-text">{question}</div>
                </>
              )}
            </div>
          </div>

          {/* Back side (Answer) */}
          <div className="card-back">
            {/* Bookmark Button (Back) */}
            {questionId && (
              <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
                <BookmarkButton
                  questionId={questionId}
                  initialIsBookmarked={isBookmarked}
                />
              </div>
            )}
            <div className="card-content">
              {isCode && CodeBlock ? (
                <CodeBlock text={answer} forceCode={true} />
              ) : (
                <>
                  <h3 className="card-label">Answer</h3>
                  <div className="answer-text">{answer}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Smart Review Rating Buttons (Always visible in Smart Review Mode) */}
      {useSmartReview && (
        <div className="flashcard-smart-review">
          <RatingButtons
            onRate={handleSmartReviewRating}
            disabled={disabled}
            compact={true}
          />
        </div>
      )}

      {/* Flip button (Only show if NOT in Smart Review mode) */}
      {!useSmartReview && (
        <button
          className="flip-only-btn"
          onClick={handleFlip}
          disabled={disabled}
        >
          <FaSync size={18} />
          {isFlipped ? 'Hide Answer' : 'Reveal Answer'}
        </button>
      )}

    </div>
  );
};

export default Flashcard; 