// frontend/src/components/SmartReview/AIChatPanel.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FaRobot, FaTimes, FaLightbulb, FaPen, FaPaperPlane,
  FaSpinner, FaCopy, FaCheck, FaSave, FaTrash, FaStop, FaArrowDown, FaRegQuestionCircle
} from 'react-icons/fa';
import { aiService } from '../../services/aiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './AIChatPanel.css';

// ─── Code block with language label + copy button ───
const CodeBlockRenderer = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeText = String(children).replace(/\n$/, '');

  // Fix react-markdown v10 inline bug (inline is undefined)
  const isBlock = match || String(children).includes('\n');

  if (!isBlock) {
    return <code className={className} {...props}>{children}</code>;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback ignored */ }
  };

  return (
    <div className="ai-code-block-wrapper">
      <div className="ai-code-block-header">
        <button className="ai-code-copy-btn" onClick={handleCopy} title="Copy code">
          {copied ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
        </button>
        {language && <span className="ai-code-lang">{language}</span>}
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#1e1e1e' }}
        wrapLongLines={true}
        {...props}
      >
        {codeText}
      </SyntaxHighlighter>
    </div>
  );
};

// ─── Rewrite cards (Single Tabbed Box — Medium / Concise) ───
const RewriteCards = ({ msg, onSave }) => {
  const [activeTab, setActiveTab] = useState('A'); // A = Medium, B = Concise
  const [saving, setSaving] = useState(false);
  const [savedVersion, setSavedVersion] = useState(null);

  const handleSave = async () => {
    if (saving || savedVersion === activeTab) return;
    const newAnswer = activeTab === 'A' ? msg.versionAAnswer : msg.versionBAnswer;
    const newQuestion = activeTab === 'A' ? msg.versionAQuestion : msg.versionBQuestion;
    setSaving(true);
    try {
      await onSave(newAnswer, newQuestion);
      setSavedVersion(activeTab);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentQuestion = activeTab === 'A' ? msg.versionAQuestion : msg.versionBQuestion;
  const currentAnswer = activeTab === 'A' ? msg.versionAAnswer : msg.versionBAnswer;
  const isCurrentlySaved = savedVersion === activeTab;

  return (
    <div className="ai-chat-message assistant">
      <div className="ai-msg-bubble ai-rewrite-bubble">
        <div className="ai-msg-text" style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          Here is a rewritten flashcard. Choose a style below:
        </div>
        <div className={`ai-rewrite-card ${isCurrentlySaved ? 'saved' : ''}`}>
          <div className="ai-rewrite-card-body ai-markdown-content">
            {currentQuestion && (
              <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>Question</span>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlockRenderer }}>
                  {currentQuestion}
                </ReactMarkdown>
              </div>
            )}
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-success)', display: 'block', marginBottom: '4px' }}>Answer</span>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlockRenderer }}>
                {currentAnswer}
              </ReactMarkdown>
            </div>
          </div>
          <div className="ai-rewrite-footer">
            <div className="ai-rewrite-tabs">
              <button
                className={`ai-tab-btn ${activeTab === 'A' ? 'active' : ''}`}
                onClick={() => setActiveTab('A')}
                title="Medium"
              >
                Medium
              </button>
              <button
                className={`ai-tab-btn ${activeTab === 'B' ? 'active' : ''}`}
                onClick={() => setActiveTab('B')}
                title="Concise"
              >
                Concise
              </button>
            </div>
            <button
              className="ai-rewrite-save-btn"
              onClick={handleSave}
              disabled={saving || isCurrentlySaved}
            >
              {saving ? <FaSpinner className="ai-spinner" /> :
                isCurrentlySaved ? <><FaCheck /> Saved</> :
                  <><FaSave /> Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Framework message with Save button ───
const FrameworkMessage = ({ msg, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      await onSave(msg.content, msg.newQuestion);
      setSaved(true);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ai-chat-message assistant">
      <div className="ai-msg-bubble">
        {msg.newQuestion && (
          <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>New Question</span>
            <div className="ai-msg-text ai-markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{ code: CodeBlockRenderer }}>
                {msg.newQuestion}
              </ReactMarkdown>
            </div>
          </div>
        )}
        <div className="ai-msg-text ai-markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{ code: CodeBlockRenderer }}
          >
            {msg.content}
          </ReactMarkdown>
        </div>
        <button
          className="ai-rewrite-save-btn"
          style={{ marginTop: '12px' }}
          onClick={handleSave}
          disabled={saving || saved}
        >
          {saving ? <FaSpinner className="ai-spinner" /> :
            saved ? <><FaCheck /> Saved</> :
              <><FaSave /> Save as Answer</>}
        </button>
      </div>
    </div>
  );
};

// ─── HTML Render message with Save button ───
const HtmlRenderMessage = ({ msg, isAlreadySaved, onSaveHtml }) => {
  console.log("HtmlRenderMessage rendering with msg:", { id: msg.id, role: msg.role, contentLength: msg.content?.length, htmlLength: msg.htmlContent?.length });
  const [saving, setSaving] = useState(false);
  const [localSaved, setLocalSaved] = useState(false);

  const saved = isAlreadySaved || localSaved;

  const handleSave = async () => {
    console.log("clicked handleSave. saving:", saving, "saved:", saved);
    if (saving || saved) return;
    setSaving(true);
    try {
      console.log("Invoking onSaveHtml with content length:", msg.htmlContent?.length);
      await onSaveHtml(msg.htmlContent);
      console.log("onSaveHtml completed successfully");
      setLocalSaved(true);
    } catch (err) {
      console.error('Save render error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ai-chat-message assistant">
      <div className="ai-msg-bubble">
        <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>HTML Visualization Generated</span>
          <div className="ai-msg-text">
            {msg.content}
          </div>
        </div>
        <div style={{ padding: '4px', background: 'var(--color-surface)', borderRadius: '8px', overflow: 'hidden', height: '300px', position: 'relative', zIndex: 1 }}>
          <iframe
            srcDoc={`<style>html, body { max-width: 100%; overflow-x: hidden !important; box-sizing: border-box; margin: 0; padding: 8px; word-break: break-word; } *, *::before, *::after { box-sizing: inherit; max-width: 100%; } img, video, canvas, svg, table { max-width: 100%; height: auto; } pre, code { white-space: pre-wrap; word-break: break-word; font-size: 14px; }</style>${msg.htmlContent}`}
            title="Render Preview"
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
        <button
          className="ai-rewrite-save-btn"
          style={{
            marginTop: '12px',
            position: 'relative',
            zIndex: 10,
            cursor: (saving || saved) ? 'not-allowed' : 'pointer',
            opacity: (saving || saved) ? 0.7 : 1,
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSave();
          }}
          disabled={saving || saved}
        >
          {saving ? <FaSpinner className="ai-spinner" /> :
            saved ? <><FaCheck /> Saved</> :
              <><FaSave /> Save HTML Render</>}
        </button>
      </div>
    </div>
  );
};

// ─── Question Rewrite card (single version — question only) ───
const QuestionRewriteCards = ({ msg, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      await onSave(null, msg.rewrittenQuestion);
      setSaved(true);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ai-chat-message assistant">
      <div className="ai-msg-bubble ai-rewrite-bubble">
        <div className="ai-msg-text" style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          📝 Here is your rewritten question:
        </div>
        <div className={`ai-rewrite-card ${saved ? 'saved' : ''}`}>
          <div className="ai-rewrite-card-body ai-markdown-content">
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>Rewritten Question</span>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlockRenderer }}>
                {msg.rewrittenQuestion}
              </ReactMarkdown>
            </div>
          </div>
          <div className="ai-rewrite-footer" style={{ justifyContent: 'flex-end' }}>
            <button
              className="ai-rewrite-save-btn"
              onClick={handleSave}
              disabled={saving || saved}
            >
              {saving ? <FaSpinner className="ai-spinner" /> :
                saved ? <><FaCheck /> Saved</> :
                  <><FaSave /> Use This Question</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Knowledge Suggestion card (AI detected new related concept) ───
const SuggestionCard = ({ msg, question, onApprove }) => {
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  const handleApprove = async () => {
    if (approving || approved || !question) return;
    setApproving(true);
    try {
      // Append to existing question and answer
      const updatedQuestion = (question.question || '') + '\n' + msg.addToQuestion;
      const updatedAnswer = (question.answer || '') + '\n\n' + msg.addToAnswer;
      await onApprove(updatedAnswer, updatedQuestion);
      setApproved(true);
    } catch (err) {
      console.error('Failed to approve suggestion:', err);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="ai-chat-message assistant">
      <div className="ai-msg-bubble" style={{ border: '1px solid var(--color-primary, #8B5CF6)', background: 'var(--color-surface, rgba(139, 92, 246, 0.05))' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary, #8B5CF6)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          💡 New Knowledge Detected
        </div>

        {msg.addToQuestion && (
          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Add to Question:</span>
            <div className="ai-markdown-content" style={{ marginTop: '4px', padding: '8px 10px', background: 'var(--color-surface, rgba(255,255,255,0.03))', borderRadius: '6px', borderLeft: '2px solid var(--color-primary, #8B5CF6)' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlockRenderer }}>
                {msg.addToQuestion}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {msg.addToAnswer && (
          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Add to Answer:</span>
            <div className="ai-markdown-content" style={{ marginTop: '4px', padding: '8px 10px', background: 'var(--color-surface, rgba(255,255,255,0.03))', borderRadius: '6px', borderLeft: '2px solid #22c55e' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlockRenderer }}>
                {msg.addToAnswer}
              </ReactMarkdown>
            </div>
          </div>
        )}

        <button
          className="ai-rewrite-save-btn"
          onClick={handleApprove}
          disabled={approving || approved}
          style={{ marginTop: '4px' }}
        >
          {approving ? <FaSpinner className="ai-spinner" /> :
            approved ? <><FaCheck /> Added to Flashcard</> :
              <><FaSave /> Approve & Add</>}
        </button>
      </div>
    </div>
  );
};

// ─── Single chat message bubble ───
const ChatMessage = ({ msg }) => {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';
  const isDivider = msg.role === 'divider';

  if (isDivider) {
    return (
      <div className="ai-chat-divider">
        <span>{msg.content}</span>
      </div>
    );
  }

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback ignored */ }
  };

  return (
    <div className={`ai-chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="ai-msg-bubble">
        {isUser ? (
          <div className="ai-msg-text">{msg.displayText || msg.content}</div>
        ) : (
          <div className="ai-msg-text ai-markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{ code: CodeBlockRenderer }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
        <button
          className={`ai-msg-copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopyMessage}
          title="Copy message"
        >
          {copied ? <FaCheck /> : <FaCopy />}
        </button>
      </div>
    </div>
  );
};

// ─── Main AIChatPanel component ───
const AIChatPanel = ({
  question,        // current question object { _id, question, answer }
  onClose,         // close the panel
  onAnswerSaved,   // callback after saving a rewritten answer
  initialAction,   // optional command to run on mount
}) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [highlightData, setHighlightData] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [quotedText, setQuotedText] = useState(null); // WhatsApp-style quoted highlight
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const panelContentRef = useRef(null);
  const currentQuestionIdRef = useRef(null);
  const hasFiredInitialAction = useRef(false);
  const abortControllerRef = useRef(null);

  // Text selection detection inside chat messages
  useEffect(() => {
    let timeoutId;
    const checkSelection = () => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (panelContentRef.current && panelContentRef.current.contains(range.commonAncestorContainer)) {
          const text = selection.toString().trim();
          if (text.length > 0) {
            const rect = range.getBoundingClientRect();
            const panelRect = panelContentRef.current.getBoundingClientRect();
            setHighlightData({
              text,
              top: rect.bottom - panelRect.top + panelContentRef.current.scrollTop + 5,
              left: rect.left - panelRect.left + (rect.width / 2)
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

  // Send a message to the AI (hoisted so initialAction can use it)
  const sendMessage = useCallback(async (rawMessage, displayText = null) => {
    if (!rawMessage.trim() || loading) return;

    const isFrameworkCmd = rawMessage === '__FRAMEWORK__';

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: rawMessage,
      displayText: displayText || rawMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setQuotedText(null); // Clear quote after sending
    setLoading(true);

    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const questionContext = question
        ? { question: question.question, answer: question.answer }
        : null;

      // get conversation history inline
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'framework')
        .slice(-5)
        .map(m => ({ role: m.role === 'framework' ? 'assistant' : m.role, content: m.content }));

      const response = await aiService.chat(rawMessage, questionContext, history, controller.signal);
      const data = response.data.data;

      if (data.type === 'rewrite') {
        const rewriteMsg = {
          id: `rewrite-${Date.now()}`,
          role: 'rewrite',
          content: data.reply,
          versionAQuestion: data.versionAQuestion,
          versionAAnswer: data.versionAAnswer,
          versionBQuestion: data.versionBQuestion,
          versionBAnswer: data.versionBAnswer,
          original: data.original,
          originalQuestion: data.originalQuestion,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, rewriteMsg]);
      } else if (data.type === 'question_rewrite') {
        const qrMsg = {
          id: `question-rewrite-${Date.now()}`,
          role: 'question_rewrite',
          content: data.reply,
          rewrittenQuestion: data.rewrittenQuestion,
          originalQuestion: data.originalQuestion,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, qrMsg]);
      } else if (data.type === 'framework') {
        const fwMsg = {
          id: `framework-${Date.now()}`,
          role: 'framework',
          content: data.reply,
          newQuestion: data.newQuestion,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fwMsg]);
      } else if (data.type === 'html_render') {
        const htmlMsg = {
          id: `html-${Date.now()}`,
          role: 'html_render',
          content: data.reply,
          htmlContent: data.htmlContent,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, htmlMsg]);
      } else {
        const aiMsg = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);

        // If AI detected a new related concept, show suggestion card
        if (data.suggestion) {
          const suggestionMsg = {
            id: `suggestion-${Date.now()}`,
            role: 'suggestion',
            addToQuestion: data.suggestion.addToQuestion,
            addToAnswer: data.suggestion.addToAnswer,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, suggestionMsg]);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        // User cancelled — add a note
        setMessages(prev => [...prev, {
          id: `assistant-stop-${Date.now()}`,
          role: 'assistant',
          content: '⏹️ Request stopped.',
          timestamp: new Date()
        }]);
      } else {
        console.error('AI Chat error:', err);
        setMessages(prev => [...prev, {
          id: `assistant-err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Sorry, I couldn\'t process that request. Please try again.',
          timestamp: new Date()
        }]);
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  }, [loading, question, messages]);

  // Initial Action Hook & Global Command Listener
  useEffect(() => {
    if (initialAction && !hasFiredInitialAction.current && !loading) {
      hasFiredInitialAction.current = true;
      const actionType = typeof initialAction === 'string' ? initialAction : initialAction.action;
      const actionText = initialAction.text;
      if (actionType === 'framework') {
        sendMessage('__FRAMEWORK__', '🚀 Master this concept');
      } else if (actionType === 'rewrite_question') {
        sendMessage('__REWRITE_QUESTION__', '📝 Rewrite question from answer');
      } else if (actionType === 'ask_highlight' && actionText) {
        // Don't auto-send — set as quoted text so user can type a follow-up
        setQuotedText(actionText);
        // Focus the input
        setTimeout(() => textareaRef.current?.focus(), 100);
      } else if (actionType === 'explain') {
        sendMessage('__EXPLAIN__', '💡 Explain this question');
      } else if (actionType === 'render_html') {
        sendMessage('__RENDER_HTML__', '🎨 Could I get an interactive HTML visualization for this?');
      }
    }

    const handlePanelCommand = (e) => {
      const action = e.detail?.action;
      const text = e.detail?.text;
      if (action === 'framework') {
        sendMessage('__FRAMEWORK__', '🚀 Master this concept');
      } else if (action === 'rewrite_question') {
        sendMessage('__REWRITE_QUESTION__', '📝 Rewrite question from answer');
      } else if (action === 'ask_highlight' && text) {
        // Don't auto-send — set as quoted text so user can type a follow-up
        setQuotedText(text);
        setTimeout(() => textareaRef.current?.focus(), 100);
      } else if (action === 'explain') {
        sendMessage('__EXPLAIN__', '💡 Explain this question');
      } else if (action === 'render_html') {
        sendMessage('__RENDER_HTML__', '🎨 Could I get an interactive HTML visualization for this?');
      }
    };
    window.addEventListener('ai-panel-command', handlePanelCommand);
    return () => window.removeEventListener('ai-panel-command', handlePanelCommand);
  }, [initialAction, sendMessage, loading]);

  // Scroll to bottom when messages change or button is clicked
  const scrollToBottom = useCallback((force = false) => {
    if (messagesEndRef.current) {
      if (force === true) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      const scrollParent = messagesEndRef.current.parentElement;
      if (scrollParent) {
        // Is user scrolled up?
        const isNearBottom = scrollParent.scrollHeight - scrollParent.scrollTop - scrollParent.clientHeight < 150;
        if (isNearBottom || messages.length <= 2) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Track scroll position to toggle scroll-to-bottom button
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Show if we are scrolled up more than 150px
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBtn(isUp);
  }, []);

  // Track question changes — insert divider when question switches
  useEffect(() => {
    if (!question?._id) return;

    if (currentQuestionIdRef.current && currentQuestionIdRef.current !== question._id) {
      setMessages(prev => [
        ...prev,
        {
          id: `divider-${Date.now()}`,
          role: 'divider',
          content: '📋 Context switched to new question'
        }
      ]);
    }
    currentQuestionIdRef.current = question._id;
  }, [question?._id]);

  // Save a rewritten answer (or question-only rewrite when newAnswer is null)
  const handleSaveRewrite = useCallback(async (newAnswer, newQuestion) => {
    if (!question?._id) return;
    await aiService.saveAnswer(question._id, newAnswer, newQuestion);
    if (onAnswerSaved) {
      const updates = {};
      if (newAnswer) updates.answer = newAnswer;
      if (newQuestion) updates.question = newQuestion;
      onAnswerSaved(question._id, updates);
    }
  }, [question, onAnswerSaved]);

  // Shortcut handlers
  const handleExplain = () => sendMessage('__EXPLAIN__', '💡 Explain this question');
  const handleRewrite = () => sendMessage('__REWRITE__', '✏️ Rewrite the answer');

  // Handle Enter key (send), Shift+Enter (newline)
  const handleKeyDown = (e) => {
    const isMobile = window.innerWidth < 768; // basic mobile check

    if (e.key === 'Enter') {
      if (isMobile) {
        // Mobile: Allow default (newline). User must click send button.
        return;
      }

      // Desktop: Enter sends, Shift+Enter newline
      if (!e.shiftKey) {
        e.preventDefault();
        handleSendWithQuote();
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

  // Send with optional quoted context
  const handleSendWithQuote = useCallback(() => {
    if (quotedText && inputText.trim()) {
      // User typed a follow-up question about the quoted text
      const fullMessage = `Regarding this text:\n\n"${quotedText}"\n\n${inputText.trim()}\n\n(Context: Please explain within the context of the current question/answer)`;
      const displayMsg = `🤔 "${quotedText.length > 50 ? quotedText.slice(0, 50) + '...' : quotedText}" — ${inputText.trim()}`;
      sendMessage(fullMessage, displayMsg);
    } else if (quotedText) {
      // User sent directly without typing (just clicked send with the quote)
      const fullMessage = `What does this mean:\n\n"${quotedText}"\n\n(Context: Please explain this within the context of the current question/answer)`;
      const displayMsg = `🤔 What does "${quotedText.length > 60 ? quotedText.slice(0, 60) + '...' : quotedText}" mean?`;
      sendMessage(fullMessage, displayMsg);
    } else {
      sendMessage(inputText);
    }
  }, [quotedText, inputText, sendMessage]);

  return (
    <div className="ai-chat-panel">
      {/* ── Header ── */}
      <div className="ai-panel-header">
        <div className="ai-header-left">
          <div>
            <span className="ai-title">Code Sage</span>
            <span className="ai-subtitle">
              {loading ? 'Thinking...' : 'Your AI Study Buddy'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="ai-close-btn"
            onClick={() => setMessages([])}
            title="Clear Chat"
            disabled={loading || messages.length === 0}
            style={{ opacity: messages.length === 0 ? 0.3 : 1 }}
          >
            <FaTrash />
          </button>
          <button className="ai-close-btn" onClick={onClose} title="Close AI Panel">
            <FaTimes />
          </button>
        </div>
      </div>

      {/* ── Messages Area ── */}
      <div className="ai-panel-content" ref={panelContentRef} style={{ position: 'relative' }} onScroll={handleScroll}>
        {/* Ask AI floating button for highlighted text */}
        {highlightData && (
          <div
            style={{
              position: 'absolute',
              top: `${highlightData.top}px`,
              left: `${Math.min(Math.max(highlightData.left, 50), 250)}px`,
              transform: 'translateX(-50%)',
              zIndex: 50,
              animation: 'fadeIn 0.15s ease'
            }}
          >
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                const selectedText = highlightData.text;
                setHighlightData(null);
                window.getSelection()?.removeAllRanges();
                setQuotedText(selectedText);
                setTimeout(() => textareaRef.current?.focus(), 100);
              }}
              style={{
                background: 'var(--color-primary, #8B5CF6)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              Ask AI <FaRegQuestionCircle />
            </button>
          </div>
        )}
        {messages.length === 0 && (
          <div className="ai-empty-state">
            <p>Hey! I'm <strong>Code Sage</strong>.</p>
            <p className="ai-empty-hint">
              Ask me anything about this question, or use the shortcuts below.
            </p>
          </div>
        )}

        {messages.map(msg => {
          if (msg.role === 'rewrite') {
            return <RewriteCards key={msg.id} msg={msg} onSave={handleSaveRewrite} />;
          }
          if (msg.role === 'question_rewrite') {
            return <QuestionRewriteCards key={msg.id} msg={msg} onSave={handleSaveRewrite} />;
          }
          if (msg.role === 'framework') {
            return <FrameworkMessage key={msg.id} msg={msg} onSave={handleSaveRewrite} />;
          }
          if (msg.role === 'html_render') {
            const isAlreadySaved = question?.htmlRenders?.some(r => r.htmlContent === msg.htmlContent);
            return <HtmlRenderMessage key={msg.id} msg={msg} isAlreadySaved={isAlreadySaved} onSaveHtml={async (htmlContent) => {
              try {
                console.log(`PRE-API CALL: Attempting to save HTML render for questionId: ${question?._id}, htmlRenders length: ${question?.htmlRenders?.length || 0}`);
                const titleStr = `Html ${question?.htmlRenders?.length + 1 || 1}`;

                const apiCall = aiService.saveHtmlRender(question._id, htmlContent, titleStr);
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("API Timeout after 10000ms")), 10000));

                console.log("Awaiting Promise.race...");
                const res = await Promise.race([apiCall, timeout]);
                console.log("Promise.race resolved successfully!");

                console.log("Response from saveHtmlRender API:", res?.data);
                if (res?.data?.success && res?.data?.data?.question) {
                  console.log("Updating question with new HTML render");
                  if (onAnswerSaved) {
                    onAnswerSaved(question._id, { htmlRenders: res.data.data.question.htmlRenders });
                  }
                } else {
                  console.warn("API response did not contain success or question:", res?.data);
                }
              } catch (e) {
                console.error("ERROR inside onSaveHtml:", e);
                console.error("Error details:", e.response?.data);
                throw e; // rethrow to be caught by handleSave
              }
            }} />;
          }
          if (msg.role === 'suggestion') {
            return <SuggestionCard key={msg.id} msg={msg} question={question} onApprove={handleSaveRewrite} />;
          }
          return <ChatMessage key={msg.id} msg={msg} />;
        })}

        {loading && (
          <div className="ai-chat-message assistant">
            <div className="ai-msg-bubble ai-typing-bubble">
              <div className="ai-typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ── */}
      <div className="ai-input-area" style={{ position: 'relative' }}>
        {showScrollBtn && (
          <button
            className="ai-scroll-bottom-btn"
            onClick={() => scrollToBottom(true)}
            title="Scroll to bottom"
          >
            <FaArrowDown />
          </button>
        )}

        {/* Quoted text bar (WhatsApp-style) */}
        {quotedText && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '8px 12px',
            margin: '0 0 4px 0',
            background: 'var(--color-surface, rgba(139, 92, 246, 0.08))',
            borderLeft: '3px solid var(--color-primary, #8B5CF6)',
            borderRadius: '0 8px 8px 0',
            fontSize: '0.82rem',
            color: 'var(--color-text-secondary, #aaa)',
            lineHeight: 1.4,
            maxHeight: '80px',
            overflow: 'hidden'
          }}>
            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-primary, #8B5CF6)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Asking about</span>
              <div style={{ marginTop: '2px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                "{quotedText.length > 120 ? quotedText.slice(0, 120) + '...' : quotedText}"
              </div>
            </div>
            <button
              onClick={() => setQuotedText(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: '2px',
                fontSize: '1rem',
                lineHeight: 1,
                flexShrink: 0
              }}
              title="Remove quote"
            >
              ×
            </button>
          </div>
        )}

        {/* Text input + send */}
        <div className="ai-input-row">
          <textarea
            ref={textareaRef}
            className="ai-text-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Code Sage anything..."
            rows={2}
            disabled={loading}
          />
          {loading ? (
            <button
              className="ai-send-btn ai-stop-btn"
              onClick={() => { if (abortControllerRef.current) abortControllerRef.current.abort(); }}
              title="Stop generating"
            >
              <FaStop />
            </button>
          ) : (
            <button
              className="ai-send-btn"
              onClick={handleSendWithQuote}
              disabled={!inputText.trim() && !quotedText}
              title="Send message"
            >
              <FaPaperPlane />
            </button>
          )}
        </div>

        {/* Shortcut buttons — below input, side by side */}
        <div className="ai-shortcuts">
          <button
            className="ai-shortcut-btn explain-shortcut"
            onClick={handleExplain}
            disabled={loading}
            title="Explain this question"
          >
            <FaLightbulb /> Explain
          </button>
          <div className="ai-shortcut-split-btn">
            <button
              className="ai-shortcut-main"
              onClick={handleRewrite}
              disabled={loading}
              title="Rewrite the answer"
            >
              <FaPen /> Rewrite
            </button>
            <button
              className="ai-shortcut-side"
              onClick={() => sendMessage('__FRAMEWORK__', '🚀 Master this concept')}
              disabled={loading}
              title="Apply O(1) Mastery Framework"
            >
              F
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
