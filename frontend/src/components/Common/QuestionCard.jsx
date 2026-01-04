import BookmarkButton from './BookmarkButton';
import { useEffect } from 'react';
import { useSound } from '../../hooks/useSound';

const QuestionCard = ({
  currentQuestion,
  showAnswer,
  setShowAnswer,
  submitAnswer,
  loading,
}) => {
  const { playSound } = useSound();

  // Log when question changes
  useEffect(() => {
    console.log("[CARD] QuestionCard rendered");
  }, [currentQuestion?._id]);

  return (
    <div
      id="questionCard"
      className={`question-card ${loading ? 'loading' : ''}`}
      style={{ position: 'relative' }} // Ensure relative for absolute bookmark
    >
      {/* Bookmark Button */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
        <BookmarkButton
          questionId={currentQuestion._id}
          initialIsBookmarked={currentQuestion.isBookmarked}
        />
      </div>

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
        </div>
      ) : (
        <button
          className="show-answer-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowAnswer(true);
            playSound("flip");
          }}
        >
          Show Answer
        </button>
      )}
    </div>
  );
};

export default QuestionCard;
