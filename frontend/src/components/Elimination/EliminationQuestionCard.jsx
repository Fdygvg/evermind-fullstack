import React, { useState } from "react";
import { Eye } from "lucide-react";
import CodeBlock from "../Common/CodeBlock";
import RatingButtons from "../SmartReview/RatingButtons";
import "../css/eliminationQuestionCard.css";
import { useSound } from "../../hooks/useSound";

const EliminationQuestionCard = ({
  question,
  index,
  isRevealed,
  onToggleAnswer,
  rateQuestion,
  disabled = false
}) => {
  const { playSound } = useSound();
  const [isRatingThisQuestion, setIsRatingThisQuestion] = useState(false);

  const handleRate = async (rating) => {
    console.log("[ELIMINATION] Rating button clicked:", rating);
    console.log("[ELIMINATION] Question ID:", question._id);

    if (!rateQuestion || isRatingThisQuestion) {
      console.error("[ELIMINATION] rateQuestion function not provided or already rating!");
      return;
    }

    setIsRatingThisQuestion(true);

    try {
      // Play sound based on rating
      if (rating >= 4) {
        playSound("correct");
      } else if (rating === 3) {
        playSound("ding");
      } else {
        playSound("wrong");
      }

      // Submit the rating
      await rateQuestion(rating);
      console.log("[ELIMINATION] Rating submitted successfully");
      
      // Reset loading state after a short delay to allow for smooth UI transition
      // The question will be removed from the list, but this ensures the state is clean
      setTimeout(() => {
        setIsRatingThisQuestion(false);
      }, 100);

    } catch (error) {
      console.error("[ELIMINATION] Error submitting rating:", error);
      playSound("error");
      setIsRatingThisQuestion(false);
    }
  };

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
            if (!isRatingThisQuestion && !disabled) {
              onToggleAnswer();
              playSound("bubble");
            }
          }}
          title={isRevealed ? "Hide Answer" : "Reveal Answer"}
          disabled={isRatingThisQuestion || disabled}
        >
          <Eye size={18} />
          <span>{isRevealed ? "Hide Answer" : "Reveal Answer"}</span>
        </button>
      </div>

      {/* Smart Review Rating Buttons */}
      <div className="smart-review-rating-section">
        <RatingButtons
          onRate={handleRate}
          disabled={isRatingThisQuestion || disabled}
          compact={false}
        />
      </div>
    </div>
  );
};

export default EliminationQuestionCard;
