import React, { useState, useEffect } from "react";
import CodeBlock from "./CodeBlock";
import "../css/questionList.css";
import { getRandomFlipEffect } from "../../utils/flipStyles";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaQuestionCircle,
  FaHourglassHalf,
  FaCalendarAlt,
  FaEye,
  FaEyeSlash,
  FaEdit,
  FaTrash,
  FaInfoCircle,
  FaTimes,
  FaBookmark,
  FaRegBookmark
} from "react-icons/fa";

const QuestionList = ({
  question,
  isRevealed,
  onReveal,
  onEdit,
  onDelete,
  onSelect,
  onBookmark, // New prop
  isSelected,
  viewMode = "list",
  sectionColor = "#667eea"
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [flipEffect, setFlipEffect] = useState({ direction: 'horizontal', cssClass: '' });

  // Initialize random flip effect on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setFlipEffect(getRandomFlipEffect());
  }, []);

  // Sync with parent's reveal all state
  useEffect(() => {
    if (isRevealed) {
      setShowAnswer(true);
    }
  }, [isRevealed]);

  const handleCardClick = () => {
    if (!isFlipped) {
      setShowAnswer(!showAnswer);
      if (onReveal) onReveal();
    }
  };

  const handleInfoClick = (e) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    if (onBookmark) onBookmark();
  };

  const handleFlipClose = () => {
    setIsFlipped(false);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(e);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(e);
  };

  const handleSelectClick = (e) => {
    e.stopPropagation();
    if (onSelect) onSelect();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate total attempts
  const totalAttempts = (question.totalCorrect || 0) + (question.totalWrong || 0);

  // Get last session status
  const getLastSessionStatus = () => {
    const status = question.lastSessionStatus;
    switch (status) {
      case "knowit": return { text: "Know It", color: "#10B981", icon: <FaCheckCircle /> };
      case "kinda": return { text: "Kinda", color: "#F59E0B", icon: <FaQuestionCircle /> };
      case "dontknow": return { text: "Don't Know", color: "#EF4444", icon: <FaTimesCircle /> };
      default: return { text: "Not Attempted", color: "#94a3b8", icon: <FaHourglassHalf /> };
    }
  };

  const sessionStatus = getLastSessionStatus();

  return (
    <div
      className={`question-card ${viewMode}-view ${isSelected ? 'selected' : ''} ${flipEffect.cssClass}`}
      data-question-id={question._id}
    >
      {/* Checkbox for selection */}
      <div className="question-selector">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelectClick}
          className="selection-checkbox"
          onClick={handleSelectClick}
        />
      </div>

      <div className={`card-flip-container ${isFlipped ? 'flipped' : ''} ${flipEffect.cssClass}`}>
        {/* FRONT SIDE */}
        <div
          className="question-card-front"
          onClick={handleCardClick}
          style={{ borderTopColor: sectionColor }}
        >
          <div className="question-header">
            <div className="question-text-container">
              <h3 className="question-text">
                Q: {question.question}
              </h3>
              {question.tags && question.tags.length > 0 && (
                <div className="question-tags">
                  {question.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="question-tag">
                      {tag}
                    </span>
                  ))}
                  {question.tags.length > 2 && (
                    <span className="question-tag-more">
                      +{question.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="header-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`bookmark-button ${question.isBookmarked ? 'active' : ''}`}
                onClick={handleBookmarkClick}
                title={question.isBookmarked ? "Remove bookmark" : "Bookmark question"}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: question.isBookmarked ? '#F59E0B' : 'var(--text-tertiary)',
                  fontSize: '1.1rem',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {question.isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
              </button>

              <button
                className="info-button"
                onClick={handleInfoClick}
                title="View question stats"
              >
                <FaInfoCircle />
              </button>
            </div>
          </div>

          {/* Answer dropdown */}
          <div className={`answer-container ${showAnswer ? 'show' : ''}`}>
            {showAnswer && (
              <div className="answer-content">
                <div className="answer-label">Answer:</div>
                {question.isCode ? (
                  <CodeBlock
                    text={question.answer}
                    language={question.language || "javascript"}
                    showLineNumbers={true}
                  />
                ) : (
                  <div className="answer-text">{question.answer}</div>
                )}
              </div>
            )}
          </div>

          {/* Quick stats on front */}
          <div className="question-footer">
            <div className="quick-stats">
              <span className="stat-item">
                <span className="stat-icon"><FaCheckCircle /></span>
                <span className="stat-value">{question.totalCorrect || 0}</span>
              </span>
              <span className="stat-item">
                <span className="stat-icon"><FaTimesCircle /></span>
                <span className="stat-value">{question.totalWrong || 0}</span>
              </span>
              <span className="stat-item">
                <span className="stat-icon"><FaCalendarAlt /></span>
                <span className="stat-value">
                  {question.lastReviewed ?
                    new Date(question.lastReviewed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Never'
                  }
                </span>
              </span>
            </div>

            <div className="answer-indicator">
              {showAnswer ? (
                <>
                  <FaEye className="icon-mr" /> Answer shown
                </>
              ) : (
                <>
                  <FaEyeSlash className="icon-mr" /> Click to reveal
                </>
              )}
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          className="question-card-back"
          onClick={handleFlipClose}
          style={{ borderTopColor: sectionColor }}
        >
          <div className="stats-header">
            <h3 className="stats-title">Question Stats</h3>
            <div className="header-buttons-back" style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`header-icon-btn ${question.isBookmarked ? 'active' : ''}`}
                onClick={handleBookmarkClick}
                title={question.isBookmarked ? "Remove bookmark" : "Bookmark question"}
              >
                {question.isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
              </button>
              <button
                className="header-icon-btn"
                onClick={handleFlipClose}
                title="Close stats"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="stats-content">
            {/* Basic Info */}
            <div className="stat-section">
              <h4 className="stat-section-title">Basic Info</h4>
              <div className="stat-grid">
                <div className="stat-item-back">
                  <span className="stat-label-back">Date Added</span>
                  <span className="stat-value-back">
                    {formatDate(question.createdAt)}
                  </span>
                </div>
                <div className="stat-item-back">
                  <span className="stat-label-back">Last Updated</span>
                  <span className="stat-value-back">
                    {formatDate(question.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="stat-section">
              <h4 className="stat-section-title">Performance</h4>
              <div className="stat-grid">
                <div className="stat-item-back">
                  <span className="stat-label-back">Times Correct</span>
                  <span className="stat-value-back correct">
                    {question.totalCorrect || 0}
                  </span>
                </div>
                <div className="stat-item-back">
                  <span className="stat-label-back">Times Wrong</span>
                  <span className="stat-value-back wrong">
                    {question.totalWrong || 0}
                  </span>
                </div>
                <div className="stat-item-back">
                  <span className="stat-label-back">Accuracy</span>
                  <span className="stat-value-back">
                    {totalAttempts > 0
                      ? `${Math.round((question.totalCorrect || 0) / totalAttempts * 100)}%`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Last Session Status */}
            <div className="stat-section">
              <h4 className="stat-section-title">Last Session</h4>
              <div className="session-status">
                <div
                  className="status-badge"
                  style={{
                    backgroundColor: `${sessionStatus.color}20`,
                    borderColor: sessionStatus.color,
                    color: sessionStatus.color
                  }}
                >
                  <span className="status-icon">{sessionStatus.icon}</span>
                  <span className="status-text">{sessionStatus.text}</span>
                </div>
                <div className="session-date">
                  Last reviewed: {formatDate(question.lastReviewed)}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons on Back */}
          <div className="back-actions">
            <button
              className="back-btn edit-btn"
              onClick={handleEditClick}
            >
              <FaEdit /> Edit
            </button>
            <button
              className="back-btn delete-btn"
              onClick={handleDeleteClick}
            >
              <FaTrash /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionList;