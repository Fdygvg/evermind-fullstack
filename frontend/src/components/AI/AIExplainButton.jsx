// components/AI/Explanation/AIExplainButton.jsx
import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import AIQuestionModal from './AIQuestionModal';
import '../Common/css/AIExplainButton.css';

/**
 * Button that attaches to question (i) icon to get AI explanation
 * Usage: <AIExplainButton question={question} answer={answer} />
 */
const AIExplainButton = ({ 
  question, 
  answer, 
  section,
  size = 'sm',
  variant = 'icon',
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, _setIsLoading] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation(); // Prevent parent clicks
    setIsModalOpen(true);
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          className={`ai-explain-btn ai-explain-icon ${size} ${className}`}
          onClick={handleClick}
          disabled={isLoading}
          aria-label="Explain with AI"
          title="Get AI explanation"
        >
          {isLoading ? (
            <Loader2 className="ai-explain-spin" size={size === 'lg' ? 20 : 16} />
          ) : (
            <Sparkles size={size === 'lg' ? 20 : 16} />
          )}
        </button>

        {isModalOpen && (
          <AIQuestionModal
            question={question}
            answer={answer}
            section={section}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </>
    );
  }

  // Text button variant
  return (
    <>
      <button
        className={`ai-explain-btn ai-explain-text ${size} ${className}`}
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="ai-explain-spin" size={16} />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles size={16} />
            <span>Explain with AI</span>
          </>
        )}
      </button>

      {isModalOpen && (
        <AIQuestionModal
          question={question}
          answer={answer}
          section={section}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

// Default props
AIExplainButton.defaultProps = {
  size: 'sm',
  variant: 'icon'
};

export default AIExplainButton;