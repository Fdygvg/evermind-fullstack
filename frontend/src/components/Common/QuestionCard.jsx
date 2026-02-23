import BookmarkButton from './BookmarkButton';
import CodeBlock from './CodeBlock';
import MarkdownContent from './MarkdownContent';
import { useEffect, useState, useRef } from 'react';
import { useSound } from '../../hooks/useSound';
import { FaRegCopy, FaCheck, FaPen, FaCommentDots } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { questionService } from '../../services/question';
import '../css/annotation-bubble.css';

const QuestionCard = ({
  currentQuestion,
  showAnswer,
  setShowAnswer,
  submitAnswer,
  loading,
  onQuestionUpdated,
}) => {
  const { playSound } = useSound();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'error' | null
  const [localQuestion, setLocalQuestion] = useState(null);

  // --- Annotation State ---
  const annotationKey = `annotation_${currentQuestion._id}`;
  const [annotation, setAnnotation] = useState(() => {
    return localStorage.getItem(annotationKey) || '';
  });
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [editAnnotation, setEditAnnotation] = useState('');

  const questionRef = useRef(null);
  const answerRef = useRef(null);

  // Track the displayed question (local overrides for edits)
  const displayQuestion = localQuestion || currentQuestion;

  // Log when question changes
  useEffect(() => {
    console.log("[CARD] QuestionCard rendered");
  }, [currentQuestion?._id]);

  // Reset states when question changes
  useEffect(() => {
    setCopied(false);
    setIsEditing(false);
    setSaveStatus(null);
    setLocalQuestion(null);

    // Reset Annotation on question flip
    const key = `annotation_${currentQuestion?._id}`;
    setAnnotation(localStorage.getItem(key) || '');
    setIsAnnotating(false);
    setEditAnnotation('');
  }, [currentQuestion?._id]);

  // Auto-resize textareas
  const autoResize = (ref) => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      const qText = displayQuestion.question || '';
      const aText = displayQuestion.answer || '';
      const textToCopy = `Question:\n${qText}\n\nAnswer:\n${aText}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      playSound('ding');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEditStart = (e) => {
    e.stopPropagation();
    setEditQuestion(displayQuestion.question || '');
    setEditAnswer(displayQuestion.answer || '');
    setIsEditing(true);
    setSaveStatus(null);
    // Auto-show answer when editing
    if (!showAnswer) setShowAnswer(true);
    // Auto-resize after render
    setTimeout(() => {
      autoResize(questionRef);
      autoResize(answerRef);
    }, 50);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setSaveStatus(null);
  };

  const handleAnnotationStart = (e) => {
    e.stopPropagation();
    setIsEditing(false); // Close edit mode defensively
    setEditAnnotation(annotation);
    setIsAnnotating(true);
  };

  const handleAnnotationSave = () => {
    const trimmed = editAnnotation.trim();
    if (trimmed) {
      localStorage.setItem(annotationKey, trimmed);
      setAnnotation(trimmed);
    } else {
      localStorage.removeItem(annotationKey);
      setAnnotation('');
    }
    setIsAnnotating(false);
  };

  const handleAnnotationDelete = () => {
    localStorage.removeItem(annotationKey);
    setAnnotation('');
    setEditAnnotation('');
    setIsAnnotating(false);
  };

  const handleAnnotationCancel = () => {
    setIsAnnotating(false);
  };

  const handleEditSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await questionService.updateQuestion(currentQuestion._id, {
        question: editQuestion,
        answer: editAnswer,
      });
      // Update local display immediately
      setLocalQuestion({
        ...displayQuestion,
        question: editQuestion,
        answer: editAnswer,
      });
      // Update the session array so edits persist when question re-appears
      if (onQuestionUpdated) {
        onQuestionUpdated(currentQuestion._id, { question: editQuestion, answer: editAnswer });
      }
      setIsEditing(false);
      setSaveStatus('saved');
      playSound('ding');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error('Failed to save:', err);
      setSaveStatus('error');
      playSound('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="questionCard"
      className={`question-card ${loading ? 'loading' : ''}`}
      style={{ position: 'relative' }}
    >
      {/* Edit, Copy & Bookmark Buttons */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Comment/Annotation Button */}
        <motion.button
          onClick={isAnnotating ? handleAnnotationCancel : handleAnnotationStart}
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
            color: annotation || isAnnotating ? 'var(--color-primary, #8B5CF6)' : 'var(--color-text-secondary, #6B7280)',
            transition: 'color 0.2s ease',
          }}
          title={isAnnotating ? "Cancel annotation" : "Add/Edit annotation"}
        >
          <FaCommentDots size={16} />
        </motion.button>

        {/* Edit Button */}
        <motion.button
          onClick={isEditing ? handleEditCancel : handleEditStart}
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
            color: isEditing ? 'var(--color-primary, #8B5CF6)' : 'var(--color-text-secondary, #6B7280)',
            transition: 'color 0.2s ease',
          }}
          title={isEditing ? "Cancel edit" : "Edit question"}
        >
          <FaPen size={16} />
        </motion.button>

        {/* Copy Button */}
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
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <FaCheck size={18} />
              </motion.div>
            ) : (
              <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
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

      {/* Save Status Indicator */}
      <AnimatePresence>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: '50px',
              right: '16px',
              zIndex: 11,
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: saveStatus === 'saved' ? 'var(--color-success, #10B981)' : '#ef4444',
              color: '#fff',
            }}
          >
            {saveStatus === 'saved' ? '✓ Saved!' : '✗ Error saving'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Section */}
      <div className="question-section">
        <h2>Question</h2>
        {isEditing ? (
          <textarea
            ref={questionRef}
            value={editQuestion}
            onChange={(e) => { setEditQuestion(e.target.value); autoResize(questionRef); }}
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid var(--color-primary, #8B5CF6)',
              background: 'var(--color-surface, rgba(255,255,255,0.05))',
              color: 'var(--color-text, inherit)',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              lineHeight: '1.6',
            }}
          />
        ) : (
          <MarkdownContent content={displayQuestion.question} />
        )}

        {/* --- Annotation Bubble / Editor --- */}
        {isAnnotating ? (
          <div className="annotation-editor-wrapper">
            <textarea
              className="annotation-textarea"
              value={editAnnotation}
              onChange={(e) => setEditAnnotation(e.target.value)}
              placeholder="Add a note to remember for next time..."
              autoFocus
            />
            <div className="annotation-actions">
              {annotation && (
                <button className="annotation-btn delete" onClick={handleAnnotationDelete}>
                  Delete Note
                </button>
              )}
              <button className="annotation-btn cancel" onClick={handleAnnotationCancel}>
                Cancel
              </button>
              <button className="annotation-btn save" onClick={handleAnnotationSave}>
                Save Note
              </button>
            </div>
          </div>
        ) : annotation && !isEditing ? (
          <div className="annotation-container">
            <div className="annotation-connector">
              <div className="annotation-line" />
              <div className="annotation-dot">N</div>
            </div>
            <div className="annotation-bubble">
              <pre className="annotation-text">{annotation}</pre>
            </div>
          </div>
        ) : null}
        {/* ---------------------------------- */}

      </div>

      {/* Answer Section */}
      {isEditing ? (
        <div className="answer-section">
          <h2>Answer</h2>
          <textarea
            ref={answerRef}
            value={editAnswer}
            onChange={(e) => { setEditAnswer(e.target.value); autoResize(answerRef); }}
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid var(--color-primary, #8B5CF6)',
              background: 'var(--color-surface, rgba(255,255,255,0.05))',
              color: 'var(--color-text, inherit)',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              lineHeight: '1.6',
            }}
          />
          {/* Save / Cancel Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={handleEditSave}
              disabled={isSaving}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--color-success, #10B981)',
                color: '#fff',
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.6 : 1,
                fontSize: '0.9rem',
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleEditCancel}
              disabled={isSaving}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: '1px solid var(--color-text-secondary, #6B7280)',
                background: 'transparent',
                color: 'var(--color-text-secondary, #6B7280)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : showAnswer && displayQuestion?.answer ? (
        <div className="answer-section">
          <h2>Answer</h2>
          <MarkdownContent content={displayQuestion.answer} />
          <button
            className="show-answer-btn"
            style={{ marginTop: '16px', background: 'transparent', color: 'var(--color-primary, #8B5CF6)', border: '2px solid var(--color-primary, #8B5CF6)' }}
            onClick={(e) => {
              e.stopPropagation();
              setShowAnswer(false);
              playSound("flip");
            }}
          >
            Hide Answer
          </button>
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
