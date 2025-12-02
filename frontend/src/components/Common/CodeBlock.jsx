import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

/**
 * Component to render code with syntax highlighting
 * Automatically detects code blocks and highlights them
 * If no code blocks found but text contains code patterns, treats entire text as code
 */
const CodeBlock = ({ text, language = 'javascript', forceCode = false }) => {
  if (!text) return null;

  // Check if text contains code blocks (```code```)
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  const inlineCodeRegex = /`([^`]+)`/g;
  
  // If forceCode is true and no code blocks, treat entire text as code
  if (forceCode && !codeBlockRegex.test(text)) {
    return (
      <div className="code-block-container">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            borderRadius: '8px',
            padding: '16px',
            margin: '12px 0',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
        >
          {text}
        </SyntaxHighlighter>
      </div>
    );
  }
  
  // Reset regex (they have global flag)
  codeBlockRegex.lastIndex = 0;
  
  // Split text into parts (code and non-code)
  const parts = [];
  let lastIndex = 0;
  let match;

  // Find all code blocks
  const codeBlocks = [];
  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push({
      start: match.index,
      end: match.index + match[0].length,
      language: match[1] || language,
      code: match[2].trim(),
      fullMatch: match[0]
    });
  }

  // Build parts array
  if (codeBlocks.length === 0) {
    // No code blocks, check for inline code
    const inlineParts = [];
    let inlineLastIndex = 0;
    let inlineMatch;

    while ((inlineMatch = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (inlineMatch.index > inlineLastIndex) {
        inlineParts.push({
          type: 'text',
          content: text.substring(inlineLastIndex, inlineMatch.index)
        });
      }
      // Add inline code
      inlineParts.push({
        type: 'inline-code',
        content: inlineMatch[1]
      });
      inlineLastIndex = inlineMatch.index + inlineMatch[0].length;
    }
    // Add remaining text
    if (inlineLastIndex < text.length) {
      inlineParts.push({
        type: 'text',
        content: text.substring(inlineLastIndex)
      });
    }

    return (
      <div className="code-block-container">
        {inlineParts.map((part, idx) => {
          if (part.type === 'inline-code') {
            return (
              <code key={idx} className="inline-code">
                {part.content}
              </code>
            );
          }
          return <span key={idx}>{part.content}</span>;
        })}
      </div>
    );
  }

  // Process code blocks
  codeBlocks.forEach((block, idx) => {
    // Add text before code block
    if (block.start > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, block.start)
      });
    }
    // Add code block
    parts.push({
      type: 'code',
      language: block.language,
      code: block.code
    });
    lastIndex = block.end;
  });

  // Add remaining text after last code block
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return (
    <div className="code-block-container">
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          return (
            <SyntaxHighlighter
              key={idx}
              language={part.language || language}
              style={vscDarkPlus}
              customStyle={{
                borderRadius: '8px',
                padding: '16px',
                margin: '12px 0',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            >
              {part.code}
            </SyntaxHighlighter>
          );
        }
        return (
          <div key={idx} className="text-content" style={{ whiteSpace: 'pre-wrap' }}>
            {part.content}
          </div>
        );
      })}
    </div>
  );
};

export default CodeBlock;

