import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaCheck, FaMinus, FaTimes } from 'react-icons/fa';
import CodeBlock from "./CodeBlock";
import { useSound } from "../../hooks/useSound";
import "./css/questionCard.css";

const QuestionCard = ({
  currentQuestion,
  showAnswer,
  setShowAnswer,
  submitAnswer,
  loading,
}) => {
  const { playSound } = useSound();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const cardRef = useRef(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const SWIPE_THRESHOLD = 60; // Minimum distance to trigger action

  // Log when question changes (component remounts due to key prop, so state auto-resets)
  useEffect(() => {
    console.log("[CARD] QuestionCard rendered/re-rendered");
    console.log("[CARD] Current question:", {
      id: currentQuestion?._id,
      question: currentQuestion?.question?.substring(0, 50) + "...",
      hasAnswer: !!currentQuestion?.answer,
      answerLength: currentQuestion?.answer?.length
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?._id]);

  // Check if touch/click is in the swipe zone (top 50% height, middle 40% width)
  const isInSwipeZone = useCallback((clientX, clientY) => {
    if (!cardRef.current) return false;

    const rect = cardRef.current.getBoundingClientRect();
    const cardHeight = rect.height;
    const cardWidth = rect.width;
    const cardTop = rect.top;
    const cardLeft = rect.left;

    // Top 50% of card height, middle 40% width (30% removed from each edge)
    const swipeAreaHeight = cardHeight * 0.5;
    const cardMiddle = cardTop + swipeAreaHeight;
    const leftBoundary = cardLeft + cardWidth * 0.3;
    const rightBoundary = cardLeft + cardWidth * 0.7;

    return (
      clientY >= cardTop &&
      clientY <= cardMiddle &&
      clientX >= leftBoundary &&
      clientX <= rightBoundary
    );
  }, []);

  const handleStart = useCallback(
    (clientX, clientY) => {
      if (loading) return;

      // Only activate if touch/click is in swipe zone
      if (!isInSwipeZone(clientX, clientY)) {
        return;
      }

      startXRef.current = clientX;
      startYRef.current = clientY;
      startTimeRef.current = Date.now();
      setIsDragging(true);
      setSwipeOffset(0);
      setSwipeDirection(null);
    },
    [loading, isInSwipeZone]
  );

  const handleMove = useCallback(
    (clientX) => {
      if (!isDragging || loading) return;

      const offset = clientX - startXRef.current;
      const maxDrag = 200;
      const clampedOffset = Math.max(-maxDrag, Math.min(maxDrag, offset));

      setSwipeOffset(clampedOffset);

      // Determine direction
      if (Math.abs(clampedOffset) > 20) {
        setSwipeDirection(clampedOffset > 0 ? "right" : "left");
      } else {
        setSwipeDirection(null);
      }
    },
    [isDragging, loading]
  );

  const handleEnd = useCallback(() => {
    console.log("[SWIPE] handleEnd called", { isDragging, loading, swipeOffset });

    if (!isDragging || loading) {
      console.log("[SWIPE] handleEnd blocked - isDragging:", isDragging, "loading:", loading);
      return;
    }

    const deltaTime = Date.now() - startTimeRef.current;
    const velocity = Math.abs(swipeOffset) / Math.max(deltaTime, 1);
    console.log("[SWIPE] Swipe metrics:", {
      offset: swipeOffset,
      deltaTime,
      velocity,
      threshold: SWIPE_THRESHOLD
    });

    setIsDragging(false);

    // Check if threshold reached (distance and velocity)
    if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD && velocity > 0.1) {
      const isCorrect = swipeOffset > 0;
      console.log("[SWIPE] Swipe threshold reached! Submitting:", isCorrect ? "CORRECT" : "WRONG");

      if (swipeOffset > 0) {
        // Swiped right = Correct
        playSound("correct");
        submitAnswer(true);
      } else {
        // Swiped left = Wrong
        playSound("wrong");
        submitAnswer(false);
      }
    } else {
      console.log("[SWIPE] Swipe threshold NOT reached");
    }

    // Reset
    setSwipeOffset(0);
    setSwipeDirection(null);
  }, [isDragging, loading, swipeOffset, submitAnswer, playSound]);

  // Touch events
  const handleTouchStart = useCallback(
    (e) => {
      // Ignore touches on buttons and other interactive elements
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
      }
      const touch = e.touches[0];
      const inZone = isInSwipeZone(touch.clientX, touch.clientY);
      if (inZone) {
        e.preventDefault();
        handleStart(touch.clientX, touch.clientY);
      }
    },
    [handleStart, isInSwipeZone]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (isDragging) {
        e.preventDefault();
        handleMove(e.touches[0].clientX);
      }
    },
    [isDragging, handleMove]
  );

  const handleTouchEnd = useCallback(
    (e) => {
      if (isDragging) {
        e.preventDefault();
        handleEnd();
      }
    },
    [isDragging, handleEnd]
  );

  // Mouse events
  const handleMouseDown = useCallback(
    (e) => {
      // Ignore clicks on buttons and other interactive elements
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
      }
      const inZone = isInSwipeZone(e.clientX, e.clientY);
      if (inZone) {
        e.preventDefault();
        handleStart(e.clientX, e.clientY);
      }
    },
    [handleStart, isInSwipeZone]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        e.preventDefault();
        handleMove(e.clientX);
      }
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(
    (e) => {
      if (isDragging) {
        e.preventDefault();
        handleEnd();
      }
    },
    [isDragging, handleEnd]
  );

  // Global mouse handlers for dragging outside card
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e) => {
      handleMove(e.clientX);
    };

    const handleGlobalMouseUp = () => {
      handleEnd();
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  // Calculate swipe intensity
  const intensity = Math.min(Math.abs(swipeOffset) / 100, 1);

  return (
    <div
      ref={cardRef}
      id="questionCard"
      className="question-card"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ position: "relative", touchAction: "pan-y" }}
    >
      <div className="question-section">
        <h2>Question</h2>
        {currentQuestion.isCode ? (
          <CodeBlock text={currentQuestion.question} forceCode={true} />
        ) : (
          <p>{currentQuestion.question}</p>
        )}
      </div>

      {showAnswer && currentQuestion?.answer ? (
        <div className="answer-section">
          <h2>Answer</h2>
          {currentQuestion.isCode ? (
            <CodeBlock text={currentQuestion.answer} forceCode={true} />
          ) : (
            <p>{currentQuestion.answer}</p>
          )}

          {/* Smart Review Integration */}
          {useSmartReview ? (
            <div className="smart-review-rating-section">
              {/* Priority Indicator */}
              <div className="question-priority-info">
                <PriorityIndicator
                  priority={currentQuestion.priority || 0}
                  size="small"
                />
                <span className="priority-text">
                  {currentQuestion.priority === 0 ? "New Question" : `Review Priority: ${currentQuestion.priority}/5`}
                </span>
              </div>

              {/* Smart Review Rating Buttons */}
              <div className="smart-review-rating">
                <p className="rating-prompt">Rate your knowledge (1-5):</p>
                <RatingButtons
                  onRate={async (rating) => {
                    console.log("[SMART REVIEW] Rating clicked:", rating);
                    console.log("[SMART REVIEW] Question ID:", currentQuestion?._id);

                    try {
                      // Play sound based on rating
                      if (rating >= 4) {
                        playSound("correct");
                      } else if (rating === 3) {
                        playSound("ding");
                      } else {
                        playSound("wrong");
                      }

                      // Map Smart Review rating to elimination action for backward compatibility
                      let eliminationAction;
                      if (rating <= 2) {
                        eliminationAction = 'hard'; // Don't know
                      } else if (rating === 3) {
                        eliminationAction = 'medium'; // Kinda
                      } else {
                        eliminationAction = 'easy'; // I know it
                      }

                      console.log("[SMART REVIEW] Mapped to elimination:", eliminationAction);

                      // Submit to Smart Review system
                      if (onSmartReviewRate) {
                        await onSmartReviewRate(currentQuestion._id, rating);
                      }

                      // Also trigger original elimination action if needed
                      submitAnswer(eliminationAction);

                    } catch (error) {
                      console.error("[SMART REVIEW] Rating error:", error);
                      playSound("error");
                    }
                  }}
                  disabled={loading || isRating}
                  compact={false}
                />

                {/* Rating Legend */}
                <div className="rating-legend-smart">
                  <div className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span>
                    <span>1-2: Review today</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: '#3b82f6' }}></span>
                    <span>5: Review in 2 weeks</span>
                  </div>
                </div>

                {/* Undo Button */}
                {onUndo && canUndo && (
                  <button
                    className="undo-rating-btn"
                    onClick={() => {
                      playSound("click");
                      onUndo();
                    }}
                    disabled={loading || isRating}
                  >
                    ↩ Undo Last Rating
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Original Elimination Buttons (for backward compatibility) */
            <div className="answer-buttons-3">
              <button
                className="response-btn green-btn"
                onClick={() => {
                  console.log("[BUTTON] Easy (Green) button clicked");
                  console.log("[BUTTON] Current question ID:", currentQuestion?._id);
                  console.log("[BUTTON] Loading state:", loading);
                  playSound("correct");
                  submitAnswer('easy');
                }}
                disabled={loading}
              >
                <FaCheck /> I Know It
              </button>
              <button
                className="response-btn yellow-btn"
                onClick={() => {
                  console.log("[BUTTON] Medium (Yellow) button clicked");
                  console.log("[BUTTON] Current question ID:", currentQuestion?._id);
                  console.log("[BUTTON] Loading state:", loading);
                  submitAnswer('medium');
                }}
                disabled={loading}
              >
                <FaMinus /> Kinda
              </button>
              <button
                className="response-btn red-btn"
                onClick={() => {
                  console.log("[BUTTON] Hard (Red) button clicked");
                  console.log("[BUTTON] Current question ID:", currentQuestion?._id);
                  console.log("[BUTTON] Loading state:", loading);
                  playSound("wrong");
                  submitAnswer('hard');
                }}
                disabled={loading}
              >
                <FaTimes /> Don't Know
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          className="show-answer-btn"
          onClick={(e) => {
            e.stopPropagation(); // Prevent event from bubbling to card handlers
            setShowAnswer(true);
            playSound("flip");
          }}
          onMouseDown={(e) => {
            e.stopPropagation(); // Prevent mouseDown from triggering card swipe handlers
          }}
        >
          Show Answer
        </button>
      )}

      {/* Swipe Ghost Overlay */}
      {isDragging && Math.abs(swipeOffset) > 30 && (
        <div
          className="swipe-ghost"
          style={{
            backgroundColor:
              swipeDirection === "right"
                ? `rgba(16, 185, 129, ${intensity * 0.3})`
                : swipeDirection === "left"
                  ? `rgba(239, 68, 68, ${intensity * 0.3})`
                  : "transparent",
            transform: `translate(${swipeOffset * 0.1}px, 0)`,
            opacity: intensity,
          }}
        >
          <div className="swipe-ghost-content">
            {swipeDirection === "right" && (
              <div className="swipe-action-text correct-text">✓ Correct</div>
            )}
            {swipeDirection === "left" && (
              <div className="swipe-action-text wrong-text">✗ Wrong</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default QuestionCard;
