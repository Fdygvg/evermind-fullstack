// frontend/src/components/SmartReview/AIChatPanel.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FaRobot, FaTimes, FaLightbulb, FaPen, FaPaperPlane,
  FaSpinner, FaCopy, FaCheck, FaSave, FaTrash, FaStop, FaArrowDown
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

// ─── Question Rewrite cards (V1 / V2 — question only) ───
const QuestionRewriteCards = ({ msg, onSave }) => {
  const [activeTab, setActiveTab] = useState('V1');
  const [saving, setSaving] = useState(false);
  const [savedVersion, setSavedVersion] = useState(null);

  const handleSave = async () => {
    if (saving || savedVersion === activeTab) return;
    const newQuestion = activeTab === 'V1' ? msg.v1Question : msg.v2Question;
    setSaving(true);
    try {
      // Save question only (pass null for answer so it doesn't change)
      await onSave(null, newQuestion);
      setSavedVersion(activeTab);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentQuestion = activeTab === 'V1' ? msg.v1Question : msg.v2Question;
  const isCurrentlySaved = savedVersion === activeTab;

  return (
    <div className="ai-chat-message assistant">
      <div className="ai-msg-bubble ai-rewrite-bubble">
        <div className="ai-msg-text" style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          📝 Here are two rewritten versions of your question:
        </div>
        <div className={`ai-rewrite-card ${isCurrentlySaved ? 'saved' : ''}`}>
          <div className="ai-rewrite-card-body ai-markdown-content">
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>Rewritten Question</span>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlockRenderer }}>
                {currentQuestion}
              </ReactMarkdown>
            </div>
          </div>
          <div className="ai-rewrite-footer">
            <div className="ai-rewrite-tabs">
              <button
                className={`ai-tab-btn ${activeTab === 'V1' ? 'active' : ''}`}
                onClick={() => setActiveTab('V1')}
                title="Version 1"
              >
                V1
              </button>
              <button
                className={`ai-tab-btn ${activeTab === 'V2' ? 'active' : ''}`}
                onClick={() => setActiveTab('V2')}
                title="Version 2"
              >
                V2
              </button>
            </div>
            <button
              className="ai-rewrite-save-btn"
              onClick={handleSave}
              disabled={saving || isCurrentlySaved}
            >
              {saving ? <FaSpinner className="ai-spinner" /> :
                isCurrentlySaved ? <><FaCheck /> Saved</> :
                  <><FaSave /> Use This Question</>}
            </button>
          </div>
        </div>
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
              top: rect.top - panelRect.top + panelContentRef.current.scrollTop - 40,
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
          v1Question: data.v1Question,
          v2Question: data.v2Question,
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
      } else {
        const aiMsg = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
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
        sendMessage(`What does this mean:\n\n"${actionText}"\n\n(Context: Please explain this within the context of the current question/answer)`, `🤔 What does "${actionText}" mean?`);
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
        sendMessage(`What does this mean:\n\n"${text}"\n\n(Context: Please explain this within the context of the current question/answer)`, `🤔 What does "${text}" mean?`);
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
        sendMessage(inputText);
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
                sendMessage(
                  `What does this mean:\n\n"${selectedText}"\n\n(Context: Please explain this within the context of the current question/answer)`,
                  `🤔 What does "${selectedText}" mean?`
                );
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
              <strong>Ask AI🤔</strong>
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
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim()}
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
