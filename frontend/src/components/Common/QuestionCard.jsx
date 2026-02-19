import BookmarkButton from './BookmarkButton';
import CodeBlock from './CodeBlock';
import { useEffect, useState } from 'react';
import { useSound } from '../../hooks/useSound';
import { FaRegCopy, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const QuestionCard = ({
  currentQuestion,
  showAnswer,
  setShowAnswer,
  submitAnswer,
  loading,
}) => {
  const { playSound } = useSound();
  const [copied, setCopied] = useState(false);

  // Log when question changes
  useEffect(() => {
    console.log("[CARD] QuestionCard rendered");
  }, [currentQuestion?._id]);

  // Reset copied state when question changes
  useEffect(() => {
    setCopied(false);
  }, [currentQuestion?._id]);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      const qText = currentQuestion.question || '';
      const aText = currentQuestion.answer || '';
      const textToCopy = `Question:\n${qText}\n\nAnswer:\n${aText}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      playSound('ding');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      id="questionCard"
      className={`question-card ${loading ? 'loading' : ''}`}
      style={{ position: 'relative' }} // Ensure relative for absolute bookmark
    >
      {/* Copy & Bookmark Buttons */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <motion.button
          onClick={handleCopy}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            color: copied ? 'var(--color-success, #10B981)' : 'var(--color-text-secondary, #6B7280)',
            transition: 'color 0.2s ease',
          }}
          title={copied ? "Copied!" : "Copy question"}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <FaCheck size={18} />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <FaRegCopy size={18} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
        <BookmarkButton
          questionId={currentQuestion._id}
          initialIsBookmarked={currentQuestion.isBookmarked}
        />
      </div>

      <div className="question-section">
        <h2>Question</h2>
        <p>{currentQuestion.question}</p>
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
