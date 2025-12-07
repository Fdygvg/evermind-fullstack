import React from "react";
import { Eye } from "lucide-react";
import EliminationActions from "./EliminationActions";
import CodeBlock from "../Common/CodeBlock";
import "../Common/css/eliminationQuestionCard.css";
import { useSound } from "../../hooks/useSound";

const EliminationQuestionCard = ({
  question,
  index,
  isRevealed,
  onToggleAnswer,
  onAction,
}) => {
  const { playSound } = useSound();

  return (
    <div className="question-card">
      <div className="question-header">
        <span className="question-number">#{index + 1}</span>
        {question.tags && question.tags.length > 0 && (
          <div className="question-tags">
            {(question.tags || []).map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="question-content">
        <div className="question-text">
          {question.isCode ? (
            <CodeBlock text={question.question} forceCode={true} />
          ) : (
            <p>{question.question}</p>
          )}
        </div>

        {isRevealed && question?.answer && (
          <div className="answer-section">
            <div className="answer-label">Answer:</div>
            <div className="answer-text">
              {question.isCode ? (
                <CodeBlock text={question.answer} forceCode={true} />
              ) : (
                <p>{question.answer}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="question-actions">
        <button
          className="action-btn reveal-btn"
          onClick={() => {
            onToggleAnswer();
            playSound("bubble");
          }}
          title={isRevealed ? "Hide Answer" : "Reveal Answer"}
        >
          <Eye size={18} />
          <span>{isRevealed ? "Hide Answer" : "Reveal Answer"}</span>
        </button>
      </div>

      <EliminationActions onAction={onAction} />
    </div>
  );
};

export default EliminationQuestionCard;
