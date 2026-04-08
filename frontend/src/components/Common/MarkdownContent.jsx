import React, { memo, useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import CodeBlock from './CodeBlock'; // Wrapping our intelligent Prism/Detection engine
import { motion, AnimatePresence } from 'framer-motion';
import '../css/markdown-content.css';
import { useSession } from '../../hooks/useSession';

const InlineDefinitionPopup = ({ dataDef, children }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isClicked, setIsClicked] = useState(false);

    useEffect(() => {
        if (!isClicked) return;
        const handler = () => setIsClicked(false);
        // Small delay to prevent immediate trigger from the open click
        setTimeout(() => window.addEventListener('click', handler), 10);
        return () => window.removeEventListener('click', handler);
    }, [isClicked]);

    const isOpen = isHovered || isClicked;

    let decodedMd = "";
    try {
        decodedMd = decodeURIComponent(escape(atob(dataDef)));
    } catch(e) {
        decodedMd = "Error parsing definition.";
    }

    return (
        <span 
            className="inline-def-wrapper"
            data-def={dataDef}
            style={{ position: 'relative', display: 'inline-block' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => { 
                e.stopPropagation(); 
                setIsClicked((prev) => !prev);
            }}
        >
            <span style={{ borderBottom: '2px dashed var(--color-primary)', cursor: 'help', color: 'var(--color-primary)' }}>
                {children}
            </span>
            <AnimatePresence>
              {isOpen && (
                  <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          marginBottom: '8px',
                          background: 'var(--color-surface, #1e1e1e)',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          width: 'max-content',
                          maxWidth: '200px',
                          zIndex: 1000,
                          color: 'var(--color-text, #fff)',
                          fontSize: '0.65rem',
                          textAlign: 'left'
                      }}
                  >
                     <div className="markdown-body markdown-compact">
                       <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
                           {decodedMd}
                       </ReactMarkdown>
                     </div>
                  </motion.div>
              )}
            </AnimatePresence>
        </span>
    );
};

// Intercept disabled GFM checkboxes and make them interactive, persisting to localStorage
const SessionCheckbox = ({ checked, questionId, lineIndex }) => {
    const { activeSession } = useSession();
    const sessionId = activeSession?._id || 'orphan';
    const storageKey = `session_checkboxes_${sessionId}_${questionId}`;
    const [isChecked, setIsChecked] = useState(checked);

    useEffect(() => {
        if (!questionId) return;
        try {
            const savedData = JSON.parse(localStorage.getItem(storageKey) || '{}');
            if (savedData[lineIndex] !== undefined) {
                setIsChecked(savedData[lineIndex]);
            }
        } catch (e) {
            console.error("Failed to load checkbox state", e);
        }
    }, [questionId, lineIndex, storageKey]);

    const handleChange = (e) => {
        const val = e.target.checked;
        setIsChecked(val);
        if (!questionId) return;
        try {
            const savedData = JSON.parse(localStorage.getItem(storageKey) || '{}');
            savedData[lineIndex] = val;
            localStorage.setItem(storageKey, JSON.stringify(savedData));
        } catch (e) {
            console.error("Failed to save checkbox state", e);
        }
    };

    return (
        <input 
            type="checkbox" 
            checked={isChecked} 
            onChange={handleChange} 
            className="ai-interactive-checkbox"
            style={{ cursor: 'pointer', accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
        />
    );
};

/**
 * @components/Common/MarkdownContent
 * 
 * Architectural Intent: "Intentional Minimalism"
 * 
 * Provides rapid, semantic parsing of raw text into heavily optimized, 
 * accessible HTML via ReactMarkdown. Leverages the AST pipeline to intercept `code` 
 * blocks, injecting the application's native `<CodeBlock>` engine (Prism-based) 
 * preventing duplicate syntax-highlighting logic.
 * 
 * Edge Cases Handled:
 * - Table Overflow: Injected wrap-container on `table` to prevent mobile breakage.
 * - FOUC/Jank: Wrapped in `React.memo` to eliminate re-rendering when parent 
 *   card state changes (e.g. flipping).
 * - Spacing: Binds to custom `.markdown-body` class for specific line-heights 
 *   and marginal mathematics, rejecting generic browser defaults.
 */
const MarkdownContent = memo(({ content, questionId, onEditCode }) => {
    if (!content) return null;

    const components = useMemo(() => ({
        // Intercept `<dfn>` inline tooltips 
        dfn({ node, children, className, "data-def": base64Def, ...props }) {
            if (className !== 'inline-def' || !base64Def) {
                return <dfn {...props}>{children}</dfn>;
            }
            return <InlineDefinitionPopup dataDef={base64Def}>{children}</InlineDefinitionPopup>;
        },
        // Intercept code nodes. 
        // (Note: `react-markdown` v10+ removed the `inline` prop. We evaluate via `match` and text shape)
        pre({ children }) {
            // Strip default `<pre>` wrappers to prevent semantic explosion since CodeBlock/SyntaxHighlighter brings its own
            return <>{children}</>;
        },
        code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : null;
            const textContent = String(children).replace(/\n$/, '');

            // Determine if it's block-level code. Definitive if it has a language tag,
            // or if it physically spans multiple lines. Single backticks will evaluate false.
            const isBlock = match || textContent.includes('\n');

            if (isBlock) {
                // Block-level code: Delegate to our robust CodeBlock engine
                return (
                    <CodeBlock
                        text={textContent}
                        language={language}
                        forceCode={true} // Bypass heuristic detection, Markdown AST confirms it's a block
                        onEditCode={onEditCode}
                    />
                );
            }

            // Inline code: Render subtle, hardware-accelerated tint
            return (
                <code className="inline-code" {...props}>
                    {children}
                </code>
            );
        },
        // Intercept tables to enforce mobile responsiveness (Overflow Trap Prevention)
        table({ children, ...props }) {
            return (
                <div className="table-responsive-wrapper">
                    <table {...props}>{children}</table>
                </div>
            );
        },
        // Enhance links with security attributes
        a({ children, href, ...props }) {
            // Basic javascript: protocol stripping handled by react-markdown safely,
            // but we enforce target_blank and rel=noreferrer for external links
            const isExternal = href && (href.startsWith('http') || href.startsWith('//'));
            return (
                <a
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    {...props}
                >
                    {children}
                </a>
            );
        },
        // Intercept inputs (specifically checkboxes rendered by remarkGfm)
        input({ node, checked, type, ...props }) {
            if (type === 'checkbox') {
                const lineIndex = node?.position?.start?.line || Math.random().toString(36).substring(7);
                return (
                    <SessionCheckbox
                        checked={checked}
                        questionId={questionId}
                        lineIndex={lineIndex}
                    />
                );
            }
            return <input type={type} checked={checked} {...props} />;
        }
    }), [onEditCode, questionId]);

    return (
        <div className="markdown-body">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
});

// Explicitly set displayName for memoized components during debugging
MarkdownContent.displayName = 'MarkdownContent';

export default MarkdownContent;
