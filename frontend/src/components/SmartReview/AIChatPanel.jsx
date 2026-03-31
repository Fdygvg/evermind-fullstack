// frontend/src/components/SmartReview/AIChatPanel.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FaRobot, FaTimes, FaLightbulb, FaPen, FaPaperPlane,
  FaSpinner, FaCopy, FaCheck, FaSave
} from 'react-icons/fa';
import { aiService } from '../../services/aiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
        {language && <span className="ai-code-lang">{language}</span>}
        <button className="ai-code-copy-btn" onClick={handleCopy} title="Copy code">
          {copied ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
        </button>
      </div>
      <pre className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'hidden' }} {...props}>
        <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{children}</code>
      </pre>
    </div>
  );
};

// ─── Rewrite cards (Single Tabbed Box) ───
const RewriteCards = ({ msg, onSave }) => {
  const [activeTab, setActiveTab] = useState('A'); // A = Short, B = Concise
  const [saving, setSaving] = useState(false);
  const [savedVersion, setSavedVersion] = useState(null);

  const handleSave = async () => {
    if (saving || savedVersion === activeTab) return;
    const newAnswer = activeTab === 'A' ? msg.versionA : msg.versionB;
    setSaving(true);
    try {
      await onSave(newAnswer);
      setSavedVersion(activeTab);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentContent = activeTab === 'A' ? msg.versionA : msg.versionB;
  const isCurrentlySaved = savedVersion === activeTab;

  return (
    <div className="ai-chat-message assistant">
      <FaRobot className="ai-msg-avatar" />
      <div className="ai-msg-bubble ai-rewrite-bubble">
        <div className="ai-msg-text" style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
          Here is a rewritten suggestion. Choose a style below:
        </div>
        <div className={`ai-rewrite-card ${isCurrentlySaved ? 'saved' : ''}`}>
          <div className="ai-rewrite-card-body ai-markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlockRenderer }}>
              {currentContent}
            </ReactMarkdown>
          </div>
          <div className="ai-rewrite-footer">
            <div className="ai-rewrite-tabs">
              <button 
                className={`ai-tab-btn ${activeTab === 'A' ? 'active' : ''}`}
                onClick={() => setActiveTab('A')}
                title="Short"
              >
                Short
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
      {!isUser && <FaRobot className="ai-msg-avatar" />}
      <div className="ai-msg-bubble">
        {isUser ? (
          <div className="ai-msg-text">{msg.displayText || msg.content}</div>
        ) : (
          <div className="ai-msg-text ai-markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
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
}) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const currentQuestionIdRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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

  // Build conversation history from messages (last 5, excluding dividers/rewrite)
  const getConversationHistory = useCallback(() => {
    return messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-5)
      .map(m => ({ role: m.role, content: m.content }));
  }, [messages]);

  // Save a rewritten answer
  const handleSaveRewrite = useCallback(async (newAnswer) => {
    if (!question?._id) return;
    await aiService.saveAnswer(question._id, newAnswer);
    if (onAnswerSaved) {
      onAnswerSaved(question._id, { answer: newAnswer });
    }
  }, [question, onAnswerSaved]);

  // Send a message to the AI
  const sendMessage = useCallback(async (rawMessage, displayText = null) => {
    if (!rawMessage.trim() || loading) return;

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

    try {
      const questionContext = question
        ? { question: question.question, answer: question.answer }
        : null;

      const history = getConversationHistory();
      const response = await aiService.chat(rawMessage, questionContext, history);
      const data = response.data.data;

      if (data.type === 'rewrite') {
        // Rewrite response — add as a special message with version cards
        const rewriteMsg = {
          id: `rewrite-${Date.now()}`,
          role: 'rewrite',
          content: data.reply,
          versionA: data.versionA,
          versionB: data.versionB,
          original: data.original,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, rewriteMsg]);
      } else {
        // Normal chat response
        const aiMsg = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error('AI Chat error:', err);
      const errorMsg = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Sorry, I couldn\'t process that request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading, question, getConversationHistory]);

  // Shortcut handlers
  const handleExplain = () => sendMessage('__EXPLAIN__', '💡 Explain this question');
  const handleRewrite = () => sendMessage('__REWRITE__', '✏️ Rewrite the answer');

  // Handle Enter key (send), Shift+Enter (newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
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
          <FaRobot className="ai-avatar" />
          <div>
            <span className="ai-title">Code Sage</span>
            <span className="ai-subtitle">
              {loading ? 'Thinking...' : 'Your AI Study Buddy'}
            </span>
          </div>
        </div>
        <button className="ai-close-btn" onClick={onClose} title="Close AI Panel">
          <FaTimes />
        </button>
      </div>

      {/* ── Messages Area ── */}
      <div className="ai-panel-content">
        {messages.length === 0 && (
          <div className="ai-empty-state">
            <FaRobot className="ai-empty-icon" />
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
          return <ChatMessage key={msg.id} msg={msg} />;
        })}

        {loading && (
          <div className="ai-chat-message assistant">
            <FaRobot className="ai-msg-avatar" />
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
      <div className="ai-input-area">
        {/* Text input + send */}
        <div className="ai-input-row">
          <textarea
            ref={textareaRef}
            className="ai-text-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Code Sage anything..."
            rows={1}
            disabled={loading}
          />
          <button
            className="ai-send-btn"
            onClick={() => sendMessage(inputText)}
            disabled={loading || !inputText.trim()}
            title="Send message"
          >
            {loading ? <FaSpinner className="ai-spinner" /> : <FaPaperPlane />}
          </button>
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
          <button
            className="ai-shortcut-btn rewrite-shortcut"
            onClick={handleRewrite}
            disabled={loading}
            title="Rewrite the answer"
          >
            <FaPen /> Rewrite
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
