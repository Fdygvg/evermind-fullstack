import React, { useState } from 'react';
import '../css/addMoreButton.css';

const AddMoreButton = ({
  rolledOverCount,
  onAddMore,
  disabled = false,
  variant = 'default'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddMore = async () => {
    if (disabled || isLoading || rolledOverCount === 0) return;

    setIsLoading(true);
    try {
      await onAddMore();
      setIsExpanded(false);
    } catch (error) {
      console.error('Error adding more questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (rolledOverCount === 0) {
    return null;
  }

  if (variant === 'simple') {
    return (
      <button
        className="add-more-btn-simple"
        onClick={handleAddMore}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <span className="loading-spinner"></span>
        ) : (
          <>
            <span className="plus-icon">+</span>
            Add {rolledOverCount} more
          </>
        )}
      </button>
    );
  }

  return (
    <div className={`add-more-container ${isExpanded ? 'expanded' : ''}`}>
      {!isExpanded ? (
        <button
          className="add-more-btn"
          onClick={() => setIsExpanded(true)}
          disabled={disabled}
        >
          <div className="add-more-content">
            <span className="add-icon">➕</span>
            <div className="add-more-text">
              <span className="add-title">Add More Questions</span>
              <span className="add-count">{rolledOverCount} available</span>
            </div>
            <span className="expand-arrow">▼</span>
          </div>
        </button>
      ) : (
        <div className="add-more-expanded">
          <div className="expanded-header">
            <h4>Add More Questions</h4>
            <button
              className="close-btn"
              onClick={() => setIsExpanded(false)}
            >
              ✕
            </button>
          </div>

          <div className="expanded-content">
            <p className="info-text">
              You have <strong>{rolledOverCount}</strong> questions that were rolled over from today's limit.
              Adding them will increase your daily review count.
            </p>

            <div className="action-buttons">
              <button
                className="add-confirm-btn"
                onClick={handleAddMore}
                disabled={disabled || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Adding...
                  </>
                ) : (
                  `Add ${rolledOverCount} Questions`
                )}
              </button>

              <button
                className="add-cancel-btn"
                onClick={() => setIsExpanded(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>

            <div className="warning-note">
              ⚠️ Note: These questions will be added to today's session and count toward your daily progress.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMoreButton;