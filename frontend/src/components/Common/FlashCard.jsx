// Enhanced FlashCard with Smart Review Rating Buttons
import React, { useState, useRef, useEffect } from 'react';
import { FaSync, FaQuestionCircle } from 'react-icons/fa';
import RatingButtons from '../SmartReview/RatingButtons';
import '../css/flashCard.css';

const Flashcard = ({
  question,
  answer,
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
    <div className={`flashcard-container ${compact ? 'compact' : ''}`}>
      {/* Card number indicator */}
      {!compact && (
        <div className="card-counter">
          Card {questionNumber} of {totalQuestions}
        </div>
      )}

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
            <div className="card-content">
              {isCode && CodeBlock ? (
                <CodeBlock text={question} forceCode={true} />
              ) : (
                <>
                  <h3 className="card-label">Question</h3>
                  <div className="question-text">{question}</div>
                </>
              )}

              {showHint && !isFlipped && (
                <div className="flip-hint">
                  <FaQuestionCircle size={20} />
                  <span>Click or press SPACE to reveal answer</span>
                </div>
              )}
            </div>
          </div>

          {/* Back side (Answer) */}
          <div className="card-back">
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

      {/* Smart Review Rating Buttons (only show when flipped) */}
      {useSmartReview && showAnswerButtons && (
        <div className="flashcard-smart-review">
          <RatingButtons
            onRate={handleSmartReviewRating}
            disabled={disabled}
            compact={true}
          />
        </div>
      )}

      {/* Flip button (show when not flipped or in non-smart-review mode) */}
      {!showAnswerButtons && (
        <button
          className="flip-only-btn"
          onClick={handleFlip}
          disabled={disabled}
        >
          <FaSync size={18} />
          {isFlipped ? 'Hide Answer' : 'Reveal Answer'}
        </button>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="keyboard-hints">
        <div className="shortcut">
          <kbd>SPACE</kbd>
          <span>Flip card</span>
        </div>
        {isFlipped && useSmartReview && (
          <div className="shortcut">
            <kbd>1-5</kbd>
            <span>Rate (1=Hard, 5=Perfect)</span>
          </div>
        )}
        <div className="shortcut">
          <kbd>ESC</kbd>
          <span>Reset</span>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;