import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus as syntaxTheme } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { shouldUsePrism } from '../../utils/validationUtils';
import { detectCode } from '../../utils/codeDetector';
import { FaCopy, FaPen, FaSave, FaTimes } from 'react-icons/fa';

/**
 * Component to render code with syntax highlighting.
 * Edit mode uses a native <textarea> to avoid cursor/overlay issues.
 */
const CodeBlock = ({ text, language, forceCode = false, onEditCode }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableCode, setEditableCode] = useState(text || '');

  if (!text) return null;

  // Freeze language detection to initial render only
  const [detectedLang] = useState(() => {
    if (language) return language;
    return detectCode(text)?.language || 'javascript';
  });

  const shouldHighlight = forceCode || shouldUsePrism(text);
  const hasExplicitCodeBlocks = /```/.test(text) && !forceCode;

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(isEditing ? editableCode : text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[CodeBlock] Save clicked. Changed:', editableCode !== text);
    if (editableCode !== text) {
      // Dispatch via DOM event (bypasses memo/useMemo prop chain issues)
      window.dispatchEvent(new CustomEvent('code-block-save', {
        detail: { oldCode: text, newCode: editableCode }
      }));
      console.log('[CodeBlock] Dispatched code-block-save event');
    }
    setIsEditing(false);
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditableCode(text); // revert
    setIsEditing(false);
  };

  const handleStartEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditableCode(text); // sync to latest prop
    setIsEditing(true);
  };

  // Shared highlighter style for read-only mode
  const highlighterStyleProps = {
    customStyle: {
      margin: 0,
      padding: '20px',
      background: 'transparent',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      overflowX: 'hidden'
    },
    codeTagProps: {
      style: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: '"JetBrains Mono", "Fira Code", monospace'
      }
    }
  };

  // Header with language tag + action buttons
  const CodeHeader = () => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: 'rgba(0,0,0,0.5)', padding: '6px 14px',
      borderTopLeftRadius: '14px', borderTopRightRadius: '14px',
      borderBottom: '1px solid rgba(255,255,255,0.06)'
    }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {detectedLang}
      </span>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              title="Save Changes"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#10B981',
                display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.2s',
                fontSize: '0.7rem', fontWeight: 600
              }}
            >
              <FaSave size={13} /> Save
            </button>
            <button
              onClick={handleCancel}
              title="Cancel Editing"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.2s',
                fontSize: '0.7rem', fontWeight: 600
              }}
            >
              <FaTimes size={13} /> Cancel
            </button>
          </>
        ) : (
          <button
            onClick={handleStartEdit}
            title="Edit Code"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', transition: 'color 0.2s'
            }}
          >
            <FaPen size={12} />
          </button>
        )}
        <button
          onClick={handleCopy}
          title="Copy Code"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: isCopied ? '#8B5CF6' : 'rgba(255,255,255,0.6)',
            display: 'flex', alignItems: 'center', transition: 'color 0.2s'
          }}
        >
          <FaCopy size={13} />
          {isCopied && <span style={{ fontSize: '0.7rem', marginLeft: '6px' }}>Copied</span>}
        </button>
      </div>
    </div>
  );

  // Pure Code Block (Bypass Markdown)
  if ((forceCode || shouldHighlight) && !hasExplicitCodeBlocks) {
    return (
      <div
        style={{
          width: '100%', margin: '16px 0', background: '#0d0d12',
          borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => { if (isEditing) e.stopPropagation(); }}
      >
        <CodeHeader />
        {isEditing ? (
          <textarea
            value={editableCode}
            onChange={(e) => setEditableCode(e.target.value)}
            autoFocus
            spellCheck={false}
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '20px',
              margin: 0,
              background: '#0d0d12',
              color: '#d4d4d4',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              boxSizing: 'border-box',
              tabSize: 2
            }}
            onKeyDown={(e) => {
              // Allow Tab key for indentation
              if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                const val = editableCode;
                setEditableCode(val.substring(0, start) + '  ' + val.substring(end));
                // Restore cursor position after React re-renders
                requestAnimationFrame(() => {
                  e.target.selectionStart = e.target.selectionEnd = start + 2;
                });
              }
            }}
          />
        ) : (
          <SyntaxHighlighter
            language={detectedLang}
            style={syntaxTheme}
            wrapLongLines={true}
            {...highlighterStyleProps}
          >
            {text}
          </SyntaxHighlighter>
        )}
      </div>
    );
  }

  // Mixed Markdown + Code Rendering
  return (
    <div style={{ textAlign: 'left', width: '100%', wordBreak: 'break-word', whiteSpace: 'normal' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : 'text';

            return !inline && match ? (
              <div style={{
                margin: '12px 0', background: '#0a0a0f',
                borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.4)', overflow: 'hidden'
              }}>
                <CodeHeader />
                {isEditing ? (
                  <textarea
                    value={editableCode}
                    onChange={(e) => setEditableCode(e.target.value)}
                    autoFocus
                    spellCheck={false}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '20px',
                      margin: 0,
                      background: '#0a0a0f',
                      color: '#d4d4d4',
                      border: 'none',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      boxSizing: 'border-box',
                      tabSize: 2
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const start = e.target.selectionStart;
                        const end = e.target.selectionEnd;
                        const val = editableCode;
                        setEditableCode(val.substring(0, start) + '  ' + val.substring(end));
                        requestAnimationFrame(() => {
                          e.target.selectionStart = e.target.selectionEnd = start + 2;
                        });
                      }
                    }}
                  />
                ) : (
                  <SyntaxHighlighter
                    style={syntaxTheme}
                    language={lang}
                    PreTag="div"
                    wrapLongLines={true}
                    {...highlighterStyleProps}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                )}
              </div>
            ) : (
              <span className={className} style={{
                background: 'rgba(255, 255, 255, 0.08)', padding: '3px 8px', margin: '0 2px',
                borderRadius: '6px', fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                color: '#e9d5ff', fontSize: '0.88em', whiteSpace: 'pre-wrap',
                border: '1px solid rgba(255,255,255,0.05)', display: 'inline-block', verticalAlign: 'middle'
              }} {...props}>
                {children}
              </span>
            );
          },
          p: ({ children }) => <p style={{ margin: '0 0 12px 0', lineHeight: '1.7' }}>{children}</p>,
          ul: ({ children }) => <ul style={{ paddingLeft: '22px', margin: '0 0 12px 0' }}>{children}</ul>,
          li: ({ children }) => <li style={{ marginBottom: '6px' }}>{children}</li>
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

export default CodeBlock;
