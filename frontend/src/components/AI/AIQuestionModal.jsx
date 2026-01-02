// components/AI/Explanation/AIQuestionModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Copy, RefreshCw, Brain, ExternalLink } from 'lucide-react';
import { aiExplanationService } from '../../../services/aiExplanationService';
import '../css/AIQuestionModal.css';

/**
 * Modal that shows detailed AI explanation for a question
 */
const AIQuestionModal = ({
  question,
  answer,
  section,
  isOpen,
  onClose
}) => {
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [explanationType, setExplanationType] = useState('detailed'); // 'simple', 'detailed', 'analogy'

  useEffect(() => {
    if (isOpen && !explanation) {
      generateExplanation('detailed');
    }
  }, [isOpen]);

  const generateExplanation = async (type = 'detailed') => {
    setIsLoading(true);
    setError('');
    setExplanationType(type);

    try {
      const result = await aiExplanationService.explainQuestion(
        question,
        answer,
        section,
        type
      );
      setExplanation(result);
    } catch (err) {
      setError('Failed to generate explanation. Please try again.');
      console.error('AI explanation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(explanation);
  };

  const regenerateExplanation = () => {
    generateExplanation(explanationType);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="ai-modal-header">
          <div className="ai-modal-title">
            <Brain size={24} />
            <div>
              <h3>AI Explanation</h3>
              {section && (
                <span className="ai-modal-subtitle">
                  Section: {section.name}
                </span>
              )}
            </div>
          </div>
          <button className="ai-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Original Question Display */}
        <div className="ai-original-question">
          <div className="ai-question-block">
            <span className="ai-label">Question:</span>
            <p className="ai-question-text">{question}</p>
          </div>
          <div className="ai-answer-block">
            <span className="ai-label">Answer:</span>
            <p className="ai-answer-text">{answer}</p>
          </div>
        </div>

        {/* Explanation Type Selector */}
        <div className="ai-explanation-types">
          <button
            className={`ai-type-btn ${explanationType === 'simple' ? 'active' : ''}`}
            onClick={() => generateExplanation('simple')}
            disabled={isLoading}
          >
            Simple
          </button>
          <button
            className={`ai-type-btn ${explanationType === 'detailed' ? 'active' : ''}`}
            onClick={() => generateExplanation('detailed')}
            disabled={isLoading}
          >
            Detailed
          </button>
          <button
            className={`ai-type-btn ${explanationType === 'analogy' ? 'active' : ''}`}
            onClick={() => generateExplanation('analogy')}
            disabled={isLoading}
          >
            Analogy
          </button>
        </div>

        {/* Explanation Content */}
        <div className="ai-explanation-container">
          {isLoading ? (
            <div className="ai-loading">
              <div className="ai-loading-spinner"></div>
              <p>AI is analyzing and generating explanation...</p>
            </div>
          ) : error ? (
            <div className="ai-error">
              <p>{error}</p>
              <button
                className="ai-retry-btn"
                onClick={regenerateExplanation}
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          ) : explanation ? (
            <div className="ai-explanation-result">
              <div className="ai-explanation-text">
                {explanation}
              </div>

              <div className="ai-explanation-actions">
                <button
                  className="ai-action-btn"
                  onClick={copyToClipboard}
                  title="Copy to clipboard"
                >
                  <Copy size={16} />
                  Copy
                </button>
                <button
                  className="ai-action-btn"
                  onClick={regenerateExplanation}
                  disabled={isLoading}
                  title="Generate new explanation"
                >
                  <RefreshCw size={16} />
                  Regenerate
                </button>
                <a
                  className="ai-action-btn"
                  href={`https://www.google.com/search?q=${encodeURIComponent(question)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Search related information"
                >
                  <ExternalLink size={16} />
                  Search More
                </a>
              </div>
            </div>
          ) : null}
        </div>

        {/* Tips Section */}
        <div className="ai-modal-tips">
          <p className="ai-tips-title">
            <Brain size={16} />
            AI Learning Tips
          </p>
          <ul className="ai-tips-list">
            <li>Try different explanation types for varied understanding</li>
            <li>Copy explanations to your notes for review</li>
            <li>Use analogies to connect with existing knowledge</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default AIQuestionModal;