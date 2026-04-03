import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus as syntaxTheme } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { shouldUsePrism } from '../../utils/validationUtils';
import { detectCode } from '../../utils/codeDetector';

/**
 * Component to render code with syntax highlighting
 * Powered by ReactMarkdown for standard text mixed with code.
 * Restored `forceCode` and enhanced syntax colors via atomDark for dynamic bracket metrics.
 */
const CodeBlock = ({ text, language, forceCode = false }) => {
  if (!text) return null;

  const codeDetection = detectCode(text);
  const shouldHighlight = forceCode || shouldUsePrism(text);
  const hasExplicitCodeBlocks = /```/.test(text);

  // When forceCode is detected (or it mathematically scores as pure code without explicit backticks)
  // We bypass Markdown parsing and render the entire text as a single syntax highlighted block.
  if ((forceCode || shouldHighlight) && !hasExplicitCodeBlocks) {
    // Prefer explicitly passed language from markdown, then detector, then javascript
    const detectedLang = language || codeDetection?.language || 'javascript';
    return (
      <div style={{ width: '100%' }}>
        <SyntaxHighlighter
          language={detectedLang}
          style={syntaxTheme}
          wrapLongLines={true}
          customStyle={{
            borderRadius: '14px',
            padding: '20px',
            margin: '16px 0',
            fontSize: '14px',
            lineHeight: '1.6',
            background: '#0d0d12',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowX: 'hidden'
          }}
          codeTagProps={{ style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }}
        >
          {text}
        </SyntaxHighlighter>
      </div>
    );
  }

  // Mixed Markdown + Code Rendering
  return (
    <div style={{ textAlign: 'left', width: '100%', wordBreak: 'break-word', whiteSpace: 'normal' }}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({children}) => <>{children}</>,
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                style={syntaxTheme}
                language={match[1]}
                PreTag="div"
                wrapLongLines={true}
                customStyle={{
                  borderRadius: '12px',
                  padding: '16px',
                  margin: '12px 0',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  background: '#0a0a0f',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.4)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowX: 'hidden'
                }}
                codeTagProps={{ style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <span className={className} style={{
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '3px 8px',
                margin: '0 2px',
                borderRadius: '6px',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                color: '#e9d5ff',
                fontSize: '0.88em',
                whiteSpace: 'pre-wrap',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'inline-block',
                verticalAlign: 'middle'
              }} {...props}>
                {children}
              </span>
            )
          },
          p: ({children}) => <p style={{ margin: '0 0 12px 0', lineHeight: '1.7' }}>{children}</p>,
          ul: ({children}) => <ul style={{ paddingLeft: '22px', margin: '0 0 12px 0' }}>{children}</ul>,
          li: ({children}) => <li style={{ marginBottom: '6px' }}>{children}</li>
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

export default CodeBlock;
