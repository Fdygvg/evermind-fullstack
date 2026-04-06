import BookmarkButton from './BookmarkButton';
import CodeBlock from './CodeBlock';
import MarkdownContent from './MarkdownContent';
import { useEffect, useState, useRef } from 'react';
import { useSound } from '../../hooks/useSound';
import { FaRegCopy, FaCheck, FaPen, FaCommentDots, FaPlay, FaTrash, FaCode, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { questionService } from '../../services/question';
import { aiService } from '../../services/aiService';
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
  const [activeHtmlRender, setActiveHtmlRender] = useState(null); // index or null
  const [showHtmlPills, setShowHtmlPills] = useState(false);
  const [showRawHtml, setShowRawHtml] = useState(false);
  const [isDeletingRender, setIsDeletingRender] = useState(false);

  const handleDeleteRender = async (renderId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this HTML render?")) return;
    setIsDeletingRender(true);
    try {
      const res = await aiService.deleteHtmlRender(displayQuestion._id, renderId);
      if (res.data?.success && res.data?.data?.question) {
        if (onQuestionUpdated) onQuestionUpdated(res.data.data.question);
        setActiveHtmlRender(null);
        setShowRawHtml(false);
      }
    } catch (err) {
      console.error("Failed to delete html render", err);
    } finally {
      setIsDeletingRender(false);
    }
  };

  // --- Annotation State ---
  const annotationKey = `annotation_${currentQuestion._id}`;
  const [annotation, setAnnotation] = useState(() => {
    return localStorage.getItem(annotationKey) || '';
  });
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [editAnnotation, setEditAnnotation] = useState('');

  const questionRef = useRef(null);
  const answerRef = useRef(null);
  const cardRef = useRef(null);

  const [highlightData, setHighlightData] = useState(null);

  useEffect(() => {
    let timeoutId;
    const checkSelection = () => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (cardRef.current && cardRef.current.contains(range.commonAncestorContainer)) {
          const text = selection.toString().trim();
          if (text.length > 0) {
            const rect = range.getBoundingClientRect();
            const cardRect = cardRef.current.getBoundingClientRect();
            // Calculate relative positioning
            setHighlightData({
              text,
              top: rect.bottom - cardRect.top + 5,
              left: rect.left - cardRect.left + (rect.width / 2)
            });
            return;
          }
        }
      }
      setHighlightData(null);
    };

    const handleSelectionChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkSelection, 200);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      clearTimeout(timeoutId);
    };
  }, []);

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

    // Reset highlight
    setHighlightData(null);
    setActiveHtmlRender(null);
    setShowHtmlPills(false);
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
      ref={cardRef}
      className={`question-card ${loading ? 'loading' : ''}`}
      style={{ position: 'relative' }}
    >
      {/* Ask AI Floating Button */}
      <AnimatePresence>
        {highlightData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: `${highlightData.top}px`,
              left: `${highlightData.left}px`,
              transform: 'translateX(-50%)',
              zIndex: 50,
            }}
          >
            <button
              onMouseDown={(e) => {
                e.preventDefault(); // Prevents text selection from clearing
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('open-ai-panel', { detail: { action: 'ask_highlight', text: highlightData.text } }));
                setHighlightData(null);
                window.getSelection()?.removeAllRanges();
              }}
              style={{
                background: 'var(--color-primary, #8B5CF6)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              Ask AI❓
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit, Copy & Bookmark Buttons */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Render HTML Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('open-ai-panel', { detail: { action: 'render_html' } }));
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            background: 'var(--color-surface, rgba(255, 255, 255, 0.05))',
            border: '1px solid var(--color-border, rgba(255, 255, 255, 0.1))',
            borderRadius: '6px',
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            color: 'var(--color-primary, #8B5CF6)',
            transition: 'all 0.2s ease',
            marginRight: '2px'
          }}
          title="Visualize Concept with AI Html"
        >
          <FaPlay size={12} />
        </motion.button>
        {/* Framework Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('open-ai-panel', { detail: { action: 'framework' } }));
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            background: 'var(--color-surface, rgba(255, 255, 255, 0.05))',
            border: '1px solid var(--color-border, rgba(255, 255, 255, 0.1))',
            borderRadius: '6px',
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            color: 'var(--color-primary, #8B5CF6)',
            transition: 'all 0.2s ease',
            fontWeight: 800,
            fontSize: '12px',
            marginRight: '4px'
          }}
          title="Apply O(1) Mastery Framework"
        >
          F
        </motion.button>
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
        <h2
          onClick={(e) => {
            e.stopPropagation();
            if (!isEditing) {
              window.dispatchEvent(new CustomEvent('open-ai-panel', { detail: { action: 'rewrite_question' } }));
            }
          }}
          style={{
            cursor: isEditing ? 'default' : 'pointer',
            transition: 'color 0.2s ease',
            display: 'inline-block',
          }}
          onMouseEnter={(e) => { if (!isEditing) e.target.style.color = 'var(--color-primary, #8B5CF6)'; }}
          onMouseLeave={(e) => { e.target.style.color = ''; }}
          title={isEditing ? undefined : "Click to rewrite question with AI"}
        ><strong>Question</strong></h2>
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
          <MarkdownContent content={displayQuestion.question} questionId={currentQuestion._id} />
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
          <h2><strong>Answer</strong></h2>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <h2 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (showHtmlPills) {
                  setShowHtmlPills(false);
                  setActiveHtmlRender(null);
                } else {
                  if (displayQuestion?.htmlRenders?.length > 0) {
                    setShowHtmlPills(true);
                  }
                }
              }}
              style={{ 
                cursor: 'pointer', 
                margin: 0,
                opacity: showHtmlPills ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              <strong>Answer</strong>
            </h2>
            {showHtmlPills && displayQuestion.htmlRenders && displayQuestion.htmlRenders.map((render, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Clicked HTML Tab index:", idx);
                    if (activeHtmlRender !== idx) {
                      setShowRawHtml(false);
                    }
                    setActiveHtmlRender(idx);
                  }}
                  style={{
                    background: activeHtmlRender === idx ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: activeHtmlRender === idx ? '#fff' : 'var(--color-text)',
                    border: `1px solid ${activeHtmlRender === idx ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: '12px',
                    padding: '2px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <strong>[{render.title.toUpperCase()}]</strong>
                </button>
                
                {activeHtmlRender === idx && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRawHtml(!showRawHtml);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: showRawHtml ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px'
                      }}
                      title="Toggle Code View"
                    >
                      <FaCode size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteRender(render._id, e)}
                      disabled={isDeletingRender}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-danger, #ef4444)',
                        cursor: isDeletingRender ? 'not-allowed' : 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isDeletingRender ? 0.5 : 1,
                        borderRadius: '4px'
                      }}
                      title="Delete Render"
                    >
                      {isDeletingRender ? <FaSpinner className="ai-spinner" size={12} /> : <FaTrash size={12} />}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {activeHtmlRender !== null ? (
            <div style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden', background: '#fff', border: '1px solid var(--color-border)' }}>
              {showRawHtml ? (
                <div style={{ width: '100%', height: '100%', overflow: 'auto', background: '#1e1e1e', padding: '12px', fontSize: '13px' }}>
                  <CodeBlock text={displayQuestion.htmlRenders[activeHtmlRender].htmlContent} language="html" skipCopy={false} />
                </div>
              ) : (
                <iframe
                  srcDoc={`<style>html, body { max-width: 100%; overflow-x: hidden !important; box-sizing: border-box; margin: 0; padding: 8px; word-break: break-word; } *, *::before, *::after { box-sizing: inherit; max-width: 100%; } img, video, canvas, svg, table { max-width: 100%; height: auto; } pre, code { white-space: pre-wrap; word-break: break-word; font-size: 14px; }</style>${displayQuestion.htmlRenders[activeHtmlRender].htmlContent}`}
                  title="HTML Visualization"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  sandbox="allow-scripts allow-same-origin"
                />
              )}
            </div>
          ) : (
            <MarkdownContent content={displayQuestion.answer} />
          )}

          <div style={{ marginTop: '16px' }}>
            <button
              className="show-answer-btn"
              style={{ background: 'transparent', color: 'var(--color-primary, #8B5CF6)', border: '2px solid var(--color-primary, #8B5CF6)' }}
              onClick={(e) => {
                e.stopPropagation();
                setShowAnswer(false);
                playSound("flip");
              }}
            >
              Hide Answer
            </button>
          </div>
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
