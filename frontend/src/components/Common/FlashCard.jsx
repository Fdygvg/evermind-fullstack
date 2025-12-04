// components/Common/FlashCard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FaSync, FaQuestionCircle, FaCheck, FaTimes } from 'react-icons/fa';
import './css/flashCard.css';

const Flashcard = ({
  question,
  answer,
  questionNumber,
  totalQuestions,
  onAnswer,
  isCode = false,
  CodeBlock, // Optional: if you want to render code
  disabled = false,
  autoFlipDelay = null, // Optional: auto-flip after X ms
  showHint = true,
  compact = false
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
      
      switch(e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          handleFlip();
          break;
        case 'ArrowLeft':
        case '1':
          if (showAnswerButtons) handleAnswer(false);
          break;
        case 'ArrowRight':
        case '2':
          if (showAnswerButtons) handleAnswer(true);
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
  }, [disabled, showAnswerButtons, isFlipped]);

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
              
              {showAnswerButtons && (
                <div className="answer-instructions">
                  <span>Press ← or 1 for Wrong</span>
                  <span>Press → or 2 for Correct</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (only show when answer is revealed) */}
      {showAnswerButtons && (
        <div className="answer-actions">
          <button
            className="action-btn wrong-btn"
            onClick={() => handleAnswer(false)}
            disabled={disabled}
            aria-label="Mark as wrong"
          >
            <FaTimes size={20} />
            <span>Wrong</span>
            <kbd>1</kbd>
          </button>
          
          <button
            className="action-btn flip-btn"
            onClick={handleFlip}
            disabled={disabled}
            aria-label="Flip card back"
          >
            <FaSync size={20} />
            <span>Flip Back</span>
          </button>
          
          <button
            className="action-btn correct-btn"
            onClick={() => handleAnswer(true)}
            disabled={disabled}
            aria-label="Mark as correct"
          >
            <FaCheck size={20} />
            <span>Correct</span>
            <kbd>2</kbd>
          </button>
        </div>
      )}

      {/* Flip button (always visible) */}
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
        {isFlipped && (
          <>
            <div className="shortcut">
              <kbd>1</kbd> or <kbd>←</kbd>
              <span>Wrong</span>
            </div>
            <div className="shortcut">
              <kbd>2</kbd> or <kbd>→</kbd>
              <span>Correct</span>
            </div>
          </>
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