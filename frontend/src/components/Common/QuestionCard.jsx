import React, { useState, useRef, useEffect, useCallback } from "react";
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
    if (!isDragging || loading) return;

    const deltaTime = Date.now() - startTimeRef.current;
    const velocity = Math.abs(swipeOffset) / deltaTime;

    setIsDragging(false);

    // Check if threshold reached (distance and velocity)
    if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD && velocity > 0.1) {
      if (swipeOffset > 0) {
        // Swiped right = Correct
        playSound("correct");
        submitAnswer(true);
      } else {
        // Swiped left = Wrong
        playSound("wrong");
        submitAnswer(false);
      }
    }

    // Reset
    setSwipeOffset(0);
    setSwipeDirection(null);
  }, [isDragging, loading, swipeOffset, submitAnswer, playSound]);

  // Touch events
  const handleTouchStart = useCallback(
    (e) => {
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

      {showAnswer ? (
        <div className="answer-section">
          <h2>Answer</h2>
          {currentQuestion.isCode ? (
            <CodeBlock text={currentQuestion.answer} forceCode={true} />
          ) : (
            <p>{currentQuestion.answer}</p>
          )}
          <div className="answer-buttons">
            <button
              className="correct-btn"
              onClick={() => {
                playSound("correct");
                submitAnswer(true);
              }}
              disabled={loading}
            >
              ✓ Correct
            </button>
            <button
              className="wrong-btn"
              onClick={() => {
                playSound("wrong");
                submitAnswer(false);
              }}
              disabled={loading}
            >
              ✗ Wrong
            </button>
          </div>
        </div>
      ) : (
        <button
          className="show-answer-btn"
          onClick={() => {
            setShowAnswer(true);
            playSound("flip");
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
